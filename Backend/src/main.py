from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from llm.llm_main import agent_actions
from llm.model_select import model_select
import json

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
    location_date_data["model"] = model
    print(f"Model selected: {model} for {location_date_data}")

    async def event_stream():
        async for event in agent_actions(location_date_data, model):
            yield json.dumps(event) + "\n"

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")
