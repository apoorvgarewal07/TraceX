import asyncio
import logging
import time
from collections import deque, defaultdict
from typing import List, Dict, Set, Any, Optional
from datetime import datetime, timezone
import os

from backend.blockchain.rpc_client import BlockchainClient
from backend.neo4j.client import Neo4jClient
from backend.ml.risk_scorer import RiskScorer
from backend.database.db import SessionLocal
from backend.database.schemas import WalletLabel

logger = logging.getLogger(__name__)

class BlockchainTracer:
    def __init__(
        self,
        rpc_client: Optional[BlockchainClient] = None,
        neo4j_client: Optional[Neo4jClient] = None,
        max_hops: int = 15,            # Max BFS hop depth (10-15 hops)
        max_nodes: int = 5000,         # Max graph nodes capacity (1,000-5,000 nodes)
        timeout_seconds: int = 120,    # Traversal timeout (increased for large graphs)
        stop_at_vasp: bool = True      # Stop traversing further once VASP/Exchange is reached
    ):
        self.rpc = rpc_client or BlockchainClient()
        self.neo4j = neo4j_client or Neo4jClient()
        self.max_hops = max_hops
        self.max_nodes = max_nodes
        self.timeout = timeout_seconds
        self.stop_at_vasp = stop_at_vasp
        self.scorer = RiskScorer()
        self._vasp_cache: Dict[str, Optional[Dict[str, Any]]] = {}

    def _lookup_vasp(self, wallet_addr: str) -> Optional[Dict[str, Any]]:
        """Check if an address belongs to a known VASP / CEX / Mixer with in-memory caching."""
        addr = wallet_addr.lower()
        if addr in self._vasp_cache:
            return self._vasp_cache[addr]

        db = SessionLocal()
        try:
            label = db.query(WalletLabel).filter_by(address=addr).first()
            if label:
                info = {
                    'address': addr,
                    'name': label.entity_name,
                    'entity_type': label.entity_type or 'EXCHANGE',
                    'confidence': label.confidence_score or 0.95,
                    'source': label.source_db or 'Database'
                }
                self._vasp_cache[addr] = info
                return info
        except Exception as e:
            logger.debug(f"VASP DB lookup error for {addr}: {e}")
        finally:
            db.close()

        self._vasp_cache[addr] = None
        return None

    async def trace(
        self,
        source_wallet: str,
        trace_id: str,
        max_hops: Optional[int] = None,
        max_nodes: Optional[int] = None,
        stop_at_vasp: Optional[bool] = None,
        chain: str = "ETH",
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        from_block: Optional[str] = None,
        to_block: Optional[str] = None,
        websocket_callback=None
    ) -> Dict[str, Any]:
        """
        BFS multi-hop graph traversal starting from victim source wallet.
        Supports 10-15 hops depth, 1,000-5,000 graph nodes, configurable time window,
        ERC-20/ETH tokens, and terminal VASP detection.
        """
        source_wallet = source_wallet.lower()
        effective_max_hops = max_hops if max_hops is not None else self.max_hops
        effective_max_nodes = max_nodes if max_nodes is not None else self.max_nodes
        effective_stop_at_vasp = stop_at_vasp if stop_at_vasp is not None else self.stop_at_vasp

        logger.info(
            f"Starting BFS trace for {source_wallet} (trace_id={trace_id}, "
            f"max_depth={effective_max_hops}, max_nodes={effective_max_nodes}, stop_at_vasp={effective_stop_at_vasp})"
        )

        t_start = time.time()
        hops: List[Dict[str, Any]] = []
        visited: Set[str] = set()
        queue = deque([(source_wallet, 0)])  # (wallet_addr, hop_depth)
        
        discovered_vasps: Dict[str, Dict[str, Any]] = {}
        wallet_transfers_map: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

        try:
            while queue and len(visited) < effective_max_nodes:
                elapsed = time.time() - t_start
                if elapsed > self.timeout:
                    logger.warning(f"Trace timeout reached after {elapsed:.1f}s with {len(visited)} nodes and {len(hops)} hops")
                    break

                current_wallet, hop_depth = queue.popleft()

                if current_wallet in visited:
                    continue
                if hop_depth > effective_max_hops:
                    continue

                visited.add(current_wallet)

                # Stop at VASP condition
                if effective_stop_at_vasp and current_wallet != source_wallet:
                    vasp_info = self._lookup_vasp(current_wallet)
                    if vasp_info:
                        discovered_vasps[current_wallet] = vasp_info
                        logger.info(f"Identified terminal VASP at hop {hop_depth}: {vasp_info['name']} ({current_wallet})")
                        # Do not expand children beyond terminal VASP cashout point
                        continue

                # Fetch outgoing ETH & ERC-20 transfers
                try:
                    transfers = await self.rpc.get_transfers(
                        current_wallet,
                        chain=chain,
                        from_block=from_block,
                        to_block=to_block,
                        max_results=50,
                        start_time=start_time,
                        end_time=end_time
                    )
                except Exception as e:
                    logger.error(f"Error fetching transfers for {current_wallet}: {e}")
                    continue

                for transfer in transfers:
                    from_addr = transfer.get('from', '').lower()
                    to_addr = transfer.get('to', '').lower()
                    tx_hash = transfer.get('tx_hash', transfer.get('hash', ''))
                    value = str(transfer.get('value', '0'))
                    asset = transfer.get('asset', 'ETH')
                    transfer_chain = transfer.get('chain', chain)
                    ts = transfer.get('timestamp') or datetime.now(timezone.utc).isoformat()

                    if not from_addr or not to_addr or to_addr == from_addr:
                        continue

                    hop_rec = {
                        'hop_number': hop_depth + 1,
                        'from': from_addr,
                        'to': to_addr,
                        'value': value,
                        'tx_hash': tx_hash,
                        'asset': asset,
                        'chain': transfer_chain,
                        'timestamp': ts
                    }
                    hops.append(hop_rec)
                    wallet_transfers_map[from_addr].append(hop_rec)

                    # Check if target is a known VASP
                    to_vasp = self._lookup_vasp(to_addr)
                    if to_vasp:
                        discovered_vasps[to_addr] = to_vasp

                    # Notify WebSocket callback if provided
                    if websocket_callback:
                        try:
                            await websocket_callback({
                                "event": "HOP_DISCOVERED",
                                "trace_id": trace_id,
                                "hop": hop_rec,
                                "progress": min(95, int((len(visited) / max(effective_max_nodes, 100)) * 100))
                            })
                        except Exception:
                            pass

                    # Queue next address if depth permits and not already visited
                    if (
                        to_addr not in visited
                        and (hop_depth + 1) <= effective_max_hops
                        and (len(visited) + len(queue)) < effective_max_nodes
                    ):
                        queue.append((to_addr, hop_depth + 1))

            # Batch persist all edges in Neo4j in background
            if hops:
                await self._batch_add_to_graph(hops)

            # Collect all unique wallets across discovered edges
            all_wallets = list(visited | {h['to'] for h in hops})
            
            # Ensure all VASPs in graph are identified
            exchanges = await self._identify_exchanges(all_wallets, discovered_vasps)
            exchange_map = {ex['address'].lower(): ex for ex in exchanges}

            # Score risks for discovered wallets
            risk_scores = await self._score_wallets(all_wallets, exchange_map, wallet_transfers_map)

            # Build Cytoscape graph payload
            cytoscape_nodes = []
            cytoscape_edges = []

            for w in all_wallets:
                ex_info = exchange_map.get(w)
                if w == source_wallet:
                    node_type = 'victim'
                    label = f"Victim ({w[:6]}...{w[-4:]})"
                elif ex_info:
                    node_type = ex_info.get('entity_type', 'exchange').lower()
                    label = f"{ex_info['name']} ({w[:6]}...{w[-4:]})"
                else:
                    score = risk_scores.get(w, 0.5)
                    node_type = 'attacker' if score > 0.75 else 'mixer' if score > 0.65 else 'mule'
                    label = f"{node_type.upper()} ({w[:6]}...{w[-4:]})"

                cytoscape_nodes.append({
                    "data": {
                        "id": w,
                        "label": label,
                        "type": node_type,
                        "riskScore": risk_scores.get(w, 0.5),
                        "address": w
                    }
                })

            for idx, h in enumerate(hops):
                cytoscape_edges.append({
                    "data": {
                        "id": f"e_{idx}_{h['tx_hash'][:8] if h.get('tx_hash') else idx}",
                        "source": h['from'],
                        "target": h['to'],
                        "label": f"{h['value']} {h['asset']}",
                        "amount": h['value'],
                        "asset": h['asset'],
                        "tx_hash": h['tx_hash'],
                        "timestamp": h.get('timestamp')
                    }
                })

            avg_risk = sum(risk_scores.values()) / max(len(risk_scores), 1) if risk_scores else 0.0
            primary_vasp = exchanges[0]['name'] if exchanges else None

            logger.info(
                f"Trace completed for {source_wallet}: {len(hops)} hops, {len(all_wallets)} nodes, "
                f"{len(exchanges)} VASPs identified"
            )

            return {
                'trace_id': trace_id,
                'source': source_wallet,
                'source_wallet': source_wallet,
                'hops': hops,
                'hops_count': len(hops),
                'nodes_count': len(all_wallets),
                'risk_scores': risk_scores,
                'risk_score': round(float(avg_risk), 2),
                'identified_exchanges': exchanges,
                'target_vasp': primary_vasp,
                'graph': {
                    'nodes': cytoscape_nodes,
                    'edges': cytoscape_edges
                },
                'timestamp': datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            logger.error(f"Trace execution failed: {e}")
            raise

    async def _batch_add_to_graph(self, hops_list: List[Dict[str, Any]]):
        """Asynchronously insert all edges into Neo4j graph in a single batch."""
        try:
            await asyncio.to_thread(self.neo4j.batch_create_transfers, hops_list)
        except Exception as e:
            logger.warning(f"Failed to batch write edges to Neo4j: {e}")

    async def _score_wallets(
        self,
        wallet_list: List[str],
        exchange_map: Dict[str, Any],
        transfers_map: Dict[str, List[Dict[str, Any]]]
    ) -> Dict[str, float]:
        """Score risk of all wallets using ML Isolation Forest model with in-memory graph metrics."""
        scores: Dict[str, float] = {}
        unique_wallets = list(set(wallet_list))

        for wallet in unique_wallets:
            if wallet in exchange_map:
                ent_type = exchange_map[wallet].get('entity_type', '').upper()
                if ent_type == 'MIXER':
                    scores[wallet] = 0.95
                elif ent_type == 'ATTACKER':
                    scores[wallet] = 0.92
                else:
                    scores[wallet] = 0.35  # Exchange deposit endpoint
                continue

            transfers = transfers_map.get(wallet, [])
            tx_count = len(transfers)
            avg_val = sum(float(t.get('value', 0)) for t in transfers) / max(tx_count, 1)
            unique_targets = len(set(t.get('to') for t in transfers))

            try:
                features = {
                    'tx_count': max(tx_count, 1),
                    'avg_value': avg_val if avg_val > 0 else 1.5,
                    'unique_targets': max(unique_targets, 1),
                    'balance': 2.5,
                    'days_active': 14
                }
                scores[wallet] = round(float(self.scorer.predict(features)), 2)
            except Exception:
                scores[wallet] = 0.50

        return scores

    async def _identify_exchanges(
        self,
        wallet_list: List[str],
        known_vasps: Optional[Dict[str, Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """Identify known VASP exchanges and mixers from cache and database."""
        exchanges = []
        seen = set()

        if known_vasps:
            for addr, info in known_vasps.items():
                if addr not in seen:
                    exchanges.append(info)
                    seen.add(addr)

        db = SessionLocal()
        try:
            for wallet in set(wallet_list):
                if wallet in seen:
                    continue
                label = db.query(WalletLabel).filter_by(address=wallet.lower()).first()
                if label:
                    info = {
                        'address': wallet.lower(),
                        'name': label.entity_name,
                        'entity_type': label.entity_type or 'EXCHANGE',
                        'confidence': label.confidence_score or 0.95,
                        'source': label.source_db or 'Database'
                    }
                    exchanges.append(info)
                    seen.add(wallet)
            return exchanges
        finally:
            db.close()

    def close(self):
        self.neo4j.close()
