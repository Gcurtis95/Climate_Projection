from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from earth_engine.earth_engine import google_earth_engine
from llm.llm_main import agent_actions
import json


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

    try: 
        projections = await google_earth_engine(location_date_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    try: 
        final_output = await agent_actions(projections, location_date_data["address"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

    return final_output

  

