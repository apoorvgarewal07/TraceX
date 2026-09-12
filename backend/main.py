import os
import logging
from datetime import datetime
import json
import asyncio
from typing import Dict, List, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.database.db import init_db
from backend.scraper.exchange_crawler import ExchangeCrawler
from backend.api.routes import router as api_router

# Logging Configuration
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("cryptofraud-api")

app = FastAPI(
    title="CryptoFraud Trace API",
    description="Real-Time Cryptocurrency Fraud Attribution & Blockchain Forensics for Indian Law Enforcement (I4C / MHA)",
    version="1.0.0"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router)

from backend.api.ws_manager import manager

@app.on_event("startup")
async def on_startup():
    logger.info("Initializing CryptoFraud Trace databases and models...")
    init_db()
    # Seed initial known exchange labels
    try:
        crawler = ExchangeCrawler()
        crawler.seed_wallet_labels()
    except Exception as e:
        logger.warning(f"Label auto-seeding: {e}")

@app.get("/api/health")
async def health_check():
    """Service health and uptime endpoint."""
    return {
        "status": "ok",
        "service": "CryptoFraud Trace API",
        "version": "1.0.0",
        "environment": os.getenv("ENV", "development"),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    await manager.connect(websocket, "global")
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                sub_trace_id = payload.get("subscribe")
                if sub_trace_id:
                    manager.disconnect(websocket, "global")
                    await manager.connect(websocket, sub_trace_id)
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, "global")

@app.websocket("/ws/trace/{trace_id}")
async def websocket_trace(websocket: WebSocket, trace_id: str):
    await manager.connect(websocket, trace_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, trace_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
