from dotenv import load_dotenv
from google import genai
from google.genai import types
import json, os , asyncio
from pydantic import BaseModel, Field
from rag.chroma_db import retrieval_vector_db


load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client()

grounding_tool = types.Tool(
    google_search=types.GoogleSearch()
        )



def gemini_get_completion(prompt, response_mime_type, tool, response_json_schema,system_prompt):

    response = client.models.generate_content(
        model="gemini-2.5-flash", 
        contents=prompt,
        config=types.GenerateContentConfig(
        response_mime_type=response_mime_type,
        response_json_schema=response_json_schema,
        tools=tool,
        system_instruction=system_prompt
        ),
        )

    return response



class Model(BaseModel):
    model: str = Field(description="the name of the CMIP6 model")



def model_select(location_date_data):
    


    prompt = f"""

 here is the location data{location_date_data}
 Name of the CMIP6 models are below which one would you recommend based on the given location data for me to use in my google
    earth engine analysis of climate projections for ssp245:

                  ACCESS-CM2
                  ACCESS-ESM1-5
                  CMCC-CM2-SR5
                  CMCC-ESM2
                  CNRM-CM6-1
                  CNRM-ESM2-1
                  CanESM5
                  EC-Earth3
                  EC-Earth3-Veg-LR
                  FGOALS-g3
                  GFDL-CM4 (see grid_label for additional information)
                  GFDL-ESM4
                  GISS-E2-1-G
                  HadGEM3-GC31-LL
                  HadGEM3-GC31-MM
                  INM-CM4-8
                  INM-CM5-0
                  KACE-1-0-G
                  MIROC-ES2L
                  MPI-ESM1-2-HR
                  MPI-ESM1-2-LR
                  MRI-ESM2-0
                  NorESM2-LM
                  NorESM2-MM
                  UKESM1-0-LL
    


    """


    system_prompt = """You are a climate-science research assistant specialised in interpreting Google Earth Engine outputs from the NASA/GDDP-CMIP6 dataset. 
    your primary task is to use the location data provided and return a json with the models name.

   
    """

    response_mime_type="application/json"
    response_json_schema = Model.model_json_schema()
    tool = None



    result = gemini_get_completion(prompt, response_mime_type, tool, response_json_schema,system_prompt)

    if result.text is None:
        raise ValueError("No response text received from Gemini API.")
    output_model = Model.model_validate_json(result.text)

    print(output_model.model)

    return output_model.model





def web_search(projections, location_date_data):

    prompt = f"""
    <context>
    Here is the data returned from Google Earth Engine, which is a 30 year climate average 15years +- target year selected including both the projected mean values and standard deviation for the selected season and decade, and the same for historical baseline (1985–2015) for the same location for scenario SSP245.
    Location:  {location_date_data["address"]}
    Season: {location_date_data["season"]}
    Year: {location_date_data["year"]}
    Climate Projections and Baseline:
    {projections}
    </context>

    Using this information to a web search and retrieve authoritative research, reports, or analyses relevant to understanding climate impacts for this region, season, and year based on NASA/GDDP-CMIP6 data.
    
    <result>

    <result>
    """


    system_prompt = """

            You are a climate-science research assistant specialised in interpreting Google Earth Engine outputs from the NASA/GDDP-CMIP6 dataset.
            Your primary task is to perform high-quality web searches using Gemini to gather additional scientific evidence, domain context, and relevant research that supports climate-impact assessments for specific locations.
            You will receive:
                A location (address and coordinates)
                NASA/GDDP-CMIP6 projection values for a specific month and year
                Historical baselines (1985–2015) for the same region
                Core climate variables (e.g., tas, tasmax, pr, humidities, wind)
                
            Your job is to:
                Interpret the climate signals contained in the projections and baseline data.
                Formulate precise, domain-appropriate web-search searches to retrieve authoritative sources, such as:
                Academic articles
                Reports citing GDDP-CMIP6
                Regional climate impact studies
                Governmental or NGO climate assessments
                Focus searches on regional impacts for the given month and year, especially relating to:
                Temperature anomalies
                Precipitation and drought/flood risk
                Heat extremes
                Wind and storm-related changes
                Radiative forcing changes
            Only produce high-value, targeted searches, avoiding unspecific or overly broad searches.
            Return:
            The result of this web search
            """
    
    response_mime_type=None
    response_json_schema = None
    tool = [grounding_tool]
    web_search_query = gemini_get_completion(prompt, response_mime_type, tool, response_json_schema, system_prompt)

    print(f"""Gemini Web Search 
          
          
          
          
          
          
          {web_search_query.text}







    """)




    return web_search_query.text


class Query(BaseModel):
    Query: str = Field(description="Vector database query")
    Region: str = Field(description="Region to search papers by")



def rag_query(model, location_date_data):

    prompt = f"""

        using the model used {model} and location and seasonal info selected by the user {location_date_data} return a suitable 
        vector database query to find chunks in the papers that discuss the limitations or characteristics of the specific CMIP6 
        model used for that region.

        Please return vector database query and region to search papers by



    


    """

    system_prompt = f"""
        You are a climate-science research assistant specialised in interpreting Google Earth Engine outputs from the NASA/GDDP-CMIP6 dataset
        your primary task is to return a vector database query to find "Lessons Learned" or "Model Biases" from the database of 70 research 
        papers that are based on varying models and regions across the planet. The aim is to retrieve specilaised infomation to accompany a 
        web search that anaylses the data.

        The vector database has been tagged with metadata as below. Please return the search query and region
    

    models: List[str] = Field(description="List of CMIP6 models mentioned (e.g., MPI-ESM1-2-HR, CESM2)")
    variables: List[str] = Field(description="Climate variables discussed (e.g., tas, pr, sfcWind)")
    region: str = Field(description="Primary geographic focus (e.g., Global, Arctic, Europe)")
    summary: str = Field(description="A 1-sentence summary of the model's performance/bias found in this paper.")

    """

    tool = None
    response_mime_type = "application/json"
    response_json_schema = Query.model_json_schema()


    result = gemini_get_completion(prompt, response_mime_type, tool, response_json_schema,system_prompt)
    if result.text is None:
        raise ValueError("No response text received from Gemini API.")
    output_model = Query.model_validate_json(result.text)
    print(output_model.Query)

    rag = retrieval_vector_db(output_model, model)

    summary = summerise_rag(rag, model, location_date_data)

    print(summary)

    return summary





def summerise_rag(rag, model, location_date_data):

    prompt = f"""



        using vectory database document chunk retrieval {rag} please summerise this into a brief summary on "Lessons Learned" or "Model Biases" 
        for model {model} for data selected by the user {location_date_data}.

        if the vector database document chunks provided are empty please do a web serach instead for the specified model and data selected by the user








    """

    system_prompt = """" 
     You are a climate-science research assistant specialised in interpreting Google Earth Engine outputs from the NASA/GDDP-CMIP6 dataset
        your primary task is to return a summary of a vector database query to find "Lessons Learned" or "Model Biases" from the database of 70 research 
        papers that are based on varying models and regions across the planet. The aim is to retrieve specilaised infomation to accompany a 
        web search that anaylses the data.

    
    
    """

    response_mime_type=None
    response_json_schema = None
    tool= None



    result = gemini_get_completion(prompt, response_mime_type, tool, response_json_schema,system_prompt)









    return result.text







    










