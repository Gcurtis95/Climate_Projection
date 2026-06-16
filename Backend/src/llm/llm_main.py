import asyncio
from llm.open_ai import summarise
from llm.gemini import web_search, rag_query


async def agent_actions(projections, location_date_data, model):

    rag_task = async_rag_query(model, location_date_data)
    web_task = async_web_search(projections, location_date_data)
    rag_result, web_result = await asyncio.gather(rag_task, web_task)


    
    return rag_result, web_result



async def async_rag_query(model, location_date_data):
     return await asyncio.to_thread(rag_query, model, location_date_data)


async def async_web_search(projections, address):
     return await asyncio.to_thread(web_search, projections, address)