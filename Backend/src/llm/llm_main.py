import asyncio
from llm.open_ai import summarise
from llm.gemini import web_search, rag_query
from llm.deltas import compute_deltas
from earth_engine.earth_engine import get_google_earth_data


async def agent_actions(location_date_data, model):
    """
    Execution order:
      1. Earth Engine (hard bottleneck — everything depends on projections)
      2. Deltas computed from raw EE output
      3. RAG + web_search in parallel — both now have full delta context
      4. summarise once both complete
    """
    projections = await asyncio.to_thread(get_google_earth_data, location_date_data, model)
    deltas = compute_deltas(projections)

    rag_task = asyncio.create_task(
        asyncio.to_thread(rag_query, model, location_date_data, deltas)
    )
    web_task = asyncio.create_task(
        asyncio.to_thread(web_search, projections, location_date_data, deltas)
    )

    results = {}
    pending = {rag_task: "rag", web_task: "web"}
    while pending:
        done, _ = await asyncio.wait(list(pending.keys()), return_when=asyncio.FIRST_COMPLETED)
        for task in done:
            name = pending.pop(task)
            results[name] = task.result()
            yield {"type": name, "data": results[name]}

    summary = await asyncio.to_thread(
        summarise, results["web"], results["rag"], projections, location_date_data, deltas
    )
    yield {"type": "summary", "data": summary}
