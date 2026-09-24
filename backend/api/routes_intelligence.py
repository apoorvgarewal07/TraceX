# TEMPORARY STUB — replace when Person 1 ships Edge/Finding persistence models. See T6 in execution package.
# WAIT FOR PERSON 1: Edge/Finding persistence model

from typing import List, Dict, Any, Optional
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.database.schemas import Trace
from backend.intelligence.models import Finding
from backend.intelligence.orchestrator import run_intelligence_pipeline
from backend.tests.fixtures.edges_fixture import SAMPLE_TRACE_EDGES

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/intelligence", tags=["Intelligence Engine"])

# In-memory store for recomputed findings until Person 1 implements Finding persistence table
FINDINGS_CACHE: Dict[str, List[Finding]] = {}


def _extract_edges_from_trace(trace: Optional[Trace], trace_id: str) -> List[Dict[str, Any]]:
    """
    Extracts edges from Trace.hops_data if available; falls back to SAMPLE_TRACE_EDGES fixture.
    """
    if trace and trace.hops_data:
        hops_data = trace.hops_data
        if isinstance(hops_data, dict) and "edges" in hops_data:
            return hops_data["edges"]
        if isinstance(hops_data, list):
            return hops_data

    # Fallback to fixture for known fixture trace or when no edges in trace record
    if trace_id == "trace-sample-001" or trace_id.startswith("trace-"):
        return SAMPLE_TRACE_EDGES

    return []


@router.get("/findings/{trace_id}", response_model=List[Finding])
def get_findings(trace_id: str, db: Session = Depends(get_db)):
    """
    Retrieve findings for a trace.
    TEMPORARY STUB: If findings were recomputed in memory, returns those;
    otherwise extracts edges from DB Trace record (or fixture) and runs pipeline.
    """
    if trace_id in FINDINGS_CACHE:
        return FINDINGS_CACHE[trace_id]

    trace = db.query(Trace).filter(Trace.id == trace_id).first()
    edges = _extract_edges_from_trace(trace, trace_id)

    if not edges:
        # If neither DB record nor fixture matches, return empty list
        return []

    findings = run_intelligence_pipeline(
        edges=edges,
        trace_id=trace_id,
        data_mode="CACHED" if trace else "FIXTURE",
    )
    FINDINGS_CACHE[trace_id] = findings
    return findings


@router.post("/recompute/{trace_id}", response_model=List[Finding])
def recompute_findings(trace_id: str, db: Session = Depends(get_db)):
    """
    Recompute intelligence findings over trace edges.
    TEMPORARY STUB: Uses Trace.hops_data or fixture, caches results in memory.
    """
    trace = db.query(Trace).filter(Trace.id == trace_id).first()
    edges = _extract_edges_from_trace(trace, trace_id)

    if not edges:
        raise HTTPException(
            status_code=404,
            detail=f"No trace data or edges found for trace_id '{trace_id}' to recompute."
        )

    findings = run_intelligence_pipeline(
        edges=edges,
        trace_id=trace_id,
        data_mode="LIVE" if trace else "FIXTURE",
    )
    FINDINGS_CACHE[trace_id] = findings
    return findings
