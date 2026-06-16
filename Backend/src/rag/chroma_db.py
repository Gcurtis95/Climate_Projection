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
  database=database
)

embedding_function = OpenAIEmbeddings(model="text-embedding-3-small")



collection = chroma_client.get_or_create_collection(name="nasa_climate_rag",
                                                    embedding_function=openai_ef)

def retrieval_vector_db(result, model):

  print(result.Region)

  query = str(result.Query)
  model_str = str(model)
  region = str(result.Region)
      
  results = collection.query(
      query_texts=[query],
      n_results=10,
  )
  print(f"""
        
        
        
        
        vector database return
      
     


      {results["documents"]}
        
        
        
        
        
        """)
  return results["documents"]