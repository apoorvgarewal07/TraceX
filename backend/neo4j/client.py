import logging
import os
from typing import List, Dict, Any, Optional
from collections import defaultdict, deque

logger = logging.getLogger(__name__)

class Neo4jClient:
    def __init__(self, uri: Optional[str] = None, user: str = "neo4j", password: Optional[str] = None):
        self.uri = uri or os.getenv('NEO4J_URI', 'bolt://localhost:7687')
        self.user = user or os.getenv('NEO4J_USER', 'neo4j')
        self.password = password or os.getenv('NEO4J_PASSWORD', 'password')
        self.driver = None
        self._connected = False
        
        # In-memory graph structure as fallback
        self._mem_nodes: Dict[str, Dict[str, Any]] = {}
        self._mem_edges: List[Dict[str, Any]] = []
        self._mem_adj = defaultdict(list)

        self._connect()

    def _connect(self):
        try:
            from neo4j import GraphDatabase
            self.driver = GraphDatabase.driver(
                self.uri,
                auth=(self.user, self.password),
                max_connection_lifetime=30 * 60,
                max_connection_pool_size=50,
                connection_acquisition_timeout=2.0
            )
            self._create_indexes()
            self._connected = True
            logger.info(f"Connected to Neo4j at {self.uri}")
        except Exception as e:
            logger.warning(f"Neo4j connection failed ({self.uri}): {e}. Using in-memory graph fallback.")
            self._connected = False

    def _create_indexes(self):
        if not self._connected or not self.driver:
            return
        try:
            with self.driver.session() as session:
                session.run("""
                    CREATE INDEX wallet_address_index IF NOT EXISTS
                    FOR (w:Wallet) ON (w.address)
                """)
                session.run("""
                    CREATE INDEX transfer_tx_index IF NOT EXISTS
                    FOR (t:TRANSFERS_TO) ON (t.tx_hash)
                """)
                logger.info("Neo4j indexes verified/created")
        except Exception as e:
            logger.warning(f"Failed to create Neo4j indexes: {e}")

    def create_transfer(self, from_addr: str, to_addr: str, tx_hash: str, value: str, chain: str = "ETH", asset: str = "ETH") -> bool:
        from_addr = from_addr.lower()
        to_addr = to_addr.lower()

        # Always record in memory cache
        edge_data = {
            'from': from_addr,
            'to': to_addr,
            'tx_hash': tx_hash,
            'amount': str(value),
            'chain': chain,
            'asset': asset
        }
        self._mem_nodes[from_addr] = {'address': from_addr}
        self._mem_nodes[to_addr] = {'address': to_addr}
        self._mem_edges.append(edge_data)
        self._mem_adj[from_addr].append(edge_data)

        if not self._connected or not self.driver:
            return True

        cypher = """
        MERGE (from:Wallet {address: $from_addr})
        ON CREATE SET from.created_at = timestamp()
        
        MERGE (to:Wallet {address: $to_addr})
        ON CREATE SET to.created_at = timestamp()
        
        MERGE (from)-[t:TRANSFERS_TO {tx_hash: $tx_hash}]->(to)
        ON CREATE SET 
            t.amount = $value,
            t.chain = $chain,
            t.asset = $asset,
            t.timestamp = timestamp()
        """
        try:
            with self.driver.session() as session:
                session.run(cypher, {
                    'from_addr': from_addr,
                    'to_addr': to_addr,
                    'tx_hash': tx_hash,
                    'value': str(value),
                    'chain': chain,
                    'asset': asset
                })
            return True
        except Exception as e:
            logger.error(f"Neo4j transfer insertion error: {e}")
            return False

    def batch_create_transfers(self, transfers: List[Dict[str, Any]]) -> int:
        if not transfers:
            return 0

        # Memory store update
        for t in transfers:
            f = t.get('from', '').lower()
            to = t.get('to', '').lower()
            val = str(t.get('value', t.get('amount', '0')))
            tx = t.get('tx_hash', t.get('hash', ''))
            ch = t.get('chain', 'ETH')
            ass = t.get('asset', 'ETH')
            if f and to:
                rec = {'from': f, 'to': to, 'amount': val, 'tx_hash': tx, 'chain': ch, 'asset': ass}
                self._mem_nodes[f] = {'address': f}
                self._mem_nodes[to] = {'address': to}
                self._mem_edges.append(rec)
                self._mem_adj[f].append(rec)

        if not self._connected or not self.driver:
            return len(transfers)

        cypher = """
        UNWIND $transfers AS t
        MERGE (from:Wallet {address: t.from})
        MERGE (to:Wallet {address: t.to})
        MERGE (from)-[edge:TRANSFERS_TO {tx_hash: t.tx_hash}]->(to)
        ON CREATE SET 
            edge.amount = t.amount,
            edge.chain = t.chain,
            edge.asset = t.asset,
            edge.timestamp = timestamp()
        """
        try:
            batch_payload = [
                {
                    'from': t.get('from', '').lower(),
                    'to': t.get('to', '').lower(),
                    'tx_hash': t.get('tx_hash', t.get('hash', '')),
                    'amount': str(t.get('value', t.get('amount', '0'))),
                    'chain': t.get('chain', 'ETH'),
                    'asset': t.get('asset', 'ETH')
                }
                for t in transfers if t.get('from') and t.get('to')
            ]
            with self.driver.session() as session:
                for i in range(0, len(batch_payload), 100):
                    batch = batch_payload[i:i+100]
                    session.run(cypher, {'transfers': batch})
            logger.info(f"Neo4j batch inserted {len(transfers)} transfers")
            return len(transfers)
        except Exception as e:
            logger.error(f"Neo4j batch insertion error: {e}")
            return len(transfers)

    def get_transfer_chain(self, source_address: str, max_depth: int = 10) -> List[List[str]]:
        source_address = source_address.lower()
        if self._connected and self.driver:
            try:
                cypher = f"""
                MATCH p = (start:Wallet {{address: $source}})-[:TRANSFERS_TO*1..{max_depth}]->(end:Wallet)
                RETURN [n in nodes(p) | n.address] as wallet_path
                LIMIT 100
                """
                with self.driver.session() as session:
                    result = session.run(cypher, {'source': source_address})
                    return [record['wallet_path'] for record in result]
            except Exception as e:
                logger.error(f"Neo4j query error: {e}")

        # In-memory BFS path search fallback
        paths = []
        queue = deque([[source_address]])
        while queue and len(paths) < 100:
            path = queue.popleft()
            curr = path[-1]
            if len(path) > max_depth:
                continue
            neighbors = [edge['to'] for edge in self._mem_adj.get(curr, [])]
            if not neighbors:
                if len(path) > 1:
                    paths.append(path)
            else:
                for nxt in neighbors:
                    if nxt not in path:
                        new_path = path + [nxt]
                        paths.append(new_path)
                        queue.append(new_path)
        return paths

    def close(self):
        if self.driver:
            try:
                self.driver.close()
            except Exception:
                pass
