import chromadb
import os
from dotenv import load_dotenv
import chromadb.utils.embedding_functions as embedding_functions

load_dotenv()


CHROMA_OPENAI_API_KEY = os.getenv("CHROMA_OPENAI_API_KEY")
api_key = os.getenv("CHROMA_API_KEY")
tenant = os.getenv("CHROMA_TENANT")
database = os.getenv("DATABASE")

chroma_client = chromadb.CloudClient(
  api_key=api_key,
  tenant=tenant,
  database=database
)

# openai_ef = embedding_functions.OpenAIEmbeddingFunction(
#                 api_key=CHROMA_OPENAI_API_KEY,
#                 model_name="text-embedding-3-large"
#             )


collection = chroma_client.get_or_create_collection(name="climate_collection")

def retrieval_vector_db(vector_db_query):
      
  results = collection.query(
  query_texts=[vector_db_query.output_text], 
      n_results=5
      )
  print(f"""
        
        
        
        
        vector database return
      
     


      {results}
        
        
        
        
        
        """)
  return results