import pytest
import asyncio
import time
from backend.blockchain.rpc_client import BlockchainClient

@pytest.fixture
def client():
    return BlockchainClient(alchemy_key="test_key")

def test_client_initialization(client):
    assert client is not None
    assert client.network == 'ETH_MAINNET'

def test_get_transaction(client):
    async def _test():
        tx_hash = "0x" + "a" * 64
        tx = await client.get_transaction(tx_hash)
        assert tx is not None
        assert "hash" in tx
        assert "from" in tx
        assert "to" in tx
        assert "value" in tx
    asyncio.run(_test())

def test_get_transfers(client):
    async def _test():
        wallet = "0x" + "1" * 40
        transfers = await client.get_transfers(wallet)
        assert isinstance(transfers, list)
        assert len(transfers) >= 1
        assert "from" in transfers[0]
        assert "to" in transfers[0]
        assert "value" in transfers[0]
    asyncio.run(_test())

def test_get_balance(client):
    async def _test():
        wallet = "0x" + "2" * 40
        balance = await client.get_balance(wallet)
        assert balance is not None
        assert float(balance) >= 0.0
    asyncio.run(_test())

def test_cache_hit_speed(client):
    async def _test():
        wallet = "0x" + "3" * 40
        # First call
        t1 = time.time()
        await client.get_transfers(wallet)
        first_duration = time.time() - t1

        # Second call (from cache)
        t2 = time.time()
        cached_res = await client.get_transfers(wallet)
        cache_duration = time.time() - t2

        assert cached_res is not None
        assert cache_duration < 0.10
    asyncio.run(_test())
