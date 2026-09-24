"""
Finding data model matching Blueprint Section 4.
All findings emitted by R1-R8 conform strictly to this schema.
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone

SeverityLevel = Literal["high", "medium", "low"]

class Finding(BaseModel):
    finding_id: str
    rule: str
    trace_id: str
    severity: SeverityLevel
    evidence_edge_ids: List[str] = Field(default_factory=list)
    evidence_ids: List[str] = Field(default_factory=list)
    explanation: str
    computed_at: str
    data_mode: str = "LIVE"

    def to_dict(self) -> dict:
        return self.model_dump()
