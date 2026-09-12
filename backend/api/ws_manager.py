import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.global_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, trace_id: str = "global"):
        await websocket.accept()
        if trace_id == "global":
            self.global_connections.add(websocket)
            logger.info("WebSocket connected to global notifications")
        else:
            if trace_id not in self.active_connections:
                self.active_connections[trace_id] = set()
            self.active_connections[trace_id].add(websocket)
            logger.info(f"WebSocket connected to trace stream: {trace_id}")

    def disconnect(self, websocket: WebSocket, trace_id: str = "global"):
        if trace_id == "global":
            self.global_connections.discard(websocket)
            logger.info("WebSocket disconnected from global notifications")
        elif trace_id in self.active_connections:
            self.active_connections[trace_id].discard(websocket)
            logger.info(f"WebSocket disconnected from trace stream: {trace_id}")

    async def broadcast_to_trace(self, trace_id: str, message: dict):
        targets = list(self.active_connections.get(trace_id, set())) + list(self.global_connections)
        logger.info(f"[BROADCAST] Broadcasting event '{message.get('event')}' for trace '{trace_id}' to {len(targets)} client(s)")
        for connection in targets:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Error sending message to client: {e}")

manager = ConnectionManager()
