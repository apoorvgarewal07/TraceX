import os
import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.database.schemas import Complaint, Trace, WalletLabel, ClusteringResult, FreezeNotice
from backend.database import crud
from backend.blockchain.models import (
    TraceRequest, TraceResponse, TraceResult, FreezeNoticeRequest
)
from backend.blockchain.tracer import BlockchainTracer
from backend.blockchain.rpc_client import BlockchainClient
from backend.neo4j.client import Neo4jClient
from backend.ml.clustering import WalletClusterer
from backend.legal.notice_generator import NoticeGenerator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["Forensics API"])

# Singletons
rpc = BlockchainClient()
neo4j = Neo4jClient()
tracer = BlockchainTracer(rpc, neo4j)
clusterer = WalletClusterer()
notice_gen = NoticeGenerator()

# In-memory progress tracking for real-time WebSocket / polling
TRACE_PROGRESS: Dict[str, Dict[str, Any]] = {}

async def run_trace_task(
    trace_id: str,
    victim_wallet: str,
    complaint_id: Optional[str] = None,
    max_hops: Optional[int] = 15,
    max_nodes: Optional[int] = 5000,
    stop_at_vasp: Optional[bool] = True,
    chain: str = "ETH",
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    from_block: Optional[str] = None,
    to_block: Optional[str] = None
):
    """Background execution runner for traces."""
    TRACE_PROGRESS[trace_id] = {"status": "processing", "progress": 10, "hops": []}
    try:
        res = await tracer.trace(
            source_wallet=victim_wallet,
            trace_id=trace_id,
            max_hops=max_hops,
            max_nodes=max_nodes,
            stop_at_vasp=stop_at_vasp,
            chain=chain,
            start_time=start_time,
            end_time=end_time,
            from_block=from_block,
            to_block=to_block
        )
        
        # Save to database
        db = next(get_db())
        try:
            trace_rec = db.query(Trace).filter_by(id=trace_id).first()
            if not trace_rec:
                trace_rec = Trace(
                    id=trace_id,
                    complaint_id=complaint_id,
                    source_wallet=victim_wallet
                )
                db.add(trace_rec)

            trace_rec.hops_count = res.get('hops_count', len(res.get('hops', [])))
            trace_rec.risk_score = res.get('risk_score', 0.0)
            trace_rec.target_vasp = res.get('target_vasp')
            trace_rec.hops_data = res
            db.commit()

            # Run clustering automatically
            hops = res.get('hops', [])
            all_wallets = list(set([h['from'] for h in hops] + [h['to'] for h in hops]))
            clustering_out = clusterer.cluster_wallets([{'address': w} for w in all_wallets])
            for cid, members in clustering_out.get('clusters', {}).items():
                db.add(ClusteringResult(
                    trace_id=trace_id,
                    cluster_id=int(cid),
                    member_wallets=members,
                    centroid_features=clustering_out.get('centroids', {}).get(int(cid))
                ))
            db.commit()

        finally:
            db.close()

        TRACE_PROGRESS[trace_id] = {
            "status": "completed",
            "progress": 100,
            "hops": res.get('hops', []),
            "result": res
        }
    except Exception as e:
        logger.error(f"Error in background trace {trace_id}: {e}")
        TRACE_PROGRESS[trace_id] = {"status": "failed", "error": str(e), "progress": 0}


@router.post("/trace", response_model=TraceResponse)
async def start_trace(request: TraceRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Start a blockchain forensics trace from a victim wallet address.
    """
    victim_wallet = request.victim_wallet.strip().lower()
    if not victim_wallet.startswith("0x") or len(victim_wallet) != 42:
        raise HTTPException(status_code=400, detail="Invalid Ethereum/Polygon wallet address format (0x followed by 40 hex chars).")

    trace_id = str(uuid.uuid4())
    complaint_id = request.complaint_id or f"NCRP-{uuid.uuid4().hex[:8].upper()}"

    # Register complaint in DB
    existing_complaint = db.query(Complaint).filter_by(id=complaint_id).first()
    if not existing_complaint:
        crud.create_complaint(db, victim_wallet, request.tx_hashes, source="NCRP", complaint_id=complaint_id)

    # Initial trace record
    crud.create_trace(
        db=db,
        source_wallet=victim_wallet,
        complaint_id=complaint_id,
        trace_id=trace_id,
        hops_count=0,
        risk_score=0.0
    )

    # Launch background trace with MVP parameters
    background_tasks.add_task(
        run_trace_task,
        trace_id=trace_id,
        victim_wallet=victim_wallet,
        complaint_id=complaint_id,
        max_hops=request.max_hops,
        max_nodes=request.max_nodes,
        stop_at_vasp=request.stop_at_vasp,
        chain=request.chain or "ETH",
        start_time=request.start_time,
        end_time=request.end_time,
        from_block=request.from_block,
        to_block=request.to_block
    )

    return TraceResponse(trace_id=trace_id, status="processing", message="Forensics investigation initiated.")


@router.get("/trace/{trace_id}")
async def get_trace_result(trace_id: str, db: Session = Depends(get_db)):
    """
    Get full multi-hop results, risk scores, and identified VASP cashout endpoints for a trace.
    """
    trace = db.query(Trace).filter_by(id=trace_id).first()
    if not trace:
        # Check in-memory progress
        if trace_id in TRACE_PROGRESS:
            return {
                "trace_id": trace_id,
                "status": TRACE_PROGRESS[trace_id]["status"],
                "hops": TRACE_PROGRESS[trace_id].get("hops", []),
                "hops_count": len(TRACE_PROGRESS[trace_id].get("hops", [])),
                "risk_score": 0.5,
                "target_vasp": None
            }
        raise HTTPException(status_code=404, detail="Trace ID not found")

    hops_data = trace.hops_data or {}
    hops_list = hops_data.get('hops', [])
    
    # Format graph nodes and edges for Cytoscape.js
    graph_data = hops_data.get('graph', {
        'nodes': [{'data': {'id': trace.source_wallet, 'label': f"Victim ({trace.source_wallet[:6]}...)", 'type': 'victim', 'riskScore': 0.1}}],
        'edges': []
    })

    return {
        "id": trace.id,
        "trace_id": trace.id,
        "complaint_id": trace.complaint_id,
        "source_wallet": trace.source_wallet,
        "hops_count": trace.hops_count or len(hops_list),
        "risk_score": trace.risk_score,
        "target_vasp": trace.target_vasp,
        "status": "completed" if (trace.hops_count and trace.hops_count > 0) else "processing",
        "hops": hops_list,
        "identified_exchanges": hops_data.get('identified_exchanges', []),
        "risk_scores": hops_data.get('risk_scores', {}),
        "graph": graph_data,
        "traced_at": trace.traced_at.isoformat() if trace.traced_at else datetime.utcnow().isoformat()
    }


@router.get("/traces")
async def list_recent_traces(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    List all recorded traces and their forensic attribution status.
    """
    traces = db.query(Trace).order_by(Trace.traced_at.desc()).offset(skip).limit(limit).all()
    results = []
    for t in traces:
        results.append({
            "id": t.id,
            "source_wallet": t.source_wallet,
            "complaint_id": t.complaint_id,
            "status": "completed" if t.hops_count > 0 else "processing",
            "hops_count": t.hops_count,
            "risk_score": t.risk_score,
            "target_vasp": t.target_vasp or "-",
            "created_at": t.traced_at.isoformat() if t.traced_at else datetime.utcnow().isoformat()
        })
    return results


@router.get("/graph/{trace_id}")
async def get_cytoscape_graph(trace_id: str, db: Session = Depends(get_db)):
    """
    Get Cytoscape.js graph nodes and edges for visual rendering.
    """
    trace = db.query(Trace).filter_by(id=trace_id).first()
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")

    hops_data = trace.hops_data or {}
    if 'graph' in hops_data:
        return hops_data['graph']

    # Fallback construct
    return {
        "nodes": [
            {"data": {"id": trace.source_wallet, "label": f"Victim ({trace.source_wallet[:6]}...)", "type": "victim", "riskScore": 0.1}}
        ],
        "edges": []
    }


@router.post("/cluster/{trace_id}")
async def cluster_trace_wallets(trace_id: str, db: Session = Depends(get_db)):
    """
    Run K-Means clustering algorithm on wallets involved in the trace.
    """
    trace = db.query(Trace).filter_by(id=trace_id).first()
    if not trace or not trace.hops_data:
        raise HTTPException(status_code=404, detail="Trace or hops data not found")

    hops = trace.hops_data.get('hops', [])
    wallet_list = list(set([h['from'] for h in hops] + [h['to'] for h in hops]))
    clustering_res = clusterer.cluster_wallets([{'address': w} for w in wallet_list])

    return {"trace_id": trace_id, "clustering": clustering_res}


@router.post("/freeze-notice")
async def generate_freeze_notice_endpoint(request: FreezeNoticeRequest, db: Session = Depends(get_db)):
    """
    Generate and return a court-admissible PDF Freeze Notice under Section 91 CrPC.
    """
    trace = db.query(Trace).filter_by(id=request.trace_id).first()
    if not trace:
        raise HTTPException(status_code=404, detail="Trace record not found")

    pdf_bytes = notice_gen.generate(
        trace=trace,
        exchange_name=request.exchange_name,
        investigator_name=request.investigator_name or "Cyber Forensic Officer, I4C"
    )

    # Record in database
    crud.create_freeze_notice(
        db=db,
        trace_id=request.trace_id,
        exchange_name=request.exchange_name,
        legal_status="generated"
    )

    filename = f"freeze_notice_{request.exchange_name.replace(' ', '_')}_{request.trace_id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.get("/labels")
async def get_wallet_labels(db: Session = Depends(get_db)):
    """
    List known exchange and mixer wallet labels.
    """
    labels = db.query(WalletLabel).limit(200).all()
    return [
        {
            "address": l.address,
            "name": l.entity_name,
            "type": l.entity_type,
            "confidence": l.confidence_score,
            "source": l.source_db
        }
        for l in labels
    ]
