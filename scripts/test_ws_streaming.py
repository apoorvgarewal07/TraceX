import asyncio
import json
import logging
import sys
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.main import app
import uvicorn
import httpx
import websockets
import uuid

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ws_test")

TEST_ADDRESS = "0xebc29148c3363ba6738b576f571650c8223c30bc" # Euler finance exploiter (real on-chain target)

async def run_server(server: uvicorn.Server):
    await server.serve()

async def main():
    # 1. Start uvicorn server in background
    config = uvicorn.Config(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info"
    )
    server = uvicorn.Server(config)
    server_task = asyncio.create_task(run_server(server))

    # Wait for server to start
    for _ in range(30):
        if server.started:
            break
        await asyncio.sleep(0.5)

    logger.info("Server started on http://127.0.0.1:8000")

    trace_id = None
    received_events = []

    # 2. Trigger trace via HTTP POST
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000", timeout=15.0) as client:
        resp = await client.post("/api/v1/trace", json={
            "victim_wallet": TEST_ADDRESS,
            "complaint_id": f"TEST-{uuid.uuid4().hex[:6]}",
            "chain": "ETH",
            "max_hops": 3,
            "max_nodes": 50,
            "stop_at_vasp": True
        })
        logger.info(f"Trace initiation HTTP response: {resp.status_code} - {resp.json()}")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        trace_id = resp.json()["trace_id"]

    # 3. Connect to WebSocket stream for this trace
    ws_url = f"ws://127.0.0.1:8000/ws/trace/{trace_id}"
    logger.info(f"Connecting to WebSocket at {ws_url}...")
    
    async with websockets.connect(ws_url) as ws:
        logger.info("WebSocket connected successfully! Listening for streamed events...")
        
        timeout_seconds = 45
        start_time = asyncio.get_event_loop().time()
        
        while True:
            elapsed = asyncio.get_event_loop().time() - start_time
            if elapsed > timeout_seconds:
                logger.warning("Timeout waiting for trace completion")
                break

            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
                data = json.loads(msg)
                event_type = data.get("event")
                received_events.append(data)
                
                if event_type == "HOP_DISCOVERED":
                    hop = data.get("hop", {})
                    logger.info(
                        f"[REAL-TIME WS HOP] Hop #{hop.get('hop_number')}: "
                        f"{hop.get('from')} -> {hop.get('to')} "
                        f"({hop.get('value')} {hop.get('asset')}) Tx: {hop.get('tx_hash')}"
                    )
                elif event_type == "TRACE_COMPLETED":
                    logger.info(
                        f"[REAL-TIME WS COMPLETE] Trace {trace_id} finished! "
                        f"Total hops: {data.get('hops_count')}, Risk: {data.get('risk_score')}, "
                        f"Target VASP: {data.get('target_vasp')}"
                    )
                    break
                elif event_type == "TRACE_FAILED":
                    logger.error(f"[REAL-TIME WS FAILED] Trace failed: {data.get('error')}")
                    break
                else:
                    logger.info(f"[WS EVENT] {data}")
            except asyncio.TimeoutError:
                # Check if trace finished in backend DB
                async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
                    check_resp = await client.get(f"/api/v1/trace/{trace_id}")
                    if check_resp.status_code == 200 and check_resp.json().get("status") == "completed":
                        logger.info("Backend finished trace in DB")
                        break

    # 4. Stop server
    server.should_exit = True
    await server_task

    logger.info("=" * 60)
    logger.info(f"TEST SUMMARY: Received {len(received_events)} WebSocket event(s)")
    hop_events = [e for e in received_events if e.get("event") == "HOP_DISCOVERED"]
    complete_events = [e for e in received_events if e.get("event") == "TRACE_COMPLETED"]
    logger.info(f"Hop Events: {len(hop_events)}")
    logger.info(f"Completion Events: {len(complete_events)}")
    logger.info("=" * 60)

    assert len(hop_events) > 0, "No HOP_DISCOVERED events were broadcast over WebSocket!"
    logger.info("SUCCESS: Real-time WebSocket streaming verified in isolation!")

if __name__ == "__main__":
    asyncio.run(main())
