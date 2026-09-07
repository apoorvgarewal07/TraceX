import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.database.db import init_db

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def test_health_endpoint():
    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.get("/api/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert "version" in data
    asyncio.run(_test())

def test_trace_creation_and_retrieval():
    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            payload = {
                "victim_wallet": "0x" + "c" * 40,
                "tx_hashes": ["0x" + "1" * 64],
                "complaint_id": "NCRP-TEST-001",
                "max_hops": 3,
                "max_nodes": 20
            }
            response = await ac.post("/api/v1/trace", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert "trace_id" in data
            assert data["status"] == "processing"
            
            trace_id = data["trace_id"]
            get_res = await ac.get(f"/api/v1/trace/{trace_id}")
            assert get_res.status_code == 200
            trace_data = get_res.json()
            assert trace_data["source_wallet"] == payload["victim_wallet"].lower()
    asyncio.run(_test())

def test_freeze_notice_generation():
    async def _test():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            payload = {
                "victim_wallet": "0x" + "d" * 40,
                "complaint_id": "NCRP-FRZ-001",
                "max_hops": 3,
                "max_nodes": 20
            }
            init_res = await ac.post("/api/v1/trace", json=payload)
            trace_id = init_res.json()["trace_id"]

            notice_payload = {
                "trace_id": trace_id,
                "exchange_name": "Binance",
                "confidence_level": "HIGH",
                "investigator_name": "Inspector Cyber Crime (I4C)"
            }
            pdf_res = await ac.post("/api/v1/freeze-notice", json=notice_payload)
            assert pdf_res.status_code == 200
            assert pdf_res.headers["content-type"] == "application/pdf"
            assert len(pdf_res.content) > 1000
    asyncio.run(_test())
