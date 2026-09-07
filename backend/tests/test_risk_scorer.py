import pytest
from backend.ml.risk_scorer import RiskScorer
from backend.ml.clustering import WalletClusterer

def test_risk_scorer_prediction():
    scorer = RiskScorer()
    wallet_data = {
        'tx_count': 120,
        'avg_value': 15.5,
        'unique_targets': 80,
        'balance': 250,
        'days_active': 5
    }
    score = scorer.predict(wallet_data)
    assert 0.0 <= score <= 1.0
    assert isinstance(score, float)

def test_risk_scorer_feature_extraction():
    scorer = RiskScorer()
    features = scorer.extract_features({'tx_count': 10, 'avg_value': 1.0, 'unique_targets': 5, 'balance': 0, 'days_active': 100})
    assert features.shape == (1, 5)

def test_wallet_clustering():
    clusterer = WalletClusterer()
    wallets = [
        {'address': f"0x{'1'*38}{i:02d}", 'tx_count': 5, 'avg_value': 0.1, 'unique_targets': 2, 'balance': 1, 'days_active': 100}
        for i in range(10)
    ] + [
        {'address': f"0x{'9'*38}{i:02d}", 'tx_count': 500, 'avg_value': 50.0, 'unique_targets': 200, 'balance': 0.1, 'days_active': 2}
        for i in range(5)
    ]
    res = clusterer.cluster_wallets(wallets, n_clusters=2)
    assert "clusters" in res
    assert len(res["clusters"]) == 2
    assert "summary" in res
