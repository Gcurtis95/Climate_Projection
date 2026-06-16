import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import ChatOpenAI
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv
import chromadb
from pydantic import SecretStr
import pypdf, pypdf.filters
pypdf.filters.ZLIB_MAX_OUTPUT_LENGTH = 0



from typing import List
from pydantic import BaseModel, Field


load_dotenv()

api_key = os.getenv("CHROMA_API_KEY")
tenant = os.getenv("CHROMA_TENANT")
database = os.getenv("DATABASE")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")



chroma_client = chromadb.CloudClient(
  api_key=api_key,
  tenant=tenant,
  database=database
)
class ClimatePaperMetadata(BaseModel):
    models: List[str] = Field(description="List of CMIP6 models mentioned (e.g., MPI-ESM1-2-HR, CESM2)")
    variables: List[str] = Field(description="Climate variables discussed (e.g., tas, pr, sfcWind)")
    region: str = Field(description="Primary geographic focus (e.g., Global, Arctic, Europe)")
    summary: str = Field(description="A 1-sentence summary of the model's performance/bias found in this paper.")

# Initialize
llm = ChatOpenAI(model="gpt-4o", temperature=0)
structured_llm = llm.with_structured_output(ClimatePaperMetadata)
vectorstore = Chroma(collection_name="nasa_climate_rag", embedding_function=OpenAIEmbeddings(), chroma_cloud_api_key=api_key, tenant=tenant, database=database)

directory_path = "/Users/garincurtis/Documents/Front End Development/climate_projections/chromaDB_scripts/documents"

def process_papers(directory_path):
    for filename in os.listdir(directory_path):
        if filename.endswith(".pdf"):
            file_path = os.path.join(directory_path, filename)
            
            loader = PyPDFLoader(file_path)
            pages = loader.load()
            sample_text = " ".join([page.page_content for page in pages[:2]])
            

            print(f"Extracting metadata for: {filename}...")
            metadata_obj = structured_llm.invoke(f"Extract climate model info from this text: {sample_text}")
            
            for page in pages:
                vectorstore.add_texts(
                    texts=[page.page_content],
                    metadatas=[{
                        "models": ", ".join(metadata_obj.models),
                        "variables": ", ".join(metadata_obj.variables),
                        "region": metadata_obj.region,
                        "insight": metadata_obj.summary
                    }]
                )


process_papers(directory_path)