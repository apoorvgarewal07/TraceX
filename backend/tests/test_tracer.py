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
        assert 'risk_scores' in result
        assert 'graph' in result
        assert 'nodes' in result['graph']
        assert 'edges' in result['graph']
        assert result['hops_count'] == len(result['hops'])
        tracer.close()
    asyncio.run(_test())

def test_trace_max_hops_bound():
    async def _test():
        rpc = BlockchainClient(alchemy_key="test_key")
        neo4j = Neo4jClient()
        tracer = BlockchainTracer(rpc, neo4j, max_hops=5, timeout_seconds=10)

        test_wallet = "0x" + "b" * 40
        result = await tracer.trace(test_wallet, "test-trace-bounded")

        # Verify max hop depth does not exceed configured max_hops (5)
        max_hop_depth = max([h['hop_number'] for h in result['hops']]) if result['hops'] else 0
        assert max_hop_depth <= 5
        tracer.close()
    asyncio.run(_test())
