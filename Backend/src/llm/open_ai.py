from openai import OpenAI
from dotenv import load_dotenv
from llm.deltas import format_delta_brief
import os
import json

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)


def open_ai_get_completion(prompt, system_prompt, model):
    try:
        response = client.responses.create(
            model=model,
            instructions=system_prompt,
            input=prompt,
        )
    except Exception as e:
        raise Exception("status_code=500") from e
    return response


def summarise(web_task, rag_task, projections, address, deltas):
    # Flatten raw Chroma chunks: list[list[str]] → single joined string
    if isinstance(rag_task, list):
        flat_chunks = [
            chunk
            for sublist in rag_task
            for chunk in (sublist if isinstance(sublist, list) else [sublist])
        ]
        rag_text = "\n\n---\n\n".join(flat_chunks)
    else:
        rag_text = str(rag_task)

    delta_brief = format_delta_brief(deltas)

    prompt = f"""
<Context>
CMIP6 model (copy exactly into model_name): {address.get("model", "unknown")}
Location: {address["address"]}
Coordinates (copy exactly into location.lat / location.lon — do NOT round or alter):
  lat: {address["lat"]}
  lon: {address["lon"]}
Season: {address["season"]} | Target year: {address["year"]} | Scenario: SSP2-4.5
Baseline period: 1985–2015 | Projection window: {address["year"]} ±15 years

PRE-COMPUTED CLIMATE DELTAS — use these directly, do not re-derive from raw values:
{delta_brief}

Notes on uncertainty: the σ values above are 30-year standard deviations.
If σ ≥ |delta|, the signal is within natural variability — flag it as uncertain in your narrative.
If σ < |delta| / 2, the signal is robust — state it with confidence.

FULL RAW PROJECTIONS (for reference only):
{projections}

Band units reference:
  hurs    %           near-surface relative humidity
  sfcWind m/s         daily-mean wind speed
  tas     K           mean air temperature  [display as °C = K − 273.15]
  tasmin  K           daily minimum temperature
  tasmax  K           daily maximum temperature
  pr      kg/m²/s     precipitation rate

WEB SEARCH FINDINGS:
{web_task}

RAG MODEL BIAS / LESSONS LEARNED
(raw research paper excerpts — extract bias and limitation context relevant to this model and region):
{rag_text}

Instructions for using the RAG excerpts:
- Populate the "citations" array where paper titles or authors are identifiable in the chunks
- If the model is known to over- or under-predict a specific variable in this region, qualify the
  corresponding delta in "overview.summary" and "impacts.bullets" accordingly
- Do not cite a source you cannot identify from the text
</Context>

<Response>
Return ONLY a JSON object conforming exactly to the schema below.
No markdown. No explanation. No extra keys. No schema repetition.

{JSON_SCHEMA}
</Response>
    """

    system_prompt = """You are a senior climate-science research analyst producing structured
regional impact assessments from CMIP6 projections under SSP2-4.5.

You receive:
  - Pre-computed climate deltas with uncertainty (σ) values — USE THESE as your primary signal
  - Web search findings with regional literature and sector impacts
  - RAG excerpts covering known model biases and evaluation results

Your output must:
1. Quantify every claim — use the delta values explicitly (e.g., "a 2.4°C warming signal")
2. Distinguish robust signals (σ < delta/2) from uncertain ones (σ ≥ delta)
3. Incorporate model bias caveats from the RAG excerpts where they change interpretation
4. Populate data_table rows from the pre-computed deltas — do not invent values.
   For precipitation (pr): set baseline.value and projected.value to the absolute rates
   in mm/day (shown in the delta table above as "baseline X mm/day → projected Y mm/day").
   Set display_format to "mm_day". Do NOT use the % change as the value.
5. Populate location exactly from the coordinates provided above — lat and lon must match exactly.
6. Set shader_params based on the projected absolute climate character of this location
   (not the direction of change, but what kind of climate it will be)
6. Write overview.summary as 3–4 sentences, grounded in specific numbers
7. Write impacts.bullets as specific, sector-named consequences — not generic statements

Do not fabricate data. Do not ignore σ values. Do not produce generic climate boilerplate."""

    response = open_ai_get_completion(prompt, system_prompt, "gpt-4.1")
    return json.loads(response.output_text)


JSON_SCHEMA = """
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/climate-summary.json",
  "title": "ClimateSummary",
  "type": "object",
  "additionalProperties": false,
  "required": ["title", "model_name", "overview", "location", "impacts", "data_table", "shader_params"],
  "properties": {
    "title": { "type": "string", "minLength": 5 },

    "model_name": {
      "type": "string",
      "description": "The CMIP6 model used for this projection — copy exactly from the model provided in context."
    },

    "overview": {
      "type": "object",
      "additionalProperties": false,
      "required": ["summary", "key_takeaways"],
      "properties": {
        "summary": { "type": "string", "minLength": 40 },
        "key_takeaways": {
          "type": "array",
          "minItems": 3,
          "maxItems": 6,
          "items": { "type": "string" }
        }
      }
    },

    "location": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name", "country_region", "lat", "lon"],
      "properties": {
        "name": { "type": "string", "description": "Locality name (e.g. 'Denmark Hill', 'Manhattan')" },
        "country_region": { "type": "string", "description": "Country or broader region (e.g. 'United Kingdom', 'California, USA')" },
        "lat": { "type": "number", "description": "Latitude — copy exactly from the coordinates provided, do not round" },
        "lon": { "type": "number", "description": "Longitude — copy exactly from the coordinates provided, do not round" }
      }
    },

    "data_table": {
      "type": "array",
      "description": "Row-oriented table for easy UI rendering",
      "minItems": 1,
      "items": { "$ref": "#/$defs/variableRow" }
    },

    "impacts": {
      "type": "object",
      "additionalProperties": false,
      "required": ["bullets"],
      "properties": {
        "bullets": {
          "type": "array",
          "minItems": 3,
          "items": { "type": "string" }
        }
      }
    },

    "shader_params": {
      "type": "object",
      "description": "Normalised visual parameters (0.0–1.0) encoding the climate character of this projection, used to tint and warp the background shader on the results page",
      "additionalProperties": false,
      "required": ["warmth", "turbulence", "aridity"],
      "properties": {
        "warmth": {
          "type": "number", "minimum": 0, "maximum": 1,
          "description": "0=cold/polar/sub-zero, 0.5=temperate, 1=hot/tropical/desert. Derive from projected tas/tasmax relative to global climate norms, not just the baseline delta."
        },
        "turbulence": {
          "type": "number", "minimum": 0, "maximum": 1,
          "description": "0=stable/calm (low wind, steady precip), 1=highly variable/stormy (large sfcWind change, extreme precipitation events projected). Derive from sfcWind and pr variability."
        },
        "aridity": {
          "type": "number", "minimum": 0, "maximum": 1,
          "description": "0=wet/humid (rainforest, monsoon, high hurs and pr), 1=arid/dry (desert, steppe, low pr and hurs). Derive from projected pr and hurs absolute values and their change direction."
        }
      }
    },

    "citations": {
      "type": "array",
      "description": "Optional: store paper/report identifiers used by RAG",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["title"],
        "properties": {
          "title": { "type": "string" },
          "doi": { "type": "string" },
          "url": { "type": "string" }
        }
      }
    }
  },

  "$defs": {
    "variableRow": {
      "type": "object",
      "additionalProperties": false,
      "required": ["key", "label", "unit", "baseline", "projected"],
      "properties": {
        "key": {
          "type": "string",
          "description": "Canonical variable key (e.g., tasmax, pr, hurs)",
          "pattern": "^[a-zA-Z0-9_]+$"
        },
        "label": { "type": "string" },
        "unit": { "type": "string" },

        "baseline": { "$ref": "#/$defs/valueWithOptionalRaw" },
        "projected": { "$ref": "#/$defs/valueWithOptionalRaw" },

        "display_format": {
          "type": "string",
          "description": "Optional formatting hint for UI",
          "enum": ["number", "scientific", "percent", "celsius", "kelvin", "w_m2", "m_s", "kg_m2_s", "mm_day"]
        }
      }
    },

    "valueWithOptionalRaw": {
      "type": "object",
      "additionalProperties": false,
      "required": ["value"],
      "properties": {
        "value": { "type": "number" },
        "raw_value": { "type": "number" },
        "raw_unit": { "type": "string" }
      }
    }
  }
}
"""
