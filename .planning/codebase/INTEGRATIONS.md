# External Integrations

**Analysis Date:** 2026-09-08

## APIs & External Services

**Blockchain RPC & Node Providers:**
- Alchemy Enhanced API - Real-time querying of EVM transactions (`eth_getTransactionByHash`), block headers, and asset transfers (`alchemy_getAssetTransfers`) across Ethereum and Polygon mainnets (`backend/blockchain/rpc_client.py`)
  - SDK/Client: HTTP JSON-RPC 2.0 via `requests` / `asyncio.to_thread`
  - Auth: `ALCHEMY_KEY`
  - Fallback: Deterministic synthetic mock transaction and transfer generation when key is missing or set to demo mode
- QuickNode - Alternative EVM RPC node infrastructure (`backend/blockchain/rpc_client.py`, `docker-compose.yml`)
  - SDK/Client: HTTP JSON-RPC
  - Auth: `QUICKNODE_KEY`

**OSINT & Web Intelligence:**
- SerpAPI (Google Search API) - Automated querying of known exchange deposit addresses from public block explorers and public disclosures (`backend/scraper/exchange_crawler.py`)
  - SDK/Client: `serpapi` (`GoogleSearch`)
  - Auth: `SERPAPI_KEY`
  - Fallback: High-confidence curated in-memory dataset of 20+ verified exchange, mixer, and attacker addresses (`KNOWN_CURATED_LABELS`)

**Generative AI (Alternative UI):**
- Google Gemini API - Intelligent case summary and forensic dossier narrative synthesis in `new-ui/` (`new-ui/package.json`)
  - SDK/Client: `@google/genai`
  - Auth: `GEMINI_API_KEY`

## Data Storage

**Databases:**
- PostgreSQL 15 - Primary production relational database for complaint logs, trace metadata, wallet labels, clustering records, and legal freeze notices (`backend/database/schemas.py`, `docker-compose.yml`)
  - Connection: `DATABASE_URL` (`postgresql://crypto:cryptopass@postgres:5432/cryptofraud`)
  - Client: SQLAlchemy 2.0 ORM (`create_engine`, `SessionLocal`)
  - Fallback: Local SQLite database file (`sqlite:///./cryptofraud.db`) automatically activated if PostgreSQL is unreachable (`backend/database/db.py`)
- Neo4j 5.15 Community - Graph database for storing blockchain transaction nodes (`Wallet`) and directed transfer relationships (`TRANSFERS_TO`) (`backend/neo4j/client.py`, `docker/neo4j-init.cypher`)
  - Connection: `NEO4J_URI` (`bolt://neo4j:7687`), `NEO4J_USER`, `NEO4J_PASSWORD`
  - Client: `neo4j.GraphDatabase.driver`
  - Fallback: High-performance in-memory adjacency list and node/edge dictionary fallback (`self._mem_nodes`, `self._mem_edges`, `self._mem_adj`) if Neo4j is unavailable

**File Storage:**
- Local filesystem only - Generated statutory freeze notice PDFs and local SQLite database (`cryptofraud.db`, `backend/legal/notice_generator.py`)
- In-memory PDF streaming: PDFs generated on-the-fly via ReportLab into byte buffers and streamed directly as HTTP responses (`backend/api/routes.py`)

**Caching:**
- Redis 7.0+ - In-memory key-value cache for RPC transaction lookups and asset transfer histories with a 300-second (5 minute) TTL (`backend/blockchain/rpc_client.py`, `docker-compose.yml`)
  - Connection: `REDIS_URL` (`redis://redis:6379`)
  - Client: `redis.Redis.from_url`
  - Fallback: Local in-memory timestamped dictionary (`self._memory_cache`) if Redis is unreachable

## Authentication & Identity

**Auth Provider:**
- Custom / Local Role-Based Model - Prepared for law enforcement cyber cell officers (I4C / State Police)
  - Investigator metadata (`investigator_name`, `rank`, `badgeNumber`, `policeStation`) passed via request payloads and recorded on freeze notices
  - API endpoints are currently unauthenticated / open internally for SIH demonstration and rapid investigative access

## Monitoring & Observability

**Error Tracking:**
- None - Relies on Python `logging` module and FastAPI standard exception handlers (`backend/main.py`)

**Logs:**
- Standard Python `logging` formatting: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`
- Configurable via `LOG_LEVEL` environment variable (`INFO`, `DEBUG`, `WARNING`)
- Docker container stdout/stderr logging via standard Docker daemon log driver

## CI/CD & Deployment

**Hosting:**
- Containerized deployment via Docker Compose (`docker-compose.yml`) supporting 6 orchestrated services:
  - `cryptofraud-postgres` (Port 5432)
  - `cryptofraud-neo4j` (Ports 7687, 7474)
  - `cryptofraud-redis` (Port 6379)
  - `cryptofraud-backend` (Port 8000)
  - `cryptofraud-celery` (Background task worker)
  - `cryptofraud-frontend` (Port 3000)
- Alternative UI (`new-ui/`) designed for deployment on Google Cloud Run via AI Studio (`new-ui/README.md`)

**CI Pipeline:**
- None detected in `.github/workflows` (local testing via `pytest backend/tests/` and `python scripts/benchmark.py`)

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - Relational DB connection string (defaults to SQLite fallback `sqlite:///./cryptofraud.db`)
- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` - Neo4j credentials (defaults to bolt://localhost:7687)
- `REDIS_URL` - Redis cache & Celery broker URI (defaults to redis://localhost:6379)
- `ALCHEMY_KEY` - Web3 node provider key for live blockchain RPC queries
- `SERPAPI_KEY` - Search API for exchange attribution scraping
- `NEXT_PUBLIC_API_URL` - Backend URL consumed by Next.js frontend

**Secrets location:**
- `.env` in repository root (never committed, template in `.env.example`)
- `new-ui/.env` in `new-ui/` directory (template in `new-ui/.env.example`)

## Webhooks & Callbacks

**Incoming:**
- None (Direct REST and WebSocket connections)

**Outgoing:**
- Real-time WebSocket event streaming to connected frontend clients:
  - Global channel: `/ws/notifications`
  - Trace-specific channel: `/ws/trace/{trace_id}`
  - Broadcast events: `HOP_DISCOVERED` (progress, hop data), `TRACE_COMPLETED` (hops count, risk score, target VASP), `TRACE_FAILED` (error details)

---

*Integration audit: 2026-09-08*
