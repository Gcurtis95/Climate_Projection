import chromadb
import os
from dotenv import load_dotenv
import chromadb.utils.embedding_functions as ef
from langchain_openai import OpenAIEmbeddings

load_dotenv()

CHROMA_OPENAI_API_KEY = os.getenv("CHROMA_OPENAI_API_KEY")
api_key = os.getenv("CHROMA_API_KEY")
tenant = os.getenv("CHROMA_TENANT")
database = os.getenv("DATABASE")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

openai_ef = ef.OpenAIEmbeddingFunction(
    api_key=OPENAI_API_KEY,
    model_name="text-embedding-3-small"
)

chroma_client = chromadb.CloudClient(
    api_key=api_key,
    tenant=tenant,
    database=database,
)

embedding_function = OpenAIEmbeddings(model="text-embedding-3-small")

collection = chroma_client.get_or_create_collection(
    name="nasa_climate_rag",
    embedding_function=openai_ef,
)


def retrieval_vector_db(result, model: str):
    query = str(result.Query)
    model_str = str(model)
    print(f"RAG region: {result.Region} | model filter: {model_str}")

    # Attempt 1: model-filtered search — surfaces chunks that explicitly discuss this model
    try:
        filtered = collection.query(
            query_texts=[query],
            n_results=8,
            where={"models": {"$contains": model_str}},
        )
        if filtered["documents"] and filtered["documents"][0]:
            print(f"RAG: {len(filtered['documents'][0])} model-filtered chunks returned")
            return filtered["documents"]
    except Exception as e:
        print(f"RAG model filter failed ({e}), falling back to unfiltered search")

    # Fallback: unfiltered semantic search
    unfiltered = collection.query(
        query_texts=[query],
        n_results=10,
    )
    print(f"RAG: {len(unfiltered['documents'][0]) if unfiltered['documents'] else 0} unfiltered chunks returned")
    return unfiltered["documents"]
