import os
import asyncio
import logging
import uuid
from backend.tasks.celery_app import celery_app
from backend.blockchain.tracer import BlockchainTracer
from backend.blockchain.rpc_client import BlockchainClient
from backend.neo4j.client import Neo4jClient
from backend.ml.clustering import WalletClusterer
from backend.ml.risk_scorer import RiskScorer
from backend.legal.notice_generator import NoticeGenerator
from backend.database.db import SessionLocal
from backend.database.schemas import Trace, FreezeNotice, ClusteringResult

logger = logging.getLogger(__name__)

# Initialize singletons for background workers
rpc_client = BlockchainClient()
neo4j_client = Neo4jClient()
tracer = BlockchainTracer(rpc_client, neo4j_client)
clusterer = WalletClusterer()
scorer = RiskScorer()
notice_generator = NoticeGenerator()

@celery_app.task(name='trace_blockchain', bind=True)
def trace_blockchain(self, trace_id: str, victim_wallet: str, tx_hashes: list = None, complaint_id: str = None):
    """
    Main async Celery task:
    1. Traverses blockchain transaction graph via BFS
    2. Stores nodes & relationships in Neo4j
    3. Runs ML Anomaly Scoring & Exchange Attribution
    4. Updates PostgreSQL with results
    """
    try:
        self.update_state(state='PROGRESS', meta={'status': 'Starting blockchain BFS traversal...'})
        logger.info(f"[{trace_id}] Celery trace initiated for {victim_wallet}")

        # Run async tracer inside synchronous Celery worker
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        trace_result = loop.run_until_complete(tracer.trace(victim_wallet, trace_id))
        loop.close()

        self.update_state(state='PROGRESS', meta={'status': f"{len(trace_result.get('hops', []))} hops discovered. Saving results..."})

        db = SessionLocal()
        try:
            trace_record = db.query(Trace).filter_by(id=trace_id).first()
            if not trace_record:
                trace_record = Trace(
                    id=trace_id,
                    complaint_id=complaint_id,
                    source_wallet=victim_wallet
                )
                db.add(trace_record)

            trace_record.hops_count = trace_result.get('hops_count', len(trace_result.get('hops', [])))
            trace_record.risk_score = trace_result.get('risk_score', 0.0)
            trace_record.target_vasp = trace_result.get('target_vasp')
            trace_record.hops_data = trace_result
            db.commit()
        finally:
            db.close()

        self.update_state(state='SUCCESS', meta={'trace_id': trace_id, 'hops': trace_result.get('hops_count', 0)})
        logger.info(f"[{trace_id}] Celery trace completed successfully")
        return {'trace_id': trace_id, 'status': 'completed', 'hops_count': trace_result.get('hops_count', 0)}

    except Exception as e:
        logger.error(f"[{trace_id}] Celery trace failed: {e}")
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise

@celery_app.task(name='cluster_wallets', bind=True)
def cluster_wallets(self, trace_id: str):
    """
    Celery task: Run K-Means ML clustering on wallets in a trace.
    """
    try:
        logger.info(f"[{trace_id}] Starting wallet clustering task")
        db = SessionLocal()
        try:
            trace = db.query(Trace).filter_by(id=trace_id).first()
            if not trace or not trace.hops_data:
                raise ValueError(f"Trace {trace_id} not found or has no hops")

            hops = trace.hops_data.get('hops', [])
            all_wallets = list(set([h['from'] for h in hops] + [h['to'] for h in hops]))
            clustering_out = clusterer.cluster_wallets([{'address': w} for w in all_wallets])

            # Persist results
            for cid, members in clustering_out.get('clusters', {}).items():
                db.add(ClusteringResult(
                    trace_id=trace_id,
                    cluster_id=int(cid),
                    member_wallets=members,
                    centroid_features=clustering_out.get('centroids', {}).get(int(cid))
                ))
            db.commit()
            return {'trace_id': trace_id, 'clusters': clustering_out}
        finally:
            db.close()
    except Exception as e:
        logger.error(f"[{trace_id}] Wallet clustering failed: {e}")
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise

@celery_app.task(name='generate_freeze_notice', bind=True)
def generate_freeze_notice_task(self, trace_id: str, exchange_name: str, investigator: str = "Officer Cyber Cell (I4C)"):
    """
    Celery task: Build statutory freeze PDF and save record.
    """
    try:
        logger.info(f"[{trace_id}] Generating freeze notice PDF for {exchange_name}")
        db = SessionLocal()
        try:
            trace = db.query(Trace).filter_by(id=trace_id).first()
            if not trace:
                raise ValueError(f"Trace {trace_id} not found")

            pdf_bytes = notice_generator.generate(trace, exchange_name, investigator)
            
            output_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'output')
            os.makedirs(output_dir, exist_ok=True)
            pdf_path = os.path.join(output_dir, f"freeze_notice_{trace_id}_{exchange_name.replace(' ', '_')}.pdf")

            with open(pdf_path, 'wb') as f:
                f.write(pdf_bytes)

            import base64
            b64 = base64.b64encode(pdf_bytes).decode('utf-8')

            notice = FreezeNotice(
                id=str(uuid.uuid4()),
                trace_id=trace_id,
                exchange_name=exchange_name,
                pdf_path=pdf_path,
                pdf_base64=b64,
                legal_status='generated'
            )
            db.add(notice)
            db.commit()

            return {'trace_id': trace_id, 'pdf_path': pdf_path, 'notice_id': notice.id}
        finally:
            db.close()
    except Exception as e:
        logger.error(f"[{trace_id}] PDF generation task failed: {e}")
        raise
