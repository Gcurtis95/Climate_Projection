from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from earth_engine.earth_engine import get_google_earth_data, get_projected_time_series
from llm.llm_main import agent_actions
import json, asyncio


app = FastAPI()
 

class Data(BaseModel):
    lon: str
    lat: str
    month: str
    year: str
    address: str

@app.post("/climate")
async def climate_projection(data: Data):

    location_date_data = data.model_dump()


    print(location_date_data)

    # try: 
    projections = get_google_earth_data(location_date_data)
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail=str(e))


    agent_task = async_agent_actions(projections, location_date_data)
    get_projected_time_series_task = async_get_projected_time_series(location_date_data)

    agent_result, time_series_result = await asyncio.gather(agent_task, get_projected_time_series_task)


    

    # final_output = await agent_actions(projections, location_date_data["address"])
    print(agent_result)
    

    return 


async def async_agent_actions(projections, location_date_data):
     return await agent_actions(projections, location_date_data)


async def async_get_projected_time_series(location_date_data):
     return await asyncio.to_thread(get_projected_time_series,location_date_data)

  

