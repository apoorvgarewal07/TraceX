# Codebase Structure

**Analysis Date:** 2026-09-08

## Directory Layout

```
A:/Trace X/
├── backend/                       # Core FastAPI application and forensics subsystems
│   ├── api/                       # API router endpoints and WebSocket managers
│   ├── blockchain/                # Multi-hop BFS tracer, RPC client, and request models
│   ├── database/                  # SQLAlchemy ORM schemas, SQLite/PostgreSQL engine, CRUD helpers
│   ├── legal/                     # Statutory Section 91 CrPC PDF notice generator
│   ├── ml/                        # Isolation Forest risk scorer and K-Means wallet clusterer
│   ├── neo4j/                     # Neo4j graph client, Cypher queries, and graph models
│   ├── scraper/                   # OSINT exchange crawler and curated wallet labels
│   ├── tasks/                     # Celery application and background worker tasks
│   ├── tests/                     # Pytest suite for backend modules and integration routes
│   ├── main.py                    # Application entry point and WebSocket routes
│   └── requirements.txt           # Python backend dependencies
├── frontend/                      # Next.js 14 forensic dashboard (police-grade UI)
│   ├── components/                # React UI components (CytoscapeGraph, TraceForm, Modals)
│   ├── hooks/                     # Custom React hooks (WebSocket client)
│   ├── pages/                     # Next.js Pages router (index, dashboard, trace dossier)
│   │   ├── api/                   # API proxy routes
│   │   └── trace/                 # Investigation dossier dynamic page ([trace_id].tsx)
│   ├── styles/                    # Global Tailwind CSS styles
│   ├── next.config.js             # Next.js bundler and build configuration
│   ├── package.json               # Frontend dependencies and npm scripts
│   ├── tailwind.config.js         # Tailwind styling theme and dark mode rules
│   └── tsconfig.json              # TypeScript compilation settings
├── new-ui/                        # Standalone AI Studio / Vite 6 React prototype interface
│   ├── src/                       # React 19 source files (App.tsx, components, data)
│   ├── package.json               # Vite dependencies (@google/genai, React 19)
│   └── vite.config.ts             # Vite bundler configuration
├── docker/                        # Docker orchestration assets
│   ├── Dockerfile.backend         # Container build recipe for FastAPI and Celery
│   ├── Dockerfile.frontend        # Container build recipe for Next.js
│   ├── init-db.sh                 # Database initialization shell script
│   └── neo4j-init.cypher          # Neo4j index setup script
├── scripts/                       # Automation, benchmarking, and seeding utilities
│   ├── benchmark.py               # BFS multi-hop latency and PDF generation benchmark
│   ├── seed_demo_scenarios.py     # Pre-seeded real-world forensic fraud scenarios
│   ├── seed_exchanges.py          # Exchange deposit wallet seed script
│   └── test_ws_streaming.py       # Standalone WebSocket client test script
├── .planning/                     # GSD planning, codebase intelligence, and tracking
│   └── codebase/                  # Generated codebase map documentation
├── .env.example                   # Environment configuration template
├── cryptofraud.db                 # Local SQLite database file with seeded demo cases
├── docker-compose.yml             # Full 6-microservice stack orchestration file
└── README.md                      # Comprehensive project documentation & architecture guide
```

## Directory Purposes

**`backend/`:**
- Purpose: Hosts all server-side logic, blockchain intelligence, database operations, and legal compilation
- Contains: Python modules, FastAPI routes, ML models, RPC connectors, and test files
- Key files: `backend/main.py`, `backend/blockchain/tracer.py`, `backend/legal/notice_generator.py`

**`backend/blockchain/`:**
- Purpose: Implements transaction graph traversal and RPC node interaction
- Contains: `tracer.py` (BFS traversal engine), `rpc_client.py` (Alchemy/Web3 client with Redis cache), `models.py` (Pydantic models)

**`backend/ml/`:**
- Purpose: Machine learning anomaly detection and address behavioral clustering
- Contains: `risk_scorer.py` (IsolationForest), `clustering.py` (K-Means)

**`backend/legal/`:**
- Purpose: Generation of statutory law enforcement freeze orders and legal notices
- Contains: `notice_generator.py` (ReportLab document styling and PDF layout)

**`backend/database/`:**
- Purpose: Relational persistence and database abstractions
- Contains: `db.py` (engine and session factory), `schemas.py` (SQLAlchemy models), `crud.py` (query helpers)

**`frontend/`:**
- Purpose: Primary law enforcement investigation web dashboard
- Contains: Next.js pages, React components, Tailwind styling, Cytoscape graph canvas
- Key files: `frontend/pages/index.tsx`, `frontend/pages/trace/[trace_id].tsx`, `frontend/components/CytoscapeGraph.tsx`

**`new-ui/`:**
- Purpose: Specialized AI Studio prototype featuring Gemini GenAI summary generation
- Contains: React 19 components, mock cases dataset (`new-ui/src/data/cases.ts`), Vite bundler setup

**`scripts/`:**
- Purpose: Operational scripts for testing, benchmarking, and pre-seeding forensic demonstration scenarios
- Contains: `benchmark.py`, `seed_demo_scenarios.py`, `test_ws_streaming.py`

**`docker/`:**
- Purpose: Container build specifications and service initialization scripts
- Contains: Dockerfiles for backend and frontend, Neo4j Cypher index scripts

## Key File Locations

**Entry Points:**
- `backend/main.py`: FastAPI server entry point and WebSocket route handlers
- `frontend/pages/index.tsx`: Next.js homepage and case initiation portal
- `new-ui/src/main.tsx`: Alternative Vite React dashboard entry point

**Configuration:**
- `backend/requirements.txt`: Python library dependencies
- `frontend/package.json`: Primary dashboard dependencies and build scripts
- `docker-compose.yml`: Microservice deployment topology
- `.env.example`: Reference configuration for all environment variables

**Core Logic:**
- `backend/blockchain/tracer.py`: Multi-hop BFS traversal algorithm
- `backend/blockchain/rpc_client.py`: Blockchain JSON-RPC client with caching
- `backend/ml/risk_scorer.py`: Transaction risk scoring model
- `backend/legal/notice_generator.py`: Section 91 CrPC statutory notice builder
- `frontend/components/CytoscapeGraph.tsx`: Directed graph visualization component

**Testing:**
- `backend/tests/test_tracer.py`: BFS traversal unit tests
- `backend/tests/test_integration.py`: End-to-end API route tests
- `backend/tests/test_risk_scorer.py`: ML model prediction tests
- `scripts/benchmark.py`: Latency and throughput benchmarks

## Naming Conventions

**Files:**
- Backend Python: lowercase with underscores (`rpc_client.py`, `notice_generator.py`)
- Frontend React: PascalCase for components (`CytoscapeGraph.tsx`, `TraceForm.tsx`), lowercase for pages and hooks (`index.tsx`, `useWebSocket.ts`, `[trace_id].tsx`)
- Documentation: UPPERCASE for root and planning docs (`README.md`, `STACK.md`)

**Directories:**
- Backend: lowercase single-word or underscore separated (`blockchain/`, `database/`, `neo4j/`)
- Frontend: lowercase standard Next.js conventions (`components/`, `hooks/`, `pages/`)

## Where to Add New Code

**New Blockchain / Chain Support:**
- Add chain RPC configuration and endpoint resolvers in `backend/blockchain/rpc_client.py`
- Update `chain` choices in `backend/blockchain/models.py` and `frontend/components/TraceForm.tsx`

**New ML Feature or Model:**
- Feature extraction logic in `backend/ml/risk_scorer.py:extract_features()`
- Unsupervised clustering updates in `backend/ml/clustering.py`

**New API Route:**
- Endpoint definition in `backend/api/routes.py`
- Pydantic models in `backend/blockchain/models.py`
- Database CRUD queries in `backend/database/crud.py`

**New Legal Template:**
- Legal notice builders in `backend/legal/notice_generator.py`
- Notice generation endpoint trigger in `backend/api/routes.py`

**New Frontend Forensic Widget:**
- Reusable UI component in `frontend/components/`
- Integrate into investigation dossier in `frontend/pages/trace/[trace_id].tsx`

## Special Directories

**`cryptofraud.db`:**
- Purpose: SQLite database containing pre-seeded law enforcement demo cases
- Committed: Yes (allows instant local execution without Docker/PostgreSQL)

**`.planning/`:**
- Purpose: GSD workflow planning, codebase mapping, and state tracking
- Committed: Yes

**`tracex-—-blockchain-forensics-dossier.zip`:**
- Purpose: Archived export of the AI Studio dossier prototype
- Committed: Yes

---

*Structure analysis: 2026-09-08*
