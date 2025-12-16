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

    time_series = get_projected_time_series(location_date_data)

    # agent_task = async_agent_actions(projections, location_date_data)
    # get_projected_time_series_task = async_get_projected_time_series(location_date_data)

    # agent_result, time_series = await asyncio.gather(agent_task, get_projected_time_series_task)

    agent_result = dummyAgent()
    # final_output = await agent_actions(projections, location_date_data["address"])
    # print(agent_result)
    result = {"data":time_series, "agent":agent_result}

    return result


# async def async_agent_actions(projections, location_date_data):
#      return await agent_actions(projections, location_date_data)


# async def async_get_projected_time_series(location_date_data):
#      return await asyncio.to_thread(get_projected_time_series,location_date_data)

  

def dummyAgent():
     return "Potential Impacts in In Amguel, Tamanrasset, Algeria **Projected vs. Baseline Data:** - **Temperature:** Both projected average " \
     "temperature (tas) and maximum temperature (tasmax) show a slight decrease from the baseline. The projected tas is 287.38 K " \
     "(14.23°C) from 288.56 K (15.41°C), and tasmax is 295.09 K (21.94°C) from 296.19 K (23.04°C). This suggests a slight cooling " \
     "trend. - **Humidity:** Relative humidity (hurs) remains almost unchanged. However, specific humidity (huss) shows a decrease," \
     " indicating potentially drier air. - **Precipitation:** Both baseline and projected precipitation are at zero, suggesting extremely" \
     " dry conditions with no significant change. - **Radiation:** There is a slight increase in shortwave radiation (rsds) and decrease in longwave radiation " \
     "(rlds). This could affect local temperature and evaporation rates. - **Wind:** An increase in wind speed may enhance evaporation and " \
     "contribute to drier conditions. **Research Insights:** - **Regional Trends:** Findings highlight significant temperature increases under various emission scenarios, " \
     "but a slight cooling trend is projected for this specific location and time. The region's dry and hot climate may not experience sharp temperature increases unlike other African regions. - *" \
     "*Climate Models:** SSP scenarios indicate varying degrees of warming, but local projections show minor deviations from historical trends. - **Uncertainties:** There are uncertainties in long-term projections, " \
     "particularly more pronounced under high emission scenarios like SSP5-8.5. **General Implications:** - **Agricultural and Water Resources:** Persistent dry conditions with no rainfall suggest challenges for agriculture and water resources. " \
     "Water scarcity may continue to be a pressing issue. - **Human Health:** Despite a slight cooling, the region could still face extreme temperatures, affecting human" \
     " health and well-being. Increased wind speeds might exacerbate dust and aridity, impacting respiratory health. - **Ecosystems:** Wildlife and vegetation adapted " \
     "to dry conditions may not face immediate changes, but long-term climate shifts could alter habitats. **Conclusion:** The projected climate data for In Amguel suggests minimal" \
     " changes from the historical baseline, maintaining its hot and arid conditions. These findings underscore the region's consistent dry climate, with minor impacts" \
     " projected for this specific month and year. However, ongoing monitoring and adaptation strategies remain critical to address potential future changes and their " \
     "impacts on human and environmental systems."