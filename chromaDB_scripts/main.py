"""
ChromaDB ingestion script for NASA/GDDP-CMIP6 research papers.

Usage:
  python main.py                  # process new / changed PDFs only
  python main.py --reset          # delete collection and re-ingest everything

Changes vs original:
  - Proper text chunking (1200 char chunks, 200 char overlap) instead of full pages
  - Metadata extracted from first 5 pages + last 2 pages (not just first 2)
  - MD5 hash-based dedup: unchanged files are skipped on re-runs
  - Deterministic chunk IDs enable safe upsert (no duplicates on re-run)
  - source / chunk_index added to metadata for traceability
  - Raw chromadb client (matches retrieval code embedding function exactly)
"""

import os
import sys
import hashlib
import json
import argparse
from pathlib import Path
from typing import List

from langchain_openai import ChatOpenAI
import pypdf
import pypdf.filters
import chromadb
import chromadb.utils.embedding_functions as ef
from dotenv import load_dotenv
from pydantic import BaseModel, Field

pypdf.filters.ZLIB_MAX_OUTPUT_LENGTH = 0  # disable decompression bomb guard for large PDFs


class _Page:
    def __init__(self, content: str):
        self.page_content = content


def load_pdf(file_path: str) -> List["_Page"]:
    reader = pypdf.PdfReader(file_path)
    return [_Page(page.extract_text() or "") for page in reader.pages]

load_dotenv()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

CHUNK_SIZE = 1200        # target characters per chunk
CHUNK_OVERLAP = 200      # overlap between adjacent chunks
METADATA_PAGES = 5       # pages sampled for metadata (abstract + intro)
BATCH_SIZE = 50          # chunks per Chroma upsert call
DOCUMENTS_DIR = Path(__file__).parent / "documents"
PROCESSED_LOG = Path(__file__).parent / "processed_files.json"
COLLECTION_NAME = "nasa_climate_rag"

# ---------------------------------------------------------------------------
# Clients
# ---------------------------------------------------------------------------

api_key = os.getenv("CHROMA_API_KEY")
tenant = os.getenv("CHROMA_TENANT")
database = os.getenv("DATABASE")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

chroma_client = chromadb.CloudClient(api_key=api_key, tenant=tenant, database=database)

# Use the same embedding function as chroma_db.py in the backend
openai_ef = ef.OpenAIEmbeddingFunction(
    api_key=OPENAI_API_KEY,
    model_name="text-embedding-3-small",
)

llm = ChatOpenAI(model="gpt-4o", temperature=0)


# ---------------------------------------------------------------------------
# Metadata schema
# ---------------------------------------------------------------------------

class ClimatePaperMetadata(BaseModel):
    models: List[str] = Field(
        description="CMIP6 models evaluated or discussed (e.g., MPI-ESM1-2-HR, EC-Earth3). "
                    "Empty list if none mentioned."
    )
    variables: List[str] = Field(
        description="Climate variables discussed (e.g., tas, pr, sfcWind, hurs, tasmax)."
    )
    region: str = Field(
        description="Primary geographic region. Use one of: Global, Arctic, Antarctica, "
                    "Europe, North America, South America, Africa, Middle East, "
                    "South Asia, East Asia, Southeast Asia, Australia, Pacific Ocean."
    )
    summary: str = Field(
        description="One sentence: the main model bias, limitation, or lesson learned "
                    "that a climate analyst would find useful."
    )


structured_llm = llm.with_structured_output(ClimatePaperMetadata)


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

def chunk_text(text: str) -> List[str]:
    """
    Recursive character splitter with overlap. Tries to split on progressively
    finer boundaries so chunks stay semantically coherent.
    """
    separators = ["\n\n\n", "\n\n", "\n", ". ", " "]

    def _split(text: str, seps: List[str]) -> List[str]:
        if not text.strip():
            return []
        if len(text) <= CHUNK_SIZE:
            return [text.strip()]

        for sep in seps:
            if sep not in text:
                continue

            parts = text.split(sep)
            chunks: List[str] = []
            current = ""

            for part in parts:
                candidate = current + (sep if current else "") + part
                if len(candidate) <= CHUNK_SIZE:
                    current = candidate
                else:
                    if current:
                        chunks.append(current.strip())
                    if len(part) > CHUNK_SIZE:
                        # Part is itself too large — recurse with remaining separators
                        remaining = seps[seps.index(sep) + 1:]
                        chunks.extend(_split(part, remaining))
                        current = ""
                    else:
                        current = part

            if current:
                chunks.append(current.strip())

            return [c for c in chunks if c]

        # No separator worked — hard split at character boundary
        return [
            text[i: i + CHUNK_SIZE].strip()
            for i in range(0, len(text), CHUNK_SIZE)
            if text[i: i + CHUNK_SIZE].strip()
        ]

    raw = _split(text, separators)

    # Add overlap: prepend tail of previous chunk to current chunk
    result: List[str] = []
    for i, chunk in enumerate(raw):
        if i > 0 and CHUNK_OVERLAP > 0:
            tail = raw[i - 1][-CHUNK_OVERLAP:]
            chunk = tail + " " + chunk
            if len(chunk) > CHUNK_SIZE:
                chunk = chunk[:CHUNK_SIZE]
        result.append(chunk.strip())

    return [c for c in result if c]


# ---------------------------------------------------------------------------
# Metadata extraction
# ---------------------------------------------------------------------------

def extract_metadata(pages) -> ClimatePaperMetadata:
    """
    Sample the first METADATA_PAGES pages and the last 2 pages (captures abstract,
    introduction, and conclusion / discussion where biases are summarised).
    """
    sample = list(pages[:METADATA_PAGES])
    if len(pages) > METADATA_PAGES + 2:
        sample += list(pages[-2:])

    text = "\n\n".join(p.page_content for p in sample)
    text = text[:8000]  # stay within GPT-4o context budget

    return structured_llm.invoke(
        f"""You are extracting structured metadata from a climate science research paper.

Focus on:
1. Which CMIP6 models are *evaluated* (not just mentioned in passing)
2. Which climate variables are the main subject
3. The primary geographic region of the study
4. The single most important model bias or lesson learned

Paper excerpt (abstract + introduction + conclusion):
{text}"""
    )


# ---------------------------------------------------------------------------
# Deduplication helpers
# ---------------------------------------------------------------------------

def file_md5(path: str) -> str:
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()


def load_log() -> dict:
    return json.loads(PROCESSED_LOG.read_text()) if PROCESSED_LOG.exists() else {}


def save_log(log: dict):
    PROCESSED_LOG.write_text(json.dumps(log, indent=2))


# ---------------------------------------------------------------------------
# Main ingestion
# ---------------------------------------------------------------------------

def get_or_create_collection():
    return chroma_client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=openai_ef,
    )


def process_papers(reset: bool = False):
    if reset:
        print("--reset: deleting existing collection...")
        try:
            chroma_client.delete_collection(COLLECTION_NAME)
        except Exception:
            pass  # collection may not exist yet
        save_log({})
        print("Collection deleted. Re-ingesting all files.\n")

    collection = get_or_create_collection()
    processed = load_log()

    pdf_files = sorted(
        f for f in os.listdir(DOCUMENTS_DIR) if f.lower().endswith(".pdf")
    )

    unchanged = sum(
        1 for f in pdf_files
        if processed.get(f) == file_md5(str(DOCUMENTS_DIR / f))
    )
    print(f"Found {len(pdf_files)} PDFs — {unchanged} unchanged, "
          f"{len(pdf_files) - unchanged} to process.\n")

    for filename in pdf_files:
        file_path = str(DOCUMENTS_DIR / filename)
        fhash = file_md5(file_path)

        if processed.get(filename) == fhash:
            print(f"  ✓  {filename}  (skipped — unchanged)")
            continue

        print(f"\n  →  {filename}")

        # Load PDF
        try:
            pages = load_pdf(file_path)
        except Exception as e:
            print(f"     ✗  Load failed: {e}")
            continue

        if not pages:
            print(f"     ✗  No pages extracted")
            continue

        # Extract document-level metadata
        print(f"     Extracting metadata from "
              f"{min(len(pages), METADATA_PAGES + 2)} / {len(pages)} pages...")
        try:
            meta = extract_metadata(pages)
        except Exception as e:
            print(f"     ✗  Metadata extraction failed: {e}")
            continue

        print(f"     Models   : {', '.join(meta.models) or '—'}")
        print(f"     Variables: {', '.join(meta.variables) or '—'}")
        print(f"     Region   : {meta.region}")
        print(f"     Insight  : {meta.summary[:80]}...")

        # Chunk the full document text
        full_text = "\n\n".join(p.page_content for p in pages)
        chunks = chunk_text(full_text)
        print(f"     {len(pages)} pages → {len(chunks)} chunks "
              f"(size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})")

        base_metadata = {
            "models": ", ".join(meta.models),
            "variables": ", ".join(meta.variables),
            "region": meta.region,
            "insight": meta.summary,
            "source": filename,
            "total_chunks": len(chunks),
        }

        # Deterministic IDs: hash filename to stay under ChromaDB's 128-byte ID limit
        file_hash = hashlib.md5(filename.encode()).hexdigest()[:16]
        ids = [f"{file_hash}::{i}" for i in range(len(chunks))]
        metadatas = [{**base_metadata, "chunk_index": i} for i in range(len(chunks))]

        # Upsert in batches
        for start in range(0, len(chunks), BATCH_SIZE):
            end = min(start + BATCH_SIZE, len(chunks))
            collection.upsert(
                ids=ids[start:end],
                documents=chunks[start:end],
                metadatas=metadatas[start:end],
            )
            print(f"     Upserted chunks {start}–{end - 1}")

        processed[filename] = fhash
        save_log(processed)
        print(f"     ✓  Done")

    total = collection.count()
    print(f"\nIngestion complete. Collection '{COLLECTION_NAME}' contains {total} chunks.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest climate PDFs into ChromaDB.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete the collection and re-ingest all PDFs from scratch.",
    )
    args = parser.parse_args()
    process_papers(reset=args.reset)
