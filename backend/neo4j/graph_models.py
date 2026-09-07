from typing import Optional, Dict, Any

class WalletNode:
    """
    Representation of a wallet node in the Neo4j graph.
    MATCH (w:Wallet {address: '0x...'})
    RETURN w
    """
    def __init__(
        self,
        address: str,
        balance: float = 0.0,
        entity_type: str = 'unknown',
        label: str = '',
        risk_score: float = 0.0
    ):
        self.address = address.lower()
        self.balance = balance
        self.entity_type = entity_type  # 'victim', 'attacker', 'exchange', 'mixer', 'mule'
        self.label = label
        self.risk_score = risk_score

    def to_dict(self) -> Dict[str, Any]:
        return {
            "address": self.address,
            "balance": self.balance,
            "entity_type": self.entity_type,
            "label": self.label,
            "risk_score": self.risk_score
        }


class TransferEdge:
    """
    Representation of a fund transfer relationship in Neo4j.
    MATCH (from:Wallet)-[t:TRANSFERS_TO]->(to:Wallet)
    RETURN t
    """
    def __init__(
        self,
        from_addr: str,
        to_addr: str,
        amount: str,
        tx_hash: str,
        timestamp: Optional[int] = None,
        chain: str = 'ETH',
        asset: str = 'ETH'
    ):
        self.from_addr = from_addr.lower()
        self.to_addr = to_addr.lower()
        self.amount = amount
        self.tx_hash = tx_hash
        self.timestamp = timestamp
        self.chain = chain  # 'ETH', 'POLYGON', 'TRON', 'BSC'
        self.asset = asset

    def to_dict(self) -> Dict[str, Any]:
        return {
            "from": self.from_addr,
            "to": self.to_addr,
            "amount": self.amount,
            "tx_hash": self.tx_hash,
            "timestamp": self.timestamp,
            "chain": self.chain,
            "asset": self.asset
        }
