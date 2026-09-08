<!-- refreshed: 2026-09-08 -->
# Architecture

**Analysis Date:** 2026-09-08

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Client Layer: Next.js 14 Dashboard / new-ui                 │
│      (Cytoscape.js Graph Canvas • Real-Time WebSockets • Legal Modals)       │
│                `frontend/pages/` • `frontend/components/`                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP REST / WebSocket JSON
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FastAPI Application Gateway                            │
│                 `backend/main.py` • `backend/api/routes.py`                 │
├──────────────────────────────┬──────────────────────────────┬───────────────┤
│    REST Forensics API        │     WebSocket Event Hub      │ Background    │
│  (/trace, /graph, /freeze)   │     (`ws_manager.py`)        │ Task Runner   │
└──────────────┬───────────────┴──────────────┬───────────────┴───────┬───────┘
               │                              │                       │
               ▼                              ▼                       ▼
┌──────────────────────────────┐┌──────────────────────────────┐┌─────────────┐
│     Relational Store         ││       Graph Store            ││ Cache & MQ  │
│  PostgreSQL 15 / SQLite      ││   Neo4j 5.15 / In-Memory     ││  Redis 7.0  │
│  `backend/database/`         ││   `backend/neo4j/`           ││  (5m TTL)   │
└──────────────┬───────────────┘└─────────────┬────────────────┘└──────┬──────┘
               │                              │                        │
               ▼                              ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Forensics Engine Subsystems                             │
├──────────────────────────────┬──────────────────────────────┬───────────────┤
│ BFS Multi-Hop Graph Tracer   │ ML Anomaly & Risk Scorer     │ Exchange VASP │
│ `backend/blockchain/tracer`  │ `backend/ml/risk_scorer.py`  │ Classifier    │
│                              │ `backend/ml/clustering.py`   │ `scraper/`    │
├──────────────────────────────┴──────────────────────────────┴───────────────┤
│ Statutory Section 91 CrPC Legal Notice PDF Generator (`backend/legal/`)     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│               External Blockchain RPC & OSINT Infrastructure                │
│             `backend/blockchain/rpc_client.py` (Alchemy / Web3)             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **FastAPI App** | Application entry point, CORS middleware, WebSocket listeners, startup DB init | `backend/main.py` |
| **API Router** | REST endpoints (`/trace`, `/graph`, `/freeze-notice`, `/labels`, `/cluster`) | `backend/api/routes.py` |
| **WebSocket Manager** | Connection pooling and room-based event broadcasting (`global`, `trace_id`) | `backend/api/ws_manager.py` |
| **Blockchain Tracer** | Multi-hop Breadth-First Search (BFS) graph traversal from victim wallet | `backend/blockchain/tracer.py` |
| **RPC Client** | Ethereum / Polygon transaction and ERC-20 transfer fetcher with Redis caching | `backend/blockchain/rpc_client.py` |
| **Risk Scorer** | Isolation Forest ML model scoring transaction patterns and wallet risk (0-100%) | `backend/ml/risk_scorer.py` |
| **Wallet Clusterer** | K-Means clustering algorithm grouping money mules, sybil networks, and whale hubs | `backend/ml/clustering.py` |
| **Notice Generator** | ReportLab PDF engine drafting statutory Section 91 CrPC freeze directives | `backend/legal/notice_generator.py` |
| **Exchange Crawler** | OSINT crawler for exchange deposit addresses with curated high-confidence seed labels | `backend/scraper/exchange_crawler.py` |
| **Neo4j Client** | Graph database interface writing `Wallet` nodes and `TRANSFERS_TO` edges | `backend/neo4j/client.py` |
| **Database Layer** | SQLAlchemy models and CRUD operations for complaints, traces, and labels | `backend/database/db.py`, `backend/database/schemas.py`, `backend/database/crud.py` |
| **Celery Tasks** | Optional distributed task workers for heavy background forensic analysis | `backend/tasks/celery_tasks.py` |
| **Graph UI** | Cytoscape.js canvas with Dagre hierarchical layout and interactive node inspection | `frontend/components/CytoscapeGraph.tsx` |
| **Trace Form** | Investigation initiation form with chain selection, max hops, and complaint IDs | `frontend/components/TraceForm.tsx` |

## Pattern Overview

**Overall:** Event-Driven Microservice Architecture with Multi-Tier Fallbacks and Monorepo Deployment.

**Key Characteristics:**
- **Asynchronous Non-Blocking Processing:** Traces run in the background via FastAPI `BackgroundTasks` (or Celery workers), notifying connected clients via WebSockets.
- **Fail-Safe Self-Healing Fallbacks:** Every heavy infrastructure dependency has an automatic lightweight fallback: PostgreSQL falls back to SQLite, Neo4j falls back to an in-memory graph, Redis falls back to an in-memory TTL dictionary, and Alchemy falls back to deterministic synthetic blockchain data.
- **Police / Legal Compliance Alignment:** Data schemas explicitly reflect Indian statutory criminal procedures (CrPC Section 91, NCRP complaint identifiers, FIU-IND VDA registrations).

## Layers

**Presentation Layer:**
- Purpose: Deliver forensic investigation interface for cyber cell officers
- Location: `frontend/pages/`, `frontend/components/`, `new-ui/src/`
- Contains: Next.js pages, React components, Cytoscape graph canvas, SVG badge renderers, legal modal dialogues
- Depends on: Backend REST API and WebSocket events
- Used by: Investigating Officers, Forensic Analysts

**API Gateway Layer:**
- Purpose: Route incoming requests, validate input shapes, coordinate background tasks, broadcast WebSocket events
- Location: `backend/main.py`, `backend/api/`
- Contains: FastAPI application, Pydantic request models, WebSocket connection registry
- Depends on: Forensics engine, database layer
- Used by: Frontend dashboard, automated scripts

**Forensics Engine Layer:**
- Purpose: Execute graph traversal, ML behavioral scoring, exchange attribution, and legal document compilation
- Location: `backend/blockchain/`, `backend/ml/`, `backend/legal/`, `backend/scraper/`
- Contains: BFS tracer, Isolation Forest scorer, K-Means clusterer, ReportLab PDF builder
- Depends on: RPC client, Neo4j client, Database layer
- Used by: API Router, Celery workers

**Data & Persistence Layer:**
- Purpose: Persist complaint records, traces, graph nodes, relationships, and cache RPC responses
- Location: `backend/database/`, `backend/neo4j/`
- Contains: SQLAlchemy ORM models, CRUD helpers, Neo4j Cypher drivers
- Depends on: PostgreSQL, Neo4j, Redis (or local in-memory/SQLite fallbacks)
- Used by: Forensics Engine, API Gateway

## Data Flow

### Primary Request Path (Initiate & Complete Trace)

1. **Initiate Investigation:** Investigating officer enters victim wallet address and clicks "Start Forensic Trace" in `frontend/components/TraceForm.tsx`.
2. **API Entry:** `POST /api/v1/trace` handled in `backend/api/routes.py:137`.
3. **Complaint Registration:** Initial complaint and trace records inserted into database via `backend/database/crud.py:154`.
4. **Background Task Dispatch:** `run_trace_task` spawned via FastAPI `BackgroundTasks` (`backend/api/routes.py:164`).
5. **BFS Graph Traversal:** `tracer.trace()` executes iterative breadth-first search querying outgoing transactions via `BlockchainClient.get_transfers()` (`backend/blockchain/tracer.py:63`).
6. **Hop Discovery Streaming:** For each discovered hop, `ws_callback` emits `HOP_DISCOVERED` event via `ws_manager.broadcast_to_trace()` (`backend/api/routes.py:54`), updating UI live.
7. **Exchange Identification:** At each wallet node, `_lookup_vasp()` queries `WalletLabel` table (`backend/blockchain/tracer.py:36`). If terminal VASP (e.g., Binance) is hit and `stop_at_vasp=True`, traversal halts along that branch.
8. **ML Anomaly Scoring & Clustering:** `RiskScorer.predict()` scores wallet risk; `WalletClusterer.cluster_wallets()` groups wallets into behavioral cohorts (`backend/api/routes.py:98`).
9. **Result Persistence & Completion:** Final trace record committed to DB; `TRACE_COMPLETED` WebSocket event broadcast to client (`backend/api/routes.py:117`).
10. **Interactive Graph Render:** Client displays complete Cytoscape.js directed graph in `frontend/pages/trace/[trace_id].tsx`.

### Secondary Flow (Statutory Freeze Notice PDF Generation)

1. **User Action:** Officer clicks "Draft Section 91 CrPC Freeze Notice" in UI.
2. **API Call:** `POST /api/v1/freeze-notice` received with `trace_id` and `exchange_name` (`backend/api/routes.py:287`).
3. **Data Retrieval:** Trace details, hops count, and target VASP fetched from database.
4. **PDF Compilation:** `NoticeGenerator.generate()` builds court-admissible PDF with Indian National Emblem header, Section 91 CrPC statutory directives, transaction hop table, and compliance warning (`backend/legal/notice_generator.py:67`).
5. **Binary Stream Response:** Raw PDF bytes returned with `application/pdf` Content-Type header for immediate download or preview.

**State Management:**
- Frontend: React component state (`useState`, `useRef`) synchronized with backend via WebSocket stream (`useWebSocket.ts`).
- Backend: Relational state persisted in SQLAlchemy (`Trace`, `Complaint`), live in-flight progress cached in memory (`TRACE_PROGRESS`).

## Key Abstractions

**`BlockchainTracer`:**
- Purpose: Encapsulates BFS multi-hop traversal with depth limiting, node capping, and VASP branch pruning
- Examples: `backend/blockchain/tracer.py`
- Pattern: Strategy / Graph Traversal Engine

**`BlockchainClient`:**
- Purpose: Transparent blockchain data accessor abstracting live Alchemy RPC calls, Redis caching, and synthetic deterministic mock fallbacks
- Examples: `backend/blockchain/rpc_client.py`
- Pattern: Adapter / Cache-Aside Gateway

**`RiskScorer` & `WalletClusterer`:**
- Purpose: Feature extraction pipeline and unsupervised ML inference on crypto address behavior
- Examples: `backend/ml/risk_scorer.py`, `backend/ml/clustering.py`
- Pattern: Pipeline / Estimator

**`NoticeGenerator`:**
- Purpose: Template-driven legal document compiler transforming raw trace data into statutory PDF notices
- Examples: `backend/legal/notice_generator.py`
- Pattern: Builder / Factory

## Entry Points

**Backend API:**
- Location: `backend/main.py`
- Triggers: `uvicorn backend.main:app --host 0.0.0.0 --port 8000` or Docker container startup
- Responsibilities: Initializes database tables, seeds exchange labels, starts WebSocket listener, binds REST router

**Frontend Application:**
- Location: `frontend/pages/index.tsx`, `frontend/pages/_app.tsx`
- Triggers: `npm run dev` or browser navigation to `http://localhost:3000`
- Responsibilities: Renders navigation bar, search interface, case dashboard, and WebSocket subscriber

**Alternative AI Studio App:**
- Location: `new-ui/src/main.tsx`
- Triggers: `npm run dev` in `new-ui/`
- Responsibilities: Vite-based client dashboard rendering static mock cases with Google GenAI integration

**CLI Benchmark & Seeder:**
- Location: `scripts/benchmark.py`, `scripts/seed_demo_scenarios.py`
- Triggers: `python scripts/seed_demo_scenarios.py`
- Responsibilities: Seeds initial mock cases and tests BFS latency limits

## Architectural Constraints

- **Single-Threaded Event Loop with Thread Delegation:** FastAPI handles I/O via async/await; CPU-bound ML and blocking ReportLab PDF generation run synchronously or via background tasks.
- **In-Memory Graceful Degradation:** All heavy external infrastructure (PostgreSQL, Neo4j, Redis, Alchemy) is optional in local development; system will operate entirely using SQLite and memory buffers.
- **Strict VASP Stopping Rule:** BFS graph traversal terminates exploration on branches where a centralized exchange deposit address is identified to avoid unbounded spidering of internal exchange hot wallets.

## Anti-Patterns

### Mixing Synthetic Test Data with Real Database Records
**What happens:** Synthetic addresses starting with `0xaaaa` or `0xbeef` are persisted directly into `cryptofraud.db` alongside actual investigation records.
**Why it's wrong:** Pollutes law enforcement audit trails and corrupts clustering centroids.
**Do this instead:** Maintain an explicit `is_demo` or `source="SIMULATION"` flag on `Complaint` and `Trace` models.

### Duplicate Frontend Projects in Monorepo
**What happens:** Two separate frontend applications (`frontend/` and `new-ui/`) coexist without shared components or unified API clients.
**Why it's wrong:** Feature changes in one frontend are not mirrored in the other; confuses deployment targets.
**Do this instead:** Establish `frontend/` as the canonical Next.js application or migrate `new-ui/` components into `frontend/components/`.

## Error Handling

**Strategy:** Fail-soft with automatic fallback and logging; critical API endpoints return informative JSON errors with proper HTTP status codes.

**Patterns:**
- Catch connection exceptions on database/Redis/Neo4j startup and switch to local in-memory structures (`try/except` in `db.py`, `client.py`, `rpc_client.py`).
- Validate Ethereum addresses (`0x` prefix, 42 characters) upfront with `HTTPException(400)` before initiating long-running traces.
- Catch background tracer errors and emit `TRACE_FAILED` WebSocket events so UI does not hang.

## Cross-Cutting Concerns

**Logging:** Centralized Python logging formatted with timestamps and module names (`backend/main.py`).
**Validation:** Pydantic schemas (`TraceRequest`, `FreezeNoticeRequest`) validate HTTP request payloads (`backend/blockchain/models.py`).
**Audit Trail:** Every complaint, trace execution, and generated freeze notice is timestamped and persisted in relational database tables.

---

*Architecture analysis: 2026-09-08*
