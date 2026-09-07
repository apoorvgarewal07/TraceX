from sqlalchemy.orm import Session
from backend.database.schemas import Complaint, Trace, WalletLabel, ClusteringResult, FreezeNotice
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

# --- Complaints ---
def create_complaint(db: Session, victim_wallet: str, tx_hashes: List[str], source: str = "NCRP", complaint_id: Optional[str] = None) -> Complaint:
    cid = complaint_id or f"NCRP-{uuid.uuid4().hex[:8].upper()}"
    complaint = Complaint(
        id=cid,
        victim_wallet=victim_wallet,
        tx_hashes=tx_hashes,
        status="pending",
        source=source,
        created_at=datetime.utcnow()
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint

def get_complaint(db: Session, complaint_id: str) -> Optional[Complaint]:
    return db.query(Complaint).filter(Complaint.id == complaint_id).first()

def get_complaints(db: Session, limit: int = 100) -> List[Complaint]:
    return db.query(Complaint).order_by(Complaint.created_at.desc()).limit(limit).all()

# --- Traces ---
def create_trace(
    db: Session,
    source_wallet: str,
    complaint_id: Optional[str] = None,
    trace_id: Optional[str] = None,
    target_vasp: Optional[str] = None,
    hops_count: int = 0,
    risk_score: float = 0.0,
    hops_data: Optional[Dict[str, Any]] = None
) -> Trace:
    tid = trace_id or str(uuid.uuid4())
    trace = Trace(
        id=tid,
        complaint_id=complaint_id,
        source_wallet=source_wallet,
        target_vasp=target_vasp,
        hops_count=hops_count,
        risk_score=risk_score,
        hops_data=hops_data,
        traced_at=datetime.utcnow()
    )
    db.add(trace)
    db.commit()
    db.refresh(trace)
    return trace

def get_trace(db: Session, trace_id: str) -> Optional[Trace]:
    return db.query(Trace).filter(Trace.id == trace_id).first()

def get_traces(db: Session, skip: int = 0, limit: int = 50) -> List[Trace]:
    return db.query(Trace).order_by(Trace.traced_at.desc()).offset(skip).limit(limit).all()

def update_trace(
    db: Session,
    trace_id: str,
    target_vasp: Optional[str] = None,
    hops_count: Optional[int] = None,
    risk_score: Optional[float] = None,
    hops_data: Optional[Dict[str, Any]] = None
) -> Optional[Trace]:
    trace = get_trace(db, trace_id)
    if not trace:
        return None
    if target_vasp is not None:
        trace.target_vasp = target_vasp
    if hops_count is not None:
        trace.hops_count = hops_count
    if risk_score is not None:
        trace.risk_score = risk_score
    if hops_data is not None:
        trace.hops_data = hops_data
    db.commit()
    db.refresh(trace)
    return trace

# --- Wallet Labels ---
def upsert_wallet_label(
    db: Session,
    address: str,
    entity_name: str,
    entity_type: str,
    confidence_score: float = 0.85,
    source_db: str = "Internal"
) -> WalletLabel:
    normalized_addr = address.lower()
    label = db.query(WalletLabel).filter(WalletLabel.address == normalized_addr).first()
    if label:
        label.entity_name = entity_name
        label.entity_type = entity_type
        label.confidence_score = confidence_score
        label.source_db = source_db
    else:
        label = WalletLabel(
            address=normalized_addr,
            entity_name=entity_name,
            entity_type=entity_type,
            confidence_score=confidence_score,
            source_db=source_db
        )
        db.add(label)
    db.commit()
    db.refresh(label)
    return label

def get_wallet_label(db: Session, address: str) -> Optional[WalletLabel]:
    return db.query(WalletLabel).filter(WalletLabel.address == address.lower()).first()

def get_all_wallet_labels(db: Session, limit: int = 1000) -> List[WalletLabel]:
    return db.query(WalletLabel).limit(limit).all()

# --- Clustering Results ---
def create_clustering_result(
    db: Session,
    trace_id: str,
    cluster_id: int,
    member_wallets: List[str],
    centroid_features: Optional[Dict[str, Any]] = None
) -> ClusteringResult:
    result = ClusteringResult(
        trace_id=trace_id,
        cluster_id=cluster_id,
        member_wallets=member_wallets,
        centroid_features=centroid_features
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result

# --- Freeze Notices ---
def create_freeze_notice(
    db: Session,
    trace_id: str,
    exchange_name: str,
    pdf_path: Optional[str] = None,
    pdf_base64: Optional[str] = None,
    legal_status: str = "generated"
) -> FreezeNotice:
    notice = FreezeNotice(
        id=str(uuid.uuid4()),
        trace_id=trace_id,
        exchange_name=exchange_name,
        pdf_path=pdf_path,
        pdf_base64=pdf_base64,
        legal_status=legal_status,
        generated_at=datetime.utcnow()
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return notice

def get_freeze_notice(db: Session, notice_id: str) -> Optional[FreezeNotice]:
    return db.query(FreezeNotice).filter(FreezeNotice.id == notice_id).first()

def get_freeze_notices_for_trace(db: Session, trace_id: str) -> List[FreezeNotice]:
    return db.query(FreezeNotice).filter(FreezeNotice.trace_id == trace_id).all()
