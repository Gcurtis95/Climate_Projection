# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Three independent sub-projects under one repo, plus a legacy frontend. Each has its own dependencies and `.env`.

- `frontend-v2/` — **Active frontend.** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4. Map picker (MapLibre), precheck (water/geocoding), streaming visualisation results page.
- `Frontend/` — **Legacy/abandoned.** Earlier Next.js 16 + R3F/WebGPU frontend (TSL shader visualisation). Not run during normal development; kept for reference only. Don't assume changes here affect the running app.
- `Backend/` — FastAPI service that fans out to Google Earth Engine and a multi-LLM agent pipeline.
- `chromaDB_scripts/` — One-shot ingestion scripts that load `documents/*.pdf` (CMIP6 research papers) into a Chroma Cloud collection. Not part of the runtime stack — run manually when corpus changes.

## Commands

### Frontend (`frontend-v2/`)
- `npm run dev` — Next dev server on `localhost:3000`. The visualisation page streams from `localhost:3000/api/climate`, which proxies NDJSON from the backend at `localhost:8000` (`BACKEND_URL` env var, defaults to `http://127.0.0.1:8000`), so both servers must be running.
- `npm run build` / `npm run start` — production build / serve.
- `npm run lint` — ESLint (`eslint-config-next`).
- Env vars (`frontend-v2/.env`): `BACKEND_URL`, `NEXT_PUBLIC_MAPBOX` (Mapbox geocoding token), `ISITWATER` (RapidAPI isitwater key, used by `/api/precheck`).

### Legacy frontend (`Frontend/`) — not actively used
- Same Next.js commands apply if reviving it, but it is not wired into current development workflows.

### Backend (`Backend/`)
- Python 3.12. A venv lives at `Backend/env/` (gitignored).
- Install: `pip install -r requirements.txt` — note `requirements.txt` is minimal (`fastapi`, `uvicorn`, `earthengine-api`); the code also imports `google-genai`, `openai`, `chromadb`, `langchain-openai`, `python-dotenv`, `pydantic`, `pandas`. Install those manually if missing.
- Run: `uvicorn src.main:app --reload --port 8000` from inside `Backend/` (imports like `from earth_engine.earth_engine import ...` are relative to `Backend/src/`, so run with `src` on the path or `cd Backend/src && uvicorn main:app ...`).
- First run will trigger `ee.Authenticate()` interactively in `earth_engine.py`.

### chromaDB scripts (`chromaDB_scripts/`)
- `python main.py` — walks `documents/`, extracts metadata via `gpt-4o`, embeds with `text-embedding-3-small`, writes to Chroma Cloud collection `nasa_climate_rag`. Re-running re-ingests; there is no dedup.

## Architecture

### Request flow
1. User picks a location (MapLibre globe, draggable marker) + season + year on `frontend-v2/app/page.tsx` → `HomeExperience` (`Globe` sets `[lon, lat]`, season buttons set `{season}`, year slider sets `{year}`).
2. `SubmitControl` hits `/api/precheck?lon=&lat=` (`frontend-v2/app/api/precheck/route.ts`), which calls the isitwater API and Mapbox reverse geocoding in parallel. If the point is water, it shows a warning; otherwise it navigates to `/visualisation?lon=&lat=&season=&year=&address=`.
3. `frontend-v2/app/visualisation/page.tsx` is a server component that just resolves `searchParams` and renders the client component `components/results/ClimateStream.tsx` — it does **not** fetch data itself. `app/visualisation/loading.tsx` is a Next.js Suspense boundary that shows a plain black screen while `searchParams` resolves (avoids flashing the old UI).
4. `ClimateStream` (client) opens a streaming `fetch` to `/api/climate?lon=&lat=&season=&year=&address=` (`frontend-v2/app/api/climate/route.ts`, a GET handler that proxies the backend's NDJSON response body straight through — no buffering). It reads the body via `ReadableStream`, splits on newlines, and parses each line as a `{"type": "rag"|"web"|"summary", "data": ...}` event. While `summary` has not yet arrived it renders `IkedaLoadingScreen`; once the `"summary"` event lands it renders `Dashboard`.
5. Backend `src/main.py::climate_projection`:
   - `model_select` (Gemini) → picks one of ~25 CMIP6 model names appropriate for the region.
   - `get_google_earth_data` → queries NASA/GDDP-CMIP6 on Earth Engine for a 30-year window (target year ±15) under scenario `ssp245`, plus a 1985–2015 historical baseline. Reduces to a single point at 25 km scale and returns mean + stddev for bands `[hurs, sfcWind, tas, tasmin, tasmax, pr]`.
   - `agent_actions` (`src/llm/llm_main.py`) is an **async generator**: it runs `rag_query` and `web_search` concurrently and `yield`s each one's result as soon as it completes (`{"type": "rag"/"web", "data": ...}`), then yields a final `{"type": "summary", "data": ...}` once `summarise` (OpenAI `gpt-4.1`, `llm/open_ai.py`) has merged both into the `JSON_SCHEMA` shape.
   - `main.py` consumes this generator via `StreamingResponse`, writing one JSON object per line (NDJSON) to the HTTP response as each event is yielded.
6. `frontend-v2/types/climate.ts::ClimateSummary` is the shape of the final `"summary"` event's `data` and must stay in sync with `JSON_SCHEMA` in `Backend/src/llm/open_ai.py`.

### frontend-v2 visual layer stack

**Homepage** (`frontend-v2/components/home/HomeExperience.tsx`):
1. **`SatelliteParticles`** (`components/home/SatelliteParticles.tsx`) — bottom layer (z=0, absolute). Three.js GPU particle system sampling `/northamerica_geos5_20222364.webp` (NASA temperature map). Custom GLSL `ShaderMaterial`: square particles via Chebyshev distance, `THREE.AdditiveBlending` for bloom, mouse repulsion via `uMouse` uniform. `SAMPLE_RES=320`, `ZOOM=1.55`, `X_OFFSET=0.09`. No wave animation — particles are static unless mouse is nearby.
2. **Dark overlay** — `rgba(0,0,0,0.65)` `position:absolute` div (z=0) between particles and UI for legibility.
3. **`IkedaBoxes`** (`components/home/IkedaBoxes.tsx`) — Canvas 2D layer (z=20, `position:fixed`, `pointerEvents:none`). 6 white-bordered boxes bouncing slowly around the full screen (0.22–0.50 px/frame), connecting lines between all pairs, center crosshair + dot, ID label top-left. Ryoji Ikeda blob-tracking aesthetic.
4. **UI panels** (z=1–2, relative) — `rgba(0,0,0,0.28)` glass backgrounds, white borders (`rgba(255,255,255,0.75)`), white text with `textShadow: "0 1px 14px rgba(0,0,0,1), 0 0 30px rgba(0,0,0,0.95)"`. Space Mono font throughout.

Homepage location section shows coordinates only (lat/lon) — no reverse-geocoded address name. `handleLocationChange` just calls `setLon`/`setLat`; no debounce or fetch.

**Visualisation/results page** (`frontend-v2/components/results/ClimateStream.tsx` → renders when `summary` arrives):
1. **`WarpedTextureBackground texturePath="/hurricanerafael.jpg"`** (`components/shared/WarpedTextureBackground.tsx`) — bottom layer (z=0, absolute). Raw WebGL (Three.js, no R3F) fullscreen quad rendering `public/hurricanerafael.jpg` through a two-level domain-warp FBM GLSL shader. Accepts optional `texturePath` and `params?: Partial<ShaderParams>` props. GLSL uniforms `uWarmth`, `uTurbulence`, `uAridity` (0–1 each). Mouse steers warp via lazy exponential inertia.
2. **Dark overlay** — `rgba(0,0,0,0.62)` `position:absolute` div for text legibility.
3. **`CRTBackground glitch`** (`components/design-test/CRTBackground.tsx`) — transparent WebGL canvas with `glitch={true}`: alpha ~0.52, horizontal tear glitches, digital noise burst blocks, stronger scanline jitter (`0.008`), interference bands every 3.5s, chromatic aberration spikes, faster flicker.
4. **`Dashboard`** (z=10) — terminal-aesthetic results UI with typing animation (see below).

Layout (both pages) is a column flex (header 40px → middle row flex:1 → footer 34px).

### IkedaLoadingScreen (`frontend-v2/components/results/IkedaLoadingScreen.tsx`)

Canvas 2D barcode-style loading animation shown by `ClimateStream` while the NDJSON stream is in progress (before `"summary"` arrives).

- Pure black background (`#000`). Canvas uses `mixBlendMode: "screen"` so overlapping bars naturally bloom.
- 4 zones stacked vertically, each taking `H/4`. Each zone has 6 sublayers (`SUBLAYERS`): two thin bar layers, one text layer, one medium bar layer, one bold text layer, one wide bar layer.
- Layer height is dynamic: `layerH = Math.floor(zoneH / N_LAYERS)` — layers tile the full zone height with no gaps.
- Bar layers: white `rgba(255,255,255,α)` with `ctx.shadowBlur` glow (7px active, 4px resolved, 0 queued).
- Text layers: red `rgba(255,40,40,α)` scrolling ASCII strings with strong bloom (`ctx.shadowBlur` 16px active, 10px resolved, 4px queued).
- Bars keep scrolling after a zone completes (resolved speed = `speedMul * 0.15`, not 0).
- Zone states: resolved (● COMPLETE), active (● PROCESSING...), queued (○ QUEUED). Active zone drives a moving scanline pulse.
- Bottom bar shows address | lat/lon/season/year | elapsed timer (updates every 100 ms).
- `zone0Ref` auto-resolves zone 0 after 2 s (pipeline init). Zones 1–3 resolve when `"rag"`, `"web"`, `"summary"` events arrive.

### Dashboard (`frontend-v2/components/results/Dashboard.tsx`)

Terminal-aesthetic results view. Three panels in the middle row:

- **Left (300px)** — Data table. One row per `data_table` entry: variable code + label, baseline→projected values, coloured delta (▲ amber / ▼ sky-blue), 2px delta bar centred at zero. Rows are revealed one at a time by the typing animation step counter.
- **Centre (flex:1)** — Title, Analysis (overview text), Key Points (takeaways), Likely Impacts (bullets). All body text types in character-by-character via a single `setInterval` at 16 ms. A blinking `▌` cursor tracks the actively-typing item.
- **Right (240px)** — "About This Data" legend (always fully visible, static) + Sources (citations type in). Legend explains Baseline, Projected, SSP2-4.5, ▲/▼ colours, and resolution.

`buildSchedule(summary)` pre-computes a flat array of `{id, kind, startStep, endStep, text}` items. `step` increments every 16 ms. `getTyped(id)` slices `text.slice(0, step - startStep)` to reveal characters; `visible(id)` returns `step >= startStep`. `overflow: hidden` on every panel body keeps everything on one screen.

`formatDelta()` note: temperature deltas stored in Kelvin are differences (ΔK = Δ°C) — do NOT subtract 273.15. The function checks `displayFormat === "kelvin" || "celsius"` and returns `${absDelta.toFixed(1)}°C` directly.

### CRTBackground prop

`<CRTBackground glitch />` — used only on the results/visualisation page (`ClimateStream.tsx`). Alpha 0.52, horizontal tears, noise blocks, jitter 0.008, bands every 3.5 s, chromatic spikes. Not used on the homepage.

### WarpedTextureBackground props

`texturePath?: string` — defaults to `/tinydebby.jpg`. Set to `/hurricanerafael.jpg` on the results page.  
`params?: Partial<ShaderParams>` — `{ warmth, turbulence, aridity }` each 0–1. Not currently applied on results screen (neutral defaults). `ShaderParams` is defined in `frontend-v2/types/climate.ts`.  
**Only used on the results/visualisation page.** Not used on the homepage.

### Text styling convention

All UI text uses Space Mono. Text shadow is `"0 1px 14px rgba(0,0,0,1), 0 0 30px rgba(0,0,0,0.95)"` (double-layer) for legibility — especially important on the results page where text sits over the animated satellite texture. Section labels (`LABEL` const) are `0.64rem / opacity 0.75`. Body text is `0.68–0.72rem / opacity 0.88–0.92`. Do not reduce these or revert to the old single-shadow `"0 1px 10px rgba(0,0,0,0.85)"`.

### Globe (`frontend-v2/components/home/Globe.tsx`)
- MapLibre GL JS with `globe` projection. Style: CartoDB Dark Matter. Marker: `#e8e8d8`, draggable, scale 0.85. Container has `background: "#00000000"` (transparent) so the particle system shows through.
- Initial centre: London (`[-0.1276, 51.5072]`), zoom 1.6.
- `background-opacity` set to `0.8` on `style.load`. All other layers forced to opacity 1 so land/countries stay solid against the transparent background.
- `onLocationChange` fires on `dragend`, passes `(lon, lat)` rounded to 4 decimal places. Also fires once on mount with the initial London coordinates.

### Three.js / WebGPU (legacy `Frontend/` only)
- `Frontend/components/THREEjs/sketch.tsx` defines the shader using **TSL (Three Shading Language) node-based shaders** (`three/tsl` imports) executed via WebGPU (`three/webgpu`). It is *not* GLSL. Helpers live under `THREEjs/tsl/{noise,effects,post_processing,utils}`.
- All R3F components must have `'use client'` at the top (per commit history, this was a fix). When adding new R3F/WebGPU components, include the directive.
- `setting.txt` (repo root) contains preset uniform values (`fast noise`, `slow`, `website`) for tuning the shader in `sketch.tsx` — copy/paste blocks, don't treat it as code.
- `frontend-v2`'s warped texture background is a GLSL ES 1.00 port of the TSL shader — **not** TSL/WebGPU. The original TSL version lives in `Frontend/` only.

### LLM model routing
- Gemini (`gemini-2.5-flash`) handles model selection, web search grounding, RAG query generation, and RAG summary.
- OpenAI (`gpt-4.1`) handles the final structured summary against `JSON_SCHEMA` in `open_ai.py`. `JSON_SCHEMA` includes a `shader_params` field (`warmth`, `turbulence`, `aridity`, each 0–1) for potential future use driving the GLSL uniforms — currently not applied on the results screen.
- OpenAI `text-embedding-3-small` is the embedding model for Chroma (must match between ingest in `chromaDB_scripts/main.py` and retrieval in `Backend/src/rag/chroma_db.py`).

## Environment variables

Each sub-project has its own `.env` (all gitignored).

- `Backend/.env`: `GEMINI_API_KEY`, `OPENAI_API_KEY`, `CHROMA_API_KEY`, `CHROMA_TENANT`, `DATABASE`, `CHROMA_OPENAI_API_KEY`. Earth Engine project is hard-coded as `climatechangeproject-477817` in `earth_engine.py`.
- `chromaDB_scripts/.env`: same Chroma + OpenAI keys.
- `frontend-v2/.env`: `BACKEND_URL`, `NEXT_PUBLIC_MAPBOX`, `ISITWATER`.
- `Frontend/.env` (legacy): present but no variables are read by the current code (backend URL is hard-coded).

## Conventions and gotchas

- The repo path contains a space (`Front End Development/`) — always quote paths in shell commands.
- A lot of `# type: ignore` on `ee.*` calls in `earth_engine.py` — the `earthengine-api` package has weak typings; keep these when editing.
- `Backend/src/main.py` and `earth_engine.py` contain large commented-out blocks for `get_projected_time_series` (a force-graph time-series feature). The graph node/link data structure consumed by `Frontend/components/Client/ThreePointVis` originates here — uncomment that pipeline if reviving the node visualisation.
- `chromaDB_scripts/main.py` patches `pypdf.filters.ZLIB_MAX_OUTPUT_LENGTH = 0` to disable a decompression bomb guard — needed for some of the climate PDFs.
- The `/climate` endpoint is a streaming NDJSON contract end-to-end: `Backend/src/main.py` → `frontend-v2/app/api/climate/route.ts` (proxy, passes `response.body` straight through) → `frontend-v2/components/results/ClimateStream.tsx` (parses it). Any change to the event shape (`{"type": ..., "data": ...}`) must be updated in all three places, plus `AnalysingStatus`'s `Stage` type if a new event type is added. Don't call `response.json()` anywhere in this chain — it isn't a single JSON document.
- `frontend-v2/public/tinydebby.jpg` — satellite image (unused on homepage; available if the warped shader is ever re-added there).
- `frontend-v2/public/hurricanerafael.jpg` — satellite image used by `WarpedTextureBackground` on the results/visualisation screen. Copied from `Frontend/public/hurricanerafael.jpg`.
- The `WarpedTextureBackground` GLSL simplex noise uses hardcoded `ns` constants rather than the `D.wyz`/`D.xzx` swizzle pattern from the TSL original — intentional for GLSL ES 1.00 compatibility.
- The year slider (`terminal-range` CSS class in `globals.css`) uses light colours (white track/thumb) to show against the dark transparent panel. Don't revert to the original dark colours.
- `AnalysingStatus` (`components/results/AnalysingStatus.tsx`) is kept for its `Stage` type export only — it is not rendered anywhere. The loading UI is entirely `IkedaLoadingScreen`. Don't re-introduce `AnalysingStatus` as a rendered component.
- `app/visualisation/loading.tsx` is intentionally minimal (black screen) — it is a Next.js Suspense boundary that only shows for the instant `searchParams` resolves. Do not put a real loading UI here; `IkedaLoadingScreen` inside `ClimateStream` is the loading experience.
