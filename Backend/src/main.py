from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from earth_engine.earth_engine import get_google_earth_data
from llm.llm_main import agent_actions
import json, asyncio
from llm.gemini import web_search, model_select


app = FastAPI()
 

class Data(BaseModel):
    lon: str
    lat: str
    season: str
    year: str
    address: str

@app.post("/climate")
async def climate_projection(data: Data):

    location_date_data = data.model_dump()


    model = model_select(location_date_data)


    print(location_date_data)


    projections = get_google_earth_data(location_date_data, model)
   
    print(projections)


    # agent_task = async_agent_actions(projections, location_date_data)
    # get_projected_time_series_task = async_get_projected_time_series(location_date_data)

    # agent_result, time_series = await asyncio.gather(agent_task, get_projected_time_series_task)



#     agent_result = dummyAgent()

    agent_result = await agent_actions(projections, location_date_data, model)
    # print(agent_result)
    # result = {"data":time_series, "agent":agent_result}
   

    return 


# async def async_agent_actions(projections, location_date_data):
#      return await agent_actions(projections, location_date_data)


# async def async_get_projected_time_series(location_date_data):
#      return await asyncio.to_thread(get_projected_time_series,location_date_data)

  





     
