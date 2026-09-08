# Coding Conventions

**Analysis Date:** 2026-09-08

## Naming Patterns

**Files:**
- Python modules: `snake_case.py` (`rpc_client.py`, `risk_scorer.py`, `exchange_crawler.py`)
- React components: `PascalCase.tsx` (`CytoscapeGraph.tsx`, `TraceForm.tsx`, `RiskBadge.tsx`)
- Custom React hooks: `camelCase.ts` with `use` prefix (`useWebSocket.ts`)
- Next.js dynamic routes: `[param].tsx` (`pages/trace/[trace_id].tsx`)

**Functions:**
- Python: `snake_case` (`get_transfers`, `extract_features`, `cluster_wallets`, `seed_wallet_labels`)
- TypeScript / React: `camelCase` for utilities and hooks (`useWebSocket`, `handleSelectCase`, `formatCurrency`), `PascalCase` for React functional components (`CytoscapeGraph`, `TraceForm`)

**Variables:**
- Python: `snake_case` (`victim_wallet`, `trace_id`, `hops_data`)
- Python constants: `UPPER_SNAKE_CASE` (`KNOWN_CURATED_LABELS`, `LOG_LEVEL`, `DATABASE_URL`)
- TypeScript: `camelCase` (`selectedNodeId`, `activeHop`, `isTracing`)

**Types & Classes:**
- Python: `PascalCase` (`BlockchainTracer`, `BlockchainClient`, `RiskScorer`, `NoticeGenerator`, `Complaint`, `Trace`)
- TypeScript interfaces & types: `PascalCase` (`GraphNode`, `GraphEdge`, `GraphData`, `ForensicCase`, `TraceRequest`)

## Code Style

**Formatting:**
- Python: PEP 8 standard formatting with 4-space indentation and explicit type hinting where applicable (`typing.Dict`, `typing.List`, `typing.Optional`)
- TypeScript: Standard Prettier style formatting with 2-space indentation, semicolons, and single quotes in frontend packages

**Linting:**
- Next.js: ESLint via `npm run lint` (`next lint`) configured in `frontend/package.json`
- TypeScript: Strict type verification in `new-ui/` via `tsc --noEmit` (`new-ui/package.json`)

## Import Organization

**Order:**
1. Standard library imports (e.g., `os`, `sys`, `time`, `logging`, `asyncio`, `uuid`, `datetime`)
2. Third-party packages (e.g., `fastapi`, `sqlalchemy`, `pydantic`, `reportlab`, `sklearn`, `react`, `lucide-react`)
3. Internal application modules (e.g., `backend.database.db`, `backend.blockchain.rpc_client`, `backend.ml.risk_scorer`, `@/components/CytoscapeGraph`)

**Path Aliases:**
- Next.js frontend: `@/*` resolves to `./*` via `frontend/tsconfig.json`
- Python backend: Absolute module imports starting with `backend.` (e.g., `from backend.database.schemas import Trace`) with `sys.path` bootstrapping in CLI scripts

## Error Handling

**Patterns:**
- **Graceful Multi-Tier Degradation:** Wrap external network/database calls in `try...except` blocks and fallback to local in-memory or SQLite alternatives (`backend/neo4j/client.py`, `backend/blockchain/rpc_client.py`):
  ```python
  try:
      self.redis_client = redis.Redis.from_url(self.redis_url)
      self.redis_client.ping()
  except Exception as e:
      logger.warning(f"Redis cache not reachable: {e}. Using in-memory caching fallback.")
      self.redis_client = None
  ```
- **API Boundary Validation:** Validate user input (e.g. Ethereum wallet address length and hex format) and throw descriptive `HTTPException` with appropriate status codes:
  ```python
  victim_wallet = request.victim_wallet.strip().lower()
  if not victim_wallet.startswith("0x") or len(victim_wallet) != 42:
      raise HTTPException(status_code=400, detail="Invalid Ethereum/Polygon wallet address format.")
  ```
- **Asynchronous Task Safety:** Wrap background tasks in `try...except` and emit websocket error events (`TRACE_FAILED`) to prevent client hanging:
  ```python
  except Exception as e:
      logger.error(f"Error in background trace {trace_id}: {e}")
      TRACE_PROGRESS[trace_id] = {"status": "failed", "error": str(e)}
      await manager.broadcast_to_trace(trace_id, {"event": "TRACE_FAILED", "error": str(e)})
  ```

## Logging

**Framework:** Python standard library `logging` configured at application root in `backend/main.py`.

**Patterns:**
- Instantiate module-level loggers: `logger = logging.getLogger(__name__)`
- Use `logger.info()` for lifecycle events (startup, connected to Redis, trace initiated)
- Use `logger.warning()` for fallback triggering (Neo4j connection failed, using in-memory graph)
- Use `logger.error()` for unrecoverable task errors with exception messages

## Comments

**When to Comment:**
- Above complex algorithmic steps (BFS hop traversal, isolation forest feature extraction, ReportLab PDF table formatting)
- To explain fallback triggers and reason for synthetic mock generation

**Docstrings:**
- Google / Sphinx style docstrings on major classes and public functions (`BlockchainTracer.trace()`, `NoticeGenerator.generate()`)
- FastAPI endpoints use markdown-enabled docstrings that automatically populate the `/docs` Swagger UI

## Function Design

**Size:**
- Single-responsibility focused functions; complex algorithms are decomposed into helper methods (e.g. `_lookup_vasp`, `_build_flowable_tables`)

**Parameters:**
- Default parameters provided for forensic thresholds (`max_hops=15`, `max_nodes=5000`, `timeout_seconds=120`, `stop_at_vasp=True`)
- Optional filters for forensic time-bounding (`start_time`, `end_time`, `from_block`, `to_block`)

**Return Values:**
- Pydantic models for API responses (`TraceResponse`, `TraceResult`)
- Dictionary payloads with standardized keys (`hops`, `hops_count`, `risk_score`, `target_vasp`, `graph`) for frontend consumption

## Module Design

**Exports:**
- Explicit Python package exports via `__init__.py` files across all subdirectories in `backend/`
- React component exports use named exports (`export const CytoscapeGraph = ...`) or default exports for Next.js pages (`export default function TraceDossier() ...`)

---

*Convention analysis: 2026-09-08*
