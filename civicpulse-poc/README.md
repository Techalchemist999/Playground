# CivicPulse PoC

Proof of concept for the CivicPulse real-time municipal audio intelligence backend.

Replicates the full architecture from the production Python/FastAPI system as a standalone
Node.js/Express app that runs without Azure, Neo4j, or any external credentials.

## Quick Start

```bash
npm install
npm start        # http://localhost:8002
```

## Architecture

```
Audio Source → [ASR] → [Transcript Buffer] → [Topic Extraction] → [Normalization]
  → [Graph Enrichment] → [Lifecycle] → [SSE Events] → Frontend
```

All services are simulated in-memory:
- **ASR** emits pre-built council meeting transcript chunks on a timer
- **Topic extraction** uses keyword matching (production: GPT-4o-mini)
- **Graph registry/writer** stores data in-memory (production: Neo4j)
- **Minutes generation** produces structured HTML (production: LLM-generated)

## Walkthrough: Run a Full Session

```bash
# 1. Health check
curl http://localhost:8002/healthz

# 2. Create a session (simulated YouTube ingest)
curl -X POST http://localhost:8002/api/cp/townofws/ingest/youtube \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/example"}'
# → returns { session_id: "..." }

# 3. Open SSE stream in another terminal (leave running)
curl -N http://localhost:8002/api/cp/townofws/stream/{session_id}

# 4. Start the pipeline (with optional agenda)
curl -X POST http://localhost:8002/api/cp/townofws/session/start \
  -H "Content-Type: application/json" \
  -d '{"session_id": "{session_id}", "agenda_id": "agenda-2024-03-15"}'

# 5. Watch SSE events stream in — topics appear, update, expire in real time

# 6. Stop the session (auto-generates minutes)
curl -X POST http://localhost:8002/api/cp/townofws/session/{session_id}/stop

# 7. View generated minutes
curl http://localhost:8002/api/cp/townofws/session/{session_id}/minutes

# 8. Export as HTML
curl http://localhost:8002/api/cp/townofws/session/{session_id}/export-html -o minutes.html

# 9. Save to graph + bridge to CliDE
curl -X POST http://localhost:8002/api/cp/townofws/session/{session_id}/save-minutes-to-graph

# 10. List agendas
curl http://localhost:8002/api/cp/townofws/agendas

# 11. Check graph registry
curl "http://localhost:8002/api/cp/townofws/graph/registry/match?label=Capital%20Budget"
```

## Endpoint Catalog (34 endpoints)

| # | Method | Path | Description |
|---|--------|------|-------------|
| 1 | GET | `/healthz` | Health check |
| 2 | GET | `/api/cp/clients-meta` | List all client metadata |
| 3 | WS | `/api/cp/{app}/session/{id}/mic-stream` | Live mic WebSocket |
| 4 | POST | `/api/cp/{app}/ingest/youtube` | YouTube audio extraction |
| 5 | POST | `/api/cp/{app}/ingest/upload` | File upload |
| 6 | POST | `/api/cp/{app}/ingest/mic` | Create mic push-stream |
| 7 | GET | `/api/cp/{app}/ingest/audio/{id}` | Serve audio for playback |
| 8 | POST | `/api/cp/{app}/session/start` | Start processing |
| 9 | POST | `/api/cp/{app}/session/{id}/pause` | Pause recognition |
| 10 | POST | `/api/cp/{app}/session/{id}/resume` | Resume recognition |
| 11 | POST | `/api/cp/{app}/session/{id}/stop` | Stop + auto-minutes |
| 12 | GET | `/api/cp/{app}/session/{id}/state` | Session state snapshot |
| 13 | GET | `/api/cp/{app}/session/{id}/topics` | All detected topics |
| 14 | GET | `/api/cp/{app}/agendas` | List available agendas |
| 15 | GET | `/api/cp/{app}/session/{id}/agenda` | Agenda alignment progress |
| 16 | POST | `/api/cp/{app}/session/{id}/export` | Export as TD format |
| 17 | GET | `/api/cp/{app}/stream/{id}` | SSE event stream |
| 18 | POST | `/api/cp/{app}/session/{id}/generate-minutes` | Generate full minutes |
| 19 | PUT | `/api/cp/{app}/session/{id}/minutes` | Save edited minutes |
| 20 | GET | `/api/cp/{app}/session/{id}/minutes` | Retrieve minutes |
| 21 | POST | `/api/cp/{app}/session/{id}/generate-section` | Regenerate one section |
| 22 | GET | `/api/cp/{app}/session/{id}/export-html` | Export as HTML |
| 23 | POST | `/api/cp/{app}/session/{id}/export-pdf` | Export as PDF (stub) |
| 24 | POST | `/api/cp/{app}/session/{id}/save-minutes-to-graph` | Write to Neo4j + CliDE |
| 25 | GET | `/api/cp/{app}/graph/registry/count` | Topic count in graph |
| 26 | GET | `/api/cp/{app}/graph/registry/match` | Fuzzy topic lookup |
| 27 | POST | `/api/cp/{app}/graph/write-session/{id}` | Write session to Neo4j |
| 28 | POST | `/api/cp/{app}/graph/add-topic` | Add single topic |
| 29 | POST | `/api/cp/{app}/graph/topic-summary` | AI topic summary |
| 30 | POST | `/api/cp/{app}/graph/batch-write` | Batch write topics |
| 31 | GET | `/api/cp/{app}/graph/sessions` | List persisted sessions |
| 32 | DELETE | `/api/cp/{app}/graph/session/{key}` | Delete session + data |
| 33 | DELETE | `/api/cp/{app}/graph/session/{key}/topic/{uid}` | Remove topic from session |
| 34 | PUT | `/api/cp/{app}/graph/session/{key}/minutes` | Update minutes on node |

## Project Structure

```
civicpulse-poc/
├── main.js                     # Express app entry point (port 8002)
├── pipeline/
│   ├── session_manager.js      # Orchestrates real-time pipeline per session
│   └── event_bus.js            # SSE event bus for streaming to frontend
├── routes/                     # 6 API routers
│   ├── ingest_router.js        # Audio ingestion (YouTube, upload, mic)
│   ├── session_router.js       # Session lifecycle (start/pause/resume/stop)
│   ├── stream_router.js        # SSE real-time event stream
│   ├── minutes_router.js       # Minutes generation, editing, export
│   ├── graph_registry_router.js # Topic registry lookups
│   └── graph_writer_router.js  # Neo4j graph writes and queries
├── services/                   # Business logic (11 files)
│   ├── asr_service.js          # Speech transcription (simulated)
│   ├── topic_extractor.js      # Topic extraction (keyword simulation)
│   ├── topic_normalizer.js     # Fuzzy dedup with string-similarity
│   ├── topic_lifecycle.js      # State machine: DETECTED → ACTIVE → EXPIRED
│   ├── transcript_buffer.js    # Rolling 30s transcript window
│   ├── llm_adapter.js          # LLM invocation (stub)
│   ├── graph_writer.js         # Batched graph writes (in-memory)
│   ├── graph_registry.js       # In-memory topic index
│   ├── td_bridge.js            # CivicPulse → Topic Disambiguation adapter
│   ├── agenda_fetcher.js       # Agenda retrieval (sample data)
│   └── agenda_aligner.js       # Real-time topic ↔ agenda item matching
├── schemas/                    # Data models
│   ├── topic_schemas.js        # ExtractedTopic, LiveTopic, TopicState
│   ├── transcript_schemas.js   # TranscriptChunk, WordTiming
│   ├── session_schemas.js      # SessionConfig, SessionState, SessionStatus
│   └── agenda_schemas.js       # AgendaItem, ParsedAgenda
├── prompts/                    # LLM prompt templates
│   ├── municipal_topic_extraction.js
│   ├── summarization.js
│   ├── minutes.js
│   └── agenda_minutes.js
├── shared/
│   └── config.js               # Configuration constants
└── middleware/
    └── auth.js                 # Auth gate + application resolution
```

## What's Simulated vs Production-Ready

| Component | PoC | Production |
|-----------|-----|------------|
| ASR | Timer-based simulated chunks | Azure Speech SDK continuous recognition |
| Topic extraction | Keyword matching | GPT-4o-mini with few-shot prompt |
| Topic normalization | string-similarity | RapidFuzz |
| Graph storage | In-memory Maps | Neo4j with batched UNWIND Cypher |
| Minutes generation | Template-based HTML | LLM-generated 11-section format |
| Auth | Dev user stub | Azure AD / session-based auth |
| PDF export | Stub response | xhtml2pdf |
| CliDE bridge | Console log | HTTP POST to CliDE backend |
| Config loading | Environment vars | Cosmos DB → config.json → fallback |
