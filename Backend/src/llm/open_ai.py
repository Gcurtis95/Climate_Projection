from openai import OpenAI
from dotenv import load_dotenv
import os
from rag.chroma_db import retrieval_vector_db

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


client = OpenAI(api_key=OPENAI_API_KEY,)

def open_ai_get_completion(prompt, system_prompt, model):

    try:
    
        response = client.responses.create(
        model=model,
        instructions=system_prompt,
        input=prompt,
        )
    except Exception as e:
        raise Exception("status_code=500") from e


    return response



def rag_query(projections, address):

    prompt = f"""
    
    <context>
    Here is the data returned from google earth engine which includes projected data for the specific year and month 
    as well the baseline for the specific region from 1950 to 2014.
    this is the address and region of the use {address}
    {projections}
    <context>

    """


    system_prompt = f"""
            You are an assistant responsible for generating precise, well-structured retrieval queries for a ChromaDB vector database containing open-access research papers related to the NASA/GDDP-CMIP6 climate dataset.

            For each request, you receive:

            Parsed climate data from Google Earth Engine, including historical baselines (1950–2014) and future projections for a specific location, month, and year.
            A user-provided location (address), along with the processed projection values for key variables such as temperature, precipitation, humidity, radiative fluxes, and wind.
            Your task is to:

            Extract the scientifically relevant signals from the supplied GEE outputs (e.g., projected temperature anomalies, precipitation trends, extreme-event indicators). Transform 
            these signals into a targeted, high-quality search query suitable for vector retrieval. The generated query should help retrieve research papers that can support a detailed impact 
            assessment for that region and timeframe, including expected climatic changes, risks, and environmental or socio-economic implications.   When creating the search query: Focus on 
            variables present in the projections (e.g., tas, pr, rlds, rsds, sfcWind, humidity). Include relevant temporal context (selected month, selected year, baseline comparison).    
            Include spatial context (location name, region type, latitude/longitude). Use scientific terminology consistent with CMIP6 and GDDP literature.
            Avoid generic or broad queries; aim for specificity that maximises retrieval relevance. Your output should be:
            A single, compact search query string optimised for vector semantic search.
            No explanation or meta-commentary—only the query.
    """ 

    model = "gpt-5-mini"


    vector_db_query = open_ai_get_completion(prompt, system_prompt, model)

    print(vector_db_query.output_text)

    

    return retrieval_vector_db(vector_db_query)




def summarise(rag_result, web_result, projections, address):

    prompt = f"""
    <Context>
    Here are the projected and baseline data form google earth engine {projections}, 
    Here is the data returned from the gemini web search {web_result} for NASA/GDDP-CMIP6 dataset in {address}. 

    Here the is rag and vector database
    {rag_result},

    <Context>
    """

    system_prompt = f""" You are a climate-science research assistant specialised in interpreting Google Earth Engine outputs from the NASA/GDDP-CMIP6 dataset.
    You will receive:
                a web search anaylisis based on the data. 
                a retrieval based search from a vector data base full of open ccess research papers on the subject.
                A location (address and coordinates)
                NASA/GDDP-CMIP6 projection values for a specific month and year
                Historical baselines (1950–2014) for the same region
                Core climate variables (e.g., tas, tasmax, pr, humidities, wind, radiative fluxes)
    your job is to:
                summarise all of this infomation into a response that indicates the potential impacts on the given region for the given date



    """

    model = "gpt-5.1"

    summerised_analysis = open_ai_get_completion(prompt, system_prompt, model)
 

    

    return summerised_analysis.output_text






