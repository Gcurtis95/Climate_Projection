# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Three independent sub-projects under one repo. Each has its own dependencies and `.env`.

- `Frontend/` — Next.js 16 (App Router) + React 19 + TypeScript. Browser UI, map picker, R3F/WebGPU visualisations.
- `Backend/` — FastAPI service that fans out to Google Earth Engine and a multi-LLM agent pipeline.
- `chromaDB_scripts/` — One-shot ingestion scripts that load `documents/*.pdf` (CMIP6 research papers) into a Chroma Cloud collection. Not part of the runtime stack — run manually when corpus changes.

## Commands

### Frontend (`Frontend/`)
- `npm run dev` — Next dev server on `localhost:3000`. The visualisation page fetches `localhost:3000/api/climate`, which proxies to the backend at `localhost:8000`, so both servers must be running.
- `npm run build` / `npm run start` — production build / serve.
- `npm run lint` — ESLint (`eslint-config-next`).

### Backend (`Backend/`)
- Python 3.12. A venv lives at `Backend/env/` (gitignored).
- Install: `pip install -r requirements.txt` — note `requirements.txt` is minimal (`fastapi`, `uvicorn`, `earthengine-api`); the code also imports `google-genai`, `openai`, `chromadb`, `langchain-openai`, `python-dotenv`, `pydantic`, `pandas`. Install those manually if missing.
- Run: `uvicorn src.main:app --reload --port 8000` from inside `Backend/` (imports like `from earth_engine.earth_engine import ...` are relative to `Backend/src/`, so run with `src` on the path or `cd Backend/src && uvicorn main:app ...`).
- First run will trigger `ee.Authenticate()` interactively in `earth_engine.py`.

### chromaDB scripts (`chromaDB_scripts/`)
- `python main.py` — walks `documents/`, extracts metadata via `gpt-4o`, embeds with `text-embedding-3-small`, writes to Chroma Cloud collection `nasa_climate_rag`. Re-running re-ingests; there is no dedup.

## Architecture

### Request flow
1. User picks a location (MapLibre globe, draggable marker) + season + year in `Frontend/components/App/App.tsx` (`Map` sets `[lon, lat]`, `UserSelect` sets `{season, year}`).
2. Navigation to `/visualisation?lon=&lat=&season=&year=&address=` triggers `Frontend/app/visualisation/page.tsx`, a server component that calls `lib/utils.ts::getData`.
3. `getData` fetches `/api/climate` (Next route handler in `Frontend/app/api/climate/route.ts`) which POSTs to the FastAPI backend at `http://127.0.0.1:8000/climate`. **The backend URL is hard-coded** — change both `route.ts` and `lib/utils.ts` if env-driving it.
4. Backend `src/main.py::climate_projection`:
   - `model_select` (Gemini) → picks one of ~25 CMIP6 model names appropriate for the region.
   - `get_google_earth_data` → queries NASA/GDDP-CMIP6 on Earth Engine for a 30-year window (target year ±15) under scenario `ssp245`, plus a 1985–2015 historical baseline. Reduces to a single point at 25 km scale and returns mean + stddev for bands `[hurs, sfcWind, tas, tasmin, tasmax, pr]`.
   - `agent_actions` (`src/llm/llm_main.py`) runs two coroutines concurrently via `asyncio.gather`:
     - `rag_query` (Gemini) — generates a vector DB query, retrieves chunks from Chroma Cloud (`nasa_climate_rag` collection, `retrieval_vector_db` in `rag/chroma_db.py`), then summarises with `summerise_rag`.
     - `web_search` (Gemini grounded with `google_search` tool) — pulls authoritative sources for the projection.
   - `summarise` (OpenAI `gpt-4.1`, `llm/open_ai.py`) is *defined* to merge both into the `JSON_SCHEMA` in that file, but `main.py` currently `return`s nothing — the endpoint is mid-refactor. The frontend's `RenderData` already expects a `{data, agent}` shape, so the wiring is incomplete end-to-end.
5. Frontend `RenderData.tsx` renders `ThreeDShader` (WebGPU shader sketch) and an `AgentOutput` panel once the shader's texture loads. `VisScene` + `ThreePointVis` (force-directed 3D graph via `r3f-forcegraph`) exist but are not currently mounted in the render path.

### Three.js / WebGPU
- `Frontend/components/THREEjs/sketch.tsx` defines the shader using **TSL (Three Shading Language) node-based shaders** (`three/tsl` imports) executed via WebGPU (`three/webgpu`). It is *not* GLSL. Helpers live under `THREEjs/tsl/{noise,effects,post_processing,utils}`.
- All R3F components must have `'use client'` at the top (per commit history, this was a fix). When adding new R3F/WebGPU components, include the directive.
- `setting.txt` (repo root) contains preset uniform values (`fast noise`, `slow`, `website`) for tuning the shader in `sketch.tsx` — copy/paste blocks, don't treat it as code.

### LLM model routing
- Gemini (`gemini-2.5-flash`) handles model selection, web search grounding, RAG query generation, and RAG summary.
- OpenAI (`gpt-4.1`) handles the final structured summary against `JSON_SCHEMA` in `open_ai.py`.
- OpenAI `text-embedding-3-small` is the embedding model for Chroma (must match between ingest in `chromaDB_scripts/main.py` and retrieval in `Backend/src/rag/chroma_db.py`).

## Environment variables

Each sub-project has its own `.env` (all gitignored).

- `Backend/.env`: `GEMINI_API_KEY`, `OPENAI_API_KEY`, `CHROMA_API_KEY`, `CHROMA_TENANT`, `DATABASE`, `CHROMA_OPENAI_API_KEY`. Earth Engine project is hard-coded as `climatechangeproject-477817` in `earth_engine.py`.
- `chromaDB_scripts/.env`: same Chroma + OpenAI keys.
- `Frontend/.env`: present but no variables are read by the current code (backend URL is hard-coded).

## Conventions and gotchas

- The repo path contains a space (`Front End Development/`) — always quote paths in shell commands.
- A lot of `# type: ignore` on `ee.*` calls in `earth_engine.py` — the `earthengine-api` package has weak typings; keep these when editing.
- `Backend/src/main.py` and `earth_engine.py` contain large commented-out blocks for `get_projected_time_series` (a force-graph time-series feature). The graph node/link data structure consumed by `Frontend/components/Client/ThreePointVis` originates here — uncomment that pipeline if reviving the node visualisation.
- `chromaDB_scripts/main.py` patches `pypdf.filters.ZLIB_MAX_OUTPUT_LENGTH = 0` to disable a decompression bomb guard — needed for some of the climate PDFs.
