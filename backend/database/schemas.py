from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import uuid

Base = declarative_base()

class Complaint(Base):
    __tablename__ = 'complaints'

    id = Column(String, primary_key=True, default=lambda: f"NCRP-{uuid.uuid4().hex[:8].upper()}")
    victim_wallet = Column(String, nullable=False, index=True)
    tx_hashes = Column(JSON, nullable=False, default=list)  # ["0x...", "0x..."]
    status = Column(String, default='pending')  # pending, processing, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    source = Column(String, default='NCRP')  # 'NCRP', 'SAHYOG', 'POLICE_PORTAL'

    traces = relationship("Trace", back_populates="complaint", cascade="all, delete-orphan")


class Trace(Base):
    __tablename__ = 'traces'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String, ForeignKey('complaints.id'), nullable=True)
    source_wallet = Column(String, nullable=False, index=True)
    target_vasp = Column(String, nullable=True)  # Identified exchange/VASP name
    hops_count = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)  # 0.0 to 1.0
    traced_at = Column(DateTime, default=datetime.utcnow)
    hops_data = Column(JSON, nullable=True)  # Full trace graph & metadata

    complaint = relationship("Complaint", back_populates="traces")
    clustering_results = relationship("ClusteringResult", back_populates="trace", cascade="all, delete-orphan")
    freeze_notices = relationship("FreezeNotice", back_populates="trace", cascade="all, delete-orphan")


class WalletLabel(Base):
    __tablename__ = 'wallet_labels'

    id = Column(Integer, primary_key=True, autoincrement=True)
    address = Column(String, unique=True, nullable=False, index=True)
    entity_name = Column(String, nullable=False)  # 'Binance', 'CoinDCX', 'Tornado.Cash', 'Scam Pool'
    entity_type = Column(String, nullable=False, default='UNKNOWN')  # 'EXCHANGE', 'MIXER', 'ATTACKER', 'VICTIM', 'MULE'
    confidence_score = Column(Float, default=0.5)  # 0.0 to 1.0
    source_db = Column(String, default='Internal')  # 'SerpAPI', 'Etherscan', 'ChainAbuse', 'CoinGecko'
    created_at = Column(DateTime, default=datetime.utcnow)


class ClusteringResult(Base):
    __tablename__ = 'clustering_results'

    id = Column(Integer, primary_key=True, autoincrement=True)
    trace_id = Column(String, ForeignKey('traces.id'), nullable=False)
    cluster_id = Column(Integer, nullable=False)
    member_wallets = Column(JSON, nullable=False, default=list)  # ["0x...", "0x..."]
    centroid_features = Column(JSON, nullable=True)

    trace = relationship("Trace", back_populates="clustering_results")


class FreezeNotice(Base):
    __tablename__ = 'freeze_notices'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    trace_id = Column(String, ForeignKey('traces.id'), nullable=False)
    exchange_name = Column(String, nullable=False)
    legal_status = Column(String, default='generated')  # generated, served, acknowledged, frozen
    pdf_path = Column(String, nullable=True)
    pdf_base64 = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)

    trace = relationship("Trace", back_populates="freeze_notices")
