import asyncio
from llm.open_ai import rag_query, summarise
from llm.gemini import web_search


async def agent_actions(projections, address):

    rag_task = async_rag_query(projections, address)
    web_task = async_web_search(projections, address)
    rag_result, web_result = await asyncio.gather(rag_task, web_task)

    
    return summarise(rag_result, web_result, projections, address)




    


async def async_rag_query(projections, address):
     return await asyncio.to_thread(rag_query, projections, address)


async def async_web_search(projections, address):
     return await asyncio.to_thread(web_search, projections, address)