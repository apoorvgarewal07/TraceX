# Testing Patterns

**Analysis Date:** 2026-09-08

## Test Framework

**Runner:**
- Pytest (>=7.4.3) with `pytest-asyncio` (>=0.21.1) for async event loops
- Config: Default pytest discovery (`pytest.ini` / command line args)

**Assertion Library:**
- Python standard `assert` statements

**Run Commands:**
```bash
# Run all backend unit & integration tests
pytest backend/tests/ -v

# Run a specific test module
pytest backend/tests/test_tracer.py -v

# Run performance & latency benchmarks
python scripts/benchmark.py
```

## Test File Organization

**Location:**
- Backend tests are isolated in `backend/tests/`
- Performance benchmarks in `scripts/benchmark.py`

**Naming:**
- Test files follow `test_<module_name>.py` pattern:
  - `backend/tests/test_crawler.py` -> `test_exchange_crawler.py`
  - `backend/tests/test_integration.py`
  - `backend/tests/test_risk_scorer.py`
  - `backend/tests/test_rpc_client.py`
  - `backend/tests/test_tracer.py`

**Structure:**
```
backend/tests/
├── test_exchange_crawler.py    # Address validation and crawler initialization
├── test_integration.py         # End-to-end API route execution (/health, /trace, /freeze-notice)
├── test_risk_scorer.py         # Isolation Forest prediction and K-Means clustering
├── test_rpc_client.py          # RPC caching, synthetic mock fallback, and speed checks
└── test_tracer.py              # BFS multi-hop traversal bounds and depth limits
```

## Test Structure

**Suite Organization:**
```python
import pytest
import asyncio
from backend.blockchain.tracer import BlockchainTracer
from backend.blockchain.rpc_client import BlockchainClient
from backend.neo4j.client import Neo4jClient

def test_trace_basic():
    async def _test():
        rpc = BlockchainClient(alchemy_key="test_key")
        neo4j = Neo4jClient()
        tracer = BlockchainTracer(rpc, neo4j, max_hops=10, timeout_seconds=10)

        test_wallet = "0x" + "a" * 40
        result = await tracer.trace(test_wallet, "test-trace-1")

        assert result['trace_id'] == 'test-trace-1'
        assert 'hops' in result
        assert isinstance(result['hops'], list)
        assert len(result['hops']) > 0
        tracer.close()
    asyncio.run(_test())
```

**Patterns:**
- Async wrappers: Async test logic defined inside an inner `async def _test()` function executed via `asyncio.run(_test())`
- Auto-use fixtures: Database initialization executed before integration tests

## Mocking

**Framework:**
- Built-in deterministic synthetic mock generators embedded in service adapters (`backend/blockchain/rpc_client.py`)

**Patterns:**
- Testing addresses with distinct prefixes (`0xaaaa...`, `0xbbbb...`, `0xbeef...`) trigger deterministic transaction and transfer graphs without hitting external Alchemy APIs:
  ```python
  h = hashlib.sha256(tx_hash.encode()).hexdigest()
  from_addr = "0x" + h[0:40]
  to_addr = "0x" + h[24:64]
  ```

**What to Mock:**
- Live blockchain RPC network endpoints (Alchemy, QuickNode)
- Live SerpAPI web searches
- Live Neo4j and Redis network sockets during offline/local testing

**What NOT to Mock:**
- ML models (`IsolationForest`, `KMeans`) — test real numerical feature extraction and scoring
- Legal PDF compilation (`ReportLab`) — test actual PDF byte generation and headers
- SQLite database transactions — test real SQLAlchemy schema creation and queries

## Fixtures and Factories

**Test Data:**
```python
@pytest.fixture(autouse=True)
def setup_db():
    init_db()

@pytest.fixture
def client():
    return BlockchainClient(alchemy_key="test_key")
```

**Location:**
- Defined locally within each test module in `backend/tests/`

## Coverage

**Requirements:**
- High critical path coverage for core forensic algorithms (BFS traversal, risk scoring, Section 91 PDF generation)

**View Coverage:**
```bash
pytest --cov=backend backend/tests/
```

## Test Types

**Unit Tests:**
- Test individual component behavior in isolation (address validation in `test_exchange_crawler.py`, feature shape in `test_risk_scorer.py`, cache speed in `test_rpc_client.py`)

**Integration Tests:**
- Test HTTP request/response flows and ASGI app execution via `httpx.AsyncClient` (`backend/tests/test_integration.py`)

**Performance Benchmarks:**
- Validate latency and throughput thresholds against SIH requirements (`scripts/benchmark.py`):
  - 10-Hop BFS Trace: < 10.0s
  - 50-Hop BFS Trace: < 25.0s
  - 100-Hop BFS Trace: < 30.0s
  - Statutory Freeze Notice PDF Generation: < 5.0s

## Common Patterns

**Async Testing:**
```python
def test_async_operation():
    async def _test():
        res = await async_call()
        assert res is not None
    asyncio.run(_test())
```

**Boundary & Limits Testing:**
```python
def test_trace_max_hops_bound():
    async def _test():
        tracer = BlockchainTracer(rpc, neo4j, max_hops=5)
        result = await tracer.trace("0x" + "b" * 40, "test-trace-bounded")
        max_hop_depth = max([h['hop_number'] for h in result['hops']]) if result['hops'] else 0
        assert max_hop_depth <= 5
    asyncio.run(_test())
```

---

*Testing analysis: 2026-09-08*
