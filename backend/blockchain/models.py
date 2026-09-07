from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class TransactionDetail(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    hash: str
    from_address: str = Field(..., alias="from")
    to_address: Optional[str] = Field(None, alias="to")
    value: str = "0"
    gas_used: Optional[str] = "21000"
    block_number: Optional[int] = 0
    timestamp: Optional[str] = None
    asset: Optional[str] = "ETH"
    chain: Optional[str] = "ETH"


class HopRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    hop_number: int
    from_address: str = Field(..., alias="from")
    to_address: str = Field(..., alias="to")
    value: str
    tx_hash: str
    asset: str = "ETH"
    chain: str = "ETH"
    timestamp: Optional[str] = None


class ExchangeMatch(BaseModel):
    address: str
    name: str
    confidence: float
    source: str = "Internal"
    entity_type: str = "EXCHANGE"


class TraceRequest(BaseModel):
    victim_wallet: str
    tx_hashes: List[str] = []
    complaint_id: Optional[str] = None
    max_hops: Optional[int] = 15
    max_nodes: Optional[int] = 5000
    stop_at_vasp: Optional[bool] = True
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    from_block: Optional[str] = None
    to_block: Optional[str] = None
    chain: Optional[str] = "ETH"


class TraceResponse(BaseModel):
    trace_id: str
    status: str
    message: Optional[str] = "Trace initiated successfully"


class TraceResult(BaseModel):
    trace_id: str
    complaint_id: Optional[str] = None
    source: str
    hops: List[Dict[str, Any]]
    hops_count: int
    risk_scores: Dict[str, float] = {}
    aggregate_risk_score: float = 0.0
    identified_exchanges: List[Dict[str, Any]] = []
    target_vasp: Optional[str] = None
    timestamp: str


class FreezeNoticeRequest(BaseModel):
    trace_id: str
    exchange_name: str
    confidence_level: Optional[str] = "HIGH"
    investigator_name: Optional[str] = "Officer Cyber Cell (I4C)"
    fir_number: Optional[str] = None
