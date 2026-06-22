from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import ServerError
import os
from pydantic import BaseModel, Field
from rag.chroma_db import retrieval_vector_db
from llm.deltas import format_delta_brief
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential


load_dotenv()
client = genai.Client()

grounding_tool = types.Tool(
    google_search=types.GoogleSearch()
)


@retry(
    retry=retry_if_exception_type(ServerError),
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=1, min=1, max=20),
    reraise=True,
)
def gemini_get_completion(prompt, response_mime_type, tool, response_json_schema, system_prompt):
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type=response_mime_type,
            response_json_schema=response_json_schema,
            tools=tool,
            system_instruction=system_prompt,
        ),
    )
    return response


def web_search(projections, location_date_data, deltas):
    delta_brief = format_delta_brief(deltas)

    prompt = f"""
Location: {location_date_data["address"]}
Season: {location_date_data["season"]} | Target year: {location_date_data["year"]} | Scenario: SSP2-4.5
Baseline: 1985–2015 | Projection window: {location_date_data["year"]} ±15 years

KEY CLIMATE ANOMALIES (pre-computed, vs 1985–2015 baseline):
{delta_brief}

Full raw projection data (30-year means):
{projections}

Using the anomalies above as your search brief, retrieve authoritative scientific literature and
regional assessments that address these specific signals for this location and season.
Prioritise sources that are quantitatively grounded (CMIP6, IPCC, national/regional climate plans).

Return your findings in this exact structure:

KEY FINDING: [One sentence — dominant signal, direction, magnitude, and confidence level]

REGIONAL CONTEXT: [What the literature says about this region's climate trajectory under SSP2-4.5.
Reference specific temperature/precipitation trends documented for this area.]

PROJECTED IMPACTS: [3–5 specific sector impacts expected from anomalies of this scale —
agriculture, water availability, heat stress, flooding, ecosystem shifts, infrastructure.
Ground each in the delta values above.]

MODEL AGREEMENT: [Do multiple CMIP6 models agree on these signals for this region?
Any known spread or disagreement in the ensemble?]

SOURCES: [List specific reports, papers, or datasets cited — include author/year/title where identifiable]
    """

    system_prompt = """You are a senior climate-science research analyst specialising in regional
impact assessment under CMIP6 scenarios.

Your role is to search for and synthesise scientific evidence that directly corresponds to the
specific anomaly signals provided. Do not give generic climate overviews — every claim must be
grounded in the delta values given and in retrieved sources.

Rules:
- Lead with the most quantitatively significant anomaly
- If std dev is high relative to delta, flag the signal as uncertain
- Distinguish between well-established regional trends and model-dependent projections
- Never fabricate citations — only cite sources you have retrieved
- Return exactly the five-section structure requested"""

    result = gemini_get_completion(prompt, None, [grounding_tool], None, system_prompt)
    print(f"Web search result:\n{result.text}")
    return result.text


class Query(BaseModel):
    Query: str = Field(description="Vector database semantic search query")
    Region: str = Field(description="Primary geographic region for the query")


def rag_query(model, location_date_data, deltas):
    """Generates a targeted ChromaDB query using the model, region, and climate anomalies."""
    delta_brief = format_delta_brief(deltas)

    prompt = f"""
CMIP6 model used: {model}
Location: {location_date_data["address"]} (lat {location_date_data["lat"]}, lon {location_date_data["lon"]})
Season: {location_date_data["season"]}

Observed anomalies (projected vs 1985–2015 baseline):
{delta_brief}

Generate a precise semantic search query to retrieve research paper chunks that discuss:
1. Known biases or limitations of {model} specifically for this region and season
2. Whether {model} is known to over- or under-predict any of the variables showing anomalies above
3. Any "lessons learned" from evaluating {model} in similar climate regimes

The query should surface model-evaluation and model-bias content, not general climate projections.
Also identify the primary geographic region for metadata filtering.
    """

    system_prompt = f"""You are a climate-science research librarian building retrieval queries
for a ChromaDB vector database of 70 open-access CMIP6 evaluation papers.

Each stored chunk has metadata: models (comma-separated CMIP6 model names), variables, region, insight.

Your query must be specific enough to retrieve chunks that directly evaluate {model}'s performance
in the given region. Prioritise specificity over breadth — a query that returns 3 relevant chunks
beats one that returns 10 marginal ones.

Return a JSON with:
  Query: the semantic search string (2–4 sentences, dense with technical terms)
  Region: the primary geographic region name matching the paper metadata convention
          (e.g., "Europe", "East Asia", "South Asia", "North America", "Arctic", "Africa", "Global")"""

    result = gemini_get_completion(prompt, "application/json", None, Query.model_json_schema(), system_prompt)
    if result.text is None:
        raise ValueError("No response text received from Gemini API.")

    output_model = Query.model_validate_json(result.text)
    print(f"RAG query: {output_model.Query}")

    chunks = retrieval_vector_db(output_model, model)
    return chunks
