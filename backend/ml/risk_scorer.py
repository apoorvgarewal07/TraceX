import numpy as np
from sklearn.ensemble import IsolationForest
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class RiskScorer:
    def __init__(self):
        # Isolation Forest for detecting anomalous fund flow behavior
        self.model = IsolationForest(
            contamination=0.1,  # 10% expected anomaly rate
            random_state=42,
            n_estimators=100
        )
        self.fitted = False
        self._bootstrap_baseline()

    def _bootstrap_baseline(self):
        """Train on synthetic typical crypto transaction patterns so predict() works out of the box."""
        np.random.seed(42)
        # Normal wallet activity distribution (low frequency, moderate amounts, moderate targets)
        normal_data = []
        for _ in range(200):
            normal_data.append({
                'tx_count': int(np.random.exponential(10) + 1),
                'avg_value': float(np.random.exponential(2.5) + 0.1),
                'unique_targets': int(np.random.exponential(5) + 1),
                'balance': float(np.random.exponential(5.0)),
                'days_active': int(np.random.uniform(30, 1000))
            })
        
        # Suspicious / Smurfing / Rapid hop activity (high frequency, high targets, bursty)
        suspicious_data = []
        for _ in range(30):
            suspicious_data.append({
                'tx_count': int(np.random.uniform(50, 500)),
                'avg_value': float(np.random.uniform(20, 200)),
                'unique_targets': int(np.random.uniform(30, 300)),
                'balance': float(np.random.uniform(0.01, 1.0)),
                'days_active': int(np.random.uniform(1, 10))
            })
        
        all_samples = normal_data + suspicious_data
        self.fit(all_samples)

    def extract_features(self, wallet_data: Dict[str, Any]) -> np.ndarray:
        """
        Extract normalized ML features from wallet transaction data.
        Features:
        1. tx_frequency: number of transactions
        2. avg_tx_amount: average transaction value
        3. transfer_pattern_entropy: diversity of targets
        4. balance: current balance
        5. address_age: days since first transaction
        """
        tx_count = float(wallet_data.get('tx_count', 1))
        avg_value = float(wallet_data.get('avg_value', wallet_data.get('avg_tx_amount', 0.5)))
        unique_targets = float(wallet_data.get('unique_targets', wallet_data.get('transfer_pattern_entropy', 1)))
        balance = float(wallet_data.get('balance', 0.0))
        days_active = float(wallet_data.get('days_active', wallet_data.get('address_age', 30)))

        features = [
            np.log1p(max(0.0, tx_count)),
            np.log1p(max(0.0, avg_value)),
            np.log1p(max(0.0, unique_targets)),
            np.log1p(max(0.0, balance)),
            np.log1p(max(0.0, days_active))
        ]

        return np.array(features, dtype=float).reshape(1, -1)

    def predict(self, wallet_data: Dict[str, Any]) -> float:
        """
        Predict risk score between 0.0 (safe/normal) and 1.0 (high-risk/anomalous).
        """
        try:
            features = self.extract_features(wallet_data)
            # Isolation forest score_samples returns negative anomaly score (-0.8 to -0.3 typical)
            # Lower score = more anomalous
            score_raw = self.model.score_samples(features)[0]
            
            # Map score to [0.0, 1.0] where 1.0 is highest risk
            # score_raw is usually between -0.8 (highly abnormal) and -0.3 (normal)
            normalized_risk = 1.0 - (score_raw + 0.8) / 0.5
            risk_score = float(np.clip(normalized_risk, 0.05, 0.98))
            return round(risk_score, 2)
        except Exception as e:
            logger.error(f"Scoring error: {e}")
            return 0.50

    def fit(self, training_data: List[Dict[str, Any]]):
        """Train Isolation Forest model on historical wallet datasets."""
        try:
            features_list = [self.extract_features(data) for data in training_data]
            X = np.vstack(features_list)
            self.model.fit(X)
            self.fitted = True
            logger.info(f"Risk scorer fitted on {len(training_data)} samples")
        except Exception as e:
            logger.error(f"Failed to fit risk scorer: {e}")
