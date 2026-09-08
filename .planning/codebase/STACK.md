# Technology Stack

**Analysis Date:** 2026-09-08

## Languages

**Primary:**
- Python 3.11+ - Backend API, blockchain traversal algorithms, machine learning scoring, legal document generation (`backend/`, `scripts/`)
- TypeScript 5.4+ / 5.8+ - Primary dashboard (`frontend/`) and alternative AI Studio forensic dossier interface (`new-ui/`)

**Secondary:**
- JavaScript (ESNext / Node.js) - Build tooling, Next.js configuration (`frontend/next.config.js`), Tailwind setup
- Cypher - Neo4j graph queries and index setup (`docker/neo4j-init.cypher`, `backend/neo4j/client.py`)
- SQL - Relational schema migrations and queries via SQLAlchemy ORM (`backend/database/schemas.py`)
- Shell / Bash - Container healthchecks and initialization scripts (`docker/init-db.sh`, `docker-compose.yml`)

## Runtime

**Environment:**
- Python 3.11 runtime (via local venv or `python:3.11-slim` Docker image)
- Node.js 18+ / 20+ (supporting Next.js 14 and Vite 6)

**Package Manager:**
- pip - Python package manager (`backend/requirements.txt`)
  - Lockfile: missing (relies on version-pinned `requirements.txt`)
- npm - Node package manager (`frontend/package.json`, `new-ui/package.json`)
  - Lockfiles: present (`frontend/package-lock.json`, `new-ui/package-lock.json`)

## Frameworks

**Core:**
- FastAPI (>=0.104.1) - Asynchronous REST API router, WebSocket endpoint management, background tasks (`backend/main.py`, `backend/api/routes.py`)
- Next.js (14.2.3, Pages Router) - Primary forensic dashboard, server-rendered and client interactive views (`frontend/pages/`)
- React (18.3.1 in `frontend/`, 19.0.1 in `new-ui/`) - Component-based user interface (`frontend/components/`, `new-ui/src/components/`)
- Celery (>=5.3.4) - Distributed asynchronous task queue for long-running graph traversals (`backend/tasks/celery_app.py`)

**Testing:**
- Pytest (>=7.4.3) - Backend unit, integration, and ML testing (`backend/tests/`)
- pytest-asyncio (>=0.21.1) - Async test support for FastAPI routes and async clients (`backend/tests/test_integration.py`)
- httpx (>=0.25.2) - ASGI test client transport for API integration tests (`backend/tests/test_integration.py`)

**Build/Dev:**
- Uvicorn (>=0.24.0) - High-performance ASGI web server (`backend/main.py`)
- Vite (6.2.3) - Fast dev server and bundler for `new-ui/` (`new-ui/vite.config.ts`)
- Tailwind CSS (3.4.3 in `frontend/`, 4.1.14 in `new-ui/`) - Utility-first styling framework
- PostCSS (8.4.38) & Autoprefixer (10.4.19) - CSS processing pipeline (`frontend/postcss.config.js`)
- Docker & Docker Compose - Microservice container orchestration (`docker-compose.yml`, `docker/`)

## Key Dependencies

**Critical:**
- `sqlalchemy` (>=2.0.23) - ORM and relational database connection engine with SQLite and PostgreSQL compatibility (`backend/database/db.py`)
- `neo4j` (>=5.15.0) - Official Python driver for Neo4j graph database interaction (`backend/neo4j/client.py`)
- `redis` (>=5.0.0) - Redis client for transaction caching (5m TTL) and Celery message broker (`backend/blockchain/rpc_client.py`)
- `cytoscape` (3.29.2) & `cytoscape-dagre` (2.5.0) - Directed graph layout and interactive canvas visualization (`frontend/components/CytoscapeGraph.tsx`)
- `reportlab` (>=4.0.7) - Programmatic PDF generation engine for Section 91 CrPC statutory freeze orders (`backend/legal/notice_generator.py`)
- `scikit-learn` (>=1.3.2) - Anomaly detection via `IsolationForest` and sybil clustering via `KMeans` (`backend/ml/risk_scorer.py`, `backend/ml/clustering.py`)
- `numpy` (>=1.24.0) & `pandas` (>=2.1.0) - Numerical feature extraction and matrix manipulation for ML models
- `pydantic` (>=2.5.0) & `pydantic-settings` (>=2.1.0) - Request/response schema validation (`backend/blockchain/models.py`)

**Infrastructure:**
- `psycopg2-binary` (>=2.9.9) - PostgreSQL database driver for Linux/container environments (`backend/database/db.py`)
- `websockets` (>=12.0) - WebSocket communication protocol (`backend/main.py`)
- `web3` (>=6.11.0) - Ethereum blockchain connectivity and utilities (`backend/blockchain/rpc_client.py`)
- `lucide-react` (0.378.0 in `frontend/`, 0.546.0 in `new-ui/`) - Forensic UI iconography
- `axios` (1.6.8) - HTTP client for frontend API calls (`frontend/pages/trace/[trace_id].tsx`)
- `react-hot-toast` (2.4.1) - In-app notification toast alerts (`frontend/pages/trace/[trace_id].tsx`)
- `@google/genai` (2.4.0 in `new-ui/`) - Gemini API SDK for AI-assisted case dossier summaries (`new-ui/package.json`)

## Configuration

**Environment:**
- Environment variables configured via `.env` (seeded from `.env.example` in repo root and `new-ui/.env.example`)
- Loaded via `python-dotenv` in Python backend and Next.js built-in env handling (`NEXT_PUBLIC_API_URL`)
- Key configuration variables:
  - `DATABASE_URL`: PostgreSQL connection string (defaults to `sqlite:///./cryptofraud.db` fallback)
  - `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`: Neo4j graph database access (defaults to in-memory graph fallback if unreachable)
  - `REDIS_URL`: Cache and message broker connection (defaults to in-memory TTL dictionary fallback if unreachable)
  - `ALCHEMY_KEY`: Web3 / ERC-20 token transfer RPC queries (defaults to deterministic synthetic mock data if key is missing or demo)
  - `SERPAPI_KEY`: Google Search API for exchange wallet scraping (falls back to curated list if missing)
  - `NEXT_PUBLIC_API_URL`: Backend API URL consumed by frontend (`http://localhost:8000`)
  - `LOG_LEVEL`: Logging verbosity (`INFO`, `DEBUG`, `WARNING`)

**Build:**
- `docker/Dockerfile.backend` - Multi-stage container for backend service and Celery worker
- `frontend/next.config.js` - Next.js configuration with Webpack fallback handling
- `frontend/tsconfig.json` & `new-ui/tsconfig.json` - TypeScript compiler options
- `frontend/tailwind.config.js` - Color palette and responsive breakpoints

## Platform Requirements

**Development:**
- Windows / Linux / macOS with Python 3.11+ and Node.js 18+
- Docker Engine 24+ & Docker Compose 2.20+ (optional; system includes full zero-Docker fallbacks for SQLite, in-memory caching, and in-memory graph)
- Modern web browser with WebGL / Canvas support for Cytoscape.js rendering

**Production:**
- Docker Compose / Kubernetes deployment target with 6 container services: `postgres`, `neo4j`, `redis`, `backend`, `celery-worker`, `frontend`
- Recommended server specifications: 4 vCPU, 8GB RAM, 50GB SSD storage

---

*Stack analysis: 2026-09-08*
