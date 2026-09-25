from typing import List, Dict, Any, Optional
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.copilot.agent import GroundedCopilotAgent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/cases", tags=["Grounded Copilot"])


class ChatMessagePayload(BaseModel):
    message: str = Field(..., description="Investigator prompt or query")
    history: Optional[List[Dict[str, str]]] = Field(
        default=None, description="Previous messages in this session"
    )


class ChatResponse(BaseModel):
    reply: str
    citations: List[str]
    stripped_sentences: int
    fallback_triggered: bool
    tools_called: List[str]


@router.post("/{case_id}/copilot/chat", response_model=ChatResponse)
def copilot_chat(
    case_id: str,
    payload: ChatMessagePayload,
    db: Session = Depends(get_db),
):
    """
    POST /api/v1/cases/{case_id}/copilot/chat
    Executes grounded forensic copilot with deterministic citation validation.
    """
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    agent = GroundedCopilotAgent(db=db)
    result = agent.chat(
        message=payload.message,
        case_id=case_id,
        history=payload.history,
    )

    return ChatResponse(
        reply=result.cleaned_text,
        citations=result.citations,
        stripped_sentences=result.stripped_sentences,
        fallback_triggered=result.fallback_triggered,
        tools_called=["get_trace_summary", "list_findings"],
    )
