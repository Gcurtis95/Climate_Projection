from dotenv import load_dotenv
from google import genai
from google.genai import types
import json, os , asyncio


load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client()

grounding_tool = types.Tool(
    google_search=types.GoogleSearch()
        )



def gemini_get_completion(prompt, system_prompt):

    response = client.models.generate_content(
        model="gemini-2.5-flash", 
        contents=prompt,
        config=types.GenerateContentConfig(
        tools=[grounding_tool],
        system_instruction=system_prompt
        ),
        )

    return response


def web_search(projections, address):

    prompt = f"""
    <context>
    Here is the data returned from Google Earth Engine, including both the projected values for the selected year and month, and the historical baseline (1950–2014) for the same location.
    Location:  {address}
    Climate Projections and Baseline:
    {projections}
    </context>

    Using this information to a web serach and retrieve authoritative research, reports, or analyses relevant to understanding climate impacts for this region, month, and year based on NASA/GDDP-CMIP6 data.
        
    """


    system_prompt = """

            You are a climate-science research assistant specialised in interpreting Google Earth Engine outputs from the NASA/GDDP-CMIP6 dataset.
            Your primary task is to perform high-quality web searches using Gemini to gather additional scientific evidence, domain context, and relevant research that supports climate-impact assessments for specific locations.
            You will receive:
                A location (address and coordinates)
                NASA/GDDP-CMIP6 projection values for a specific month and year
                Historical baselines (1950–2014) for the same region
                Core climate variables (e.g., tas, tasmax, pr, humidities, wind, radiative fluxes)
                
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
    
    web_search_query = gemini_get_completion(prompt, system_prompt)

    print(f"""Gemini Web Search 
          
          
          
          
          
          
          {web_search_query.text}







    """)




    return web_search_query.text
