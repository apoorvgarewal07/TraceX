import numpy as np
import logging
from typing import List, Dict, Any
from sklearn.cluster import KMeans
from backend.ml.risk_scorer import RiskScorer

logger = logging.getLogger(__name__)

class WalletClusterer:
    """
    Groups wallets based on transaction features and behavioral patterns using K-Means.
    Useful for identifying sybil clusters, money mule rings, and exchange deposit hubs.
    """
    def __init__(self):
        self.scorer = RiskScorer()

    def cluster_wallets(self, wallets: List[Dict[str, Any]], n_clusters: int = 4) -> Dict[str, Any]:
        """
        Group wallets by similarity using K-Means.
        Returns: {
            "clusters": {cluster_id: [wallet_addresses]},
            "centroids": {cluster_id: [feature_values]},
            "summary": {cluster_id: {description: str, count: int}}
        }
        """
        if not wallets:
            return {"clusters": {}, "centroids": {}, "summary": {}}

        actual_k = min(n_clusters, len(wallets))
        if actual_k <= 1:
            addrs = [w.get('address', '') for w in wallets]
            return {
                "clusters": {0: addrs},
                "centroids": {0: [0.0]*5},
                "summary": {0: {"description": "Primary Investigation Cluster", "count": len(addrs)}}
            }

        features_list = []
        wallet_addresses = []

        for w in wallets:
            feat = self.scorer.extract_features(w)
            features_list.append(feat[0])
            wallet_addresses.append(w.get('address', ''))

        X = np.array(features_list)

        try:
            kmeans = KMeans(n_clusters=actual_k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X)

            clusters: Dict[int, List[str]] = {}
            for idx, label in enumerate(labels):
                lbl = int(label)
                if lbl not in clusters:
                    clusters[lbl] = []
                clusters[lbl].append(wallet_addresses[idx])

            centroids = {int(i): kmeans.cluster_centers_[i].tolist() for i in range(actual_k)}
            
            # Cluster descriptions based on feature centroids
            summary = {}
            for cid, members in clusters.items():
                center = centroids[cid]
                # feature 0: log1p(tx_count), feature 1: log1p(avg_value), feature 2: log1p(targets)
                if center[0] > 3.0 and center[2] > 2.5:
                    desc = "High-velocity Dispersion / Mixer Cluster"
                elif center[1] > 3.0:
                    desc = "High-value Accumulator / Whale Hub"
                elif center[0] < 1.5:
                    desc = "One-time Transit / Mule Wallet"
                else:
                    desc = "Intermediate Routing Network"
                summary[cid] = {"description": desc, "count": len(members)}

            logger.info(f"Clustered {len(wallets)} wallets into {len(clusters)} groups")
            return {
                "clusters": clusters,
                "centroids": centroids,
                "summary": summary
            }
        except Exception as e:
            logger.error(f"Wallet clustering error: {e}")
            addrs = [w.get('address', '') for w in wallets]
            return {
                "clusters": {0: addrs},
                "centroids": {0: []},
                "summary": {0: {"description": "Single Cluster (Fallback)", "count": len(addrs)}}
            }
