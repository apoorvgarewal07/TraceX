# Codebase Concerns

**Analysis Date:** 2026-09-08

## Tech Debt

**Dual Frontend Implementations (`frontend/` vs `new-ui/`):**
- Issue: Two separate frontend applications exist in the repository with differing stacks (Next.js 14 Pages router in `frontend/` vs Vite 6 + React 19 in `new-ui/`). `frontend/` is wired to the live FastAPI backend and WebSocket streams, whereas `new-ui/` is an AI Studio export using mock cases and `@google/genai`.
- Files: `frontend/`, `new-ui/`, `tracex-—-blockchain-forensics-dossier.zip`
- Impact: Code duplication, split maintenance effort, confusion regarding the canonical deployment target.
- Fix approach: Unify into a single Next.js 14 frontend application by importing the polished styling and Gemini dossier summaries from `new-ui/` into `frontend/`, and retire the standalone `new-ui/` folder and zip bundle.

**Synchronous DB Session in Background Tasks:**
- Issue: In `backend/api/routes.py`, `run_trace_task` is an `async` function, but it creates and commits a synchronous SQLAlchemy session (`db = next(get_db())`) inside the event loop without offloading to a threadpool.
- Files: `backend/api/routes.py:78-109`
- Impact: Potential event loop blocking under high database latency or concurrent trace execution.
- Fix approach: Migrate to SQLAlchemy 2.0 async sessions (`AsyncSession`, `create_async_engine`) or wrap synchronous DB transactions with `asyncio.to_thread()`.

## Known Bugs

**Celery Worker Integration Disconnect:**
- Symptoms: `backend/main.py` defaults to FastAPI `BackgroundTasks` for tracing (`background_tasks.add_task(run_trace_task)`) rather than queuing tasks via Celery (`trace_blockchain.delay(...)`), leaving Celery container idle unless invoked manually.
- Files: `backend/api/routes.py:164`, `backend/tasks/celery_tasks.py:25`
- Trigger: Running with `docker-compose up` launches a `celery-worker` service that receives no tasks from the API router.
- Workaround: FastAPI background tasks handle tracing locally within the API container.
- Fix approach: Add a configuration toggle (`USE_CELERY=true/false`) in `backend/api/routes.py` to route heavy traces to Celery when Redis/Celery is available.

## Security Considerations

**Unauthenticated API and WebSocket Endpoints:**
- Risk: All API routes (`/api/v1/trace`, `/api/v1/freeze-notice`, `/ws/notifications`) have no authentication, authorization, or rate limiting configured.
- Files: `backend/main.py:30-37`, `backend/api/routes.py`
- Current mitigation: Permissive CORS `allow_origins=["*"]` configured for hackathon demo convenience.
- Recommendations: Implement JWT or session-based authentication with role-based access control (RBAC) specifically restricting Section 91 CrPC legal notice generation to authorized police credentials.

**Committed SQLite Database:**
- Risk: `cryptofraud.db` is tracked and committed in git root, containing pre-seeded investigative cases and wallet labels.
- Files: `cryptofraud.db`
- Current mitigation: Data contains mock/simulated demo cases.
- Recommendations: Add `*.db` to `.gitignore` and generate demo cases dynamically during test setup or container bootstrapping via `scripts/seed_demo_scenarios.py`.

## Performance Bottlenecks

**Sequential BFS Node Traversal:**
- Problem: In `backend/blockchain/tracer.py`, transaction lookups for visited nodes in the BFS queue are executed sequentially rather than in concurrent batches.
- Files: `backend/blockchain/tracer.py:85-120`
- Cause: Calling `await self.rpc.get_transfers()` one wallet at a time within the `while queue` loop.
- Improvement path: Group queue elements per hop depth and use `asyncio.gather(*[self.rpc.get_transfers(addr) for addr in current_hop_wallets])` to query transfers in parallel.

## Fragile Areas

**ReportLab PDF Layout on Long Hops:**
- Files: `backend/legal/notice_generator.py:160-220`
- Why fragile: If a trace contains 50 to 100 hops, embedding every single hop in the legal notice table can cause table overflow or page flowable calculation errors in ReportLab.
- Safe modification: Truncate or paginate the transaction table in the PDF notice to display the first 5 hops and terminal 5 hops, with an appendix for intermediate hops.
- Test coverage: Benchmarks currently verify PDF generation for a 12-hop case, but lack 100-hop stress tests.

## Scaling Limits

**In-Memory Graph Fallback:**
- Current capacity: Approximately 5,000 to 10,000 nodes in Python memory before memory pressure degrades performance.
- Limit: Memory exhaustion if multi-hop traversal visits high-degree nodes without Neo4j running.
- Scaling path: Ensure production environment runs dedicated Neo4j Community or Enterprise cluster with indexed constraints.

## Dependencies at Risk

**psycopg2-binary vs Win32:**
- Risk: `backend/requirements.txt` specifies `psycopg2-binary>=2.9.9; sys_platform != 'win32'`. On Windows without Docker, PostgreSQL connections require manual driver installation or reliance on SQLite fallback.
- Impact: Windows developers without Docker cannot test against local PostgreSQL without installing alternative drivers.
- Migration plan: Standardize on `asyncpg` for asynchronous PostgreSQL connectivity across all platforms.

## Missing Critical Features

**Multi-Chain Traversal Expansion:**
- Problem: While TRON (TRC-20), Bitcoin, and Solana are referenced in UI mockups (`new-ui/src/App.tsx`), `backend/blockchain/rpc_client.py` currently only connects to EVM chains (Ethereum Mainnet and Polygon).
- Blocks: Tracing fraud across non-EVM chains (e.g. USDT on TRON, which is heavily used in Asian P2P crypto scams).

## Test Coverage Gaps

**Frontend Test Suite:**
- What's not tested: Zero unit or end-to-end tests exist for Next.js (`frontend/`) or Vite (`new-ui/`).
- Files: `frontend/pages/`, `frontend/components/CytoscapeGraph.tsx`
- Risk: Regressions in graph rendering, node clicking, or WebSocket event handling can slip through unnoticed.

---

*Concerns analysis: 2026-09-08*
