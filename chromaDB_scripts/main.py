import chromadb
import os
from dotenv import load_dotenv
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import pypdf, pypdf.filters
pypdf.filters.ZLIB_MAX_OUTPUT_LENGTH = 0

folder_path = "/Users/garincurtis/Documents/Front End Development/climate_projections/chromaDB_scripts/documents"

documents = []

for file in os.listdir(folder_path): 
    if file.endswith('.pdf'):
        pdf_path = os.path.join(folder_path, file)
        loader = PyPDFLoader(pdf_path)
        documents.extend(loader.load())
        print(pdf_path)



print(len(documents))

# print(documents[2])

# file_path = "./documents/Population-Weighted Degree-Days over Southeast Europe.pdf"
# loader = PyPDFLoader(file_path)

# docs = loader.load()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000, chunk_overlap=200, add_start_index=True
)

# all_splits = text_splitter.split_documents(docs)

# print(len(all_splits))
# # print(len(docs))

# # print(f"{docs[5].page_content[:1000]}\n")
# # # print(docs[2].metadata)

# load_dotenv()

api_key = os.getenv("CHROMA_API_KEY")
tenant = os.getenv("CHROMA_TENANT")
database = os.getenv("DATABASE")

# chroma_client = chromadb.CloudClient(
#   api_key=api_key,
#   tenant=tenant,
#   database=database
# )

# collection = chroma_client.get_or_create_collection(
#     name="climate_collection",
#     embedding_function=OpenAIEmbeddingFunction(
#     model_name="text-embedding-3-small"
#     ))




