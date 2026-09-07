#!/usr/bin/env python3
"""
Pre-seed database with 3 realistic, high-impact cryptocurrency fraud scenarios:
1. Investment Ponzi Scheme (Multi-hop layering ending in Binance)
2. Romance Scam with Privacy Mixer Hop (Tornado.Cash routing to CoinDCX)
3. Ransomware Extortion Campaign (Multi-hop peeling chain to Kraken & Coinbase)
"""
import sys
import os
import uuid
from datetime import datetime

# Add root directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database.db import init_db, SessionLocal
from backend.database.schemas import Complaint, Trace, WalletLabel, ClusteringResult
from backend.scraper.exchange_crawler import ExchangeCrawler

def seed_scenario_1():
    """Investment Ponzi Scheme: 12 hops ending at Binance KYC deposit wallet"""
    db = SessionLocal()
    try:
        victim = "0x98f4a1c5123456789abcdef12345678901234567"
        attacker = "0x71c841a5423456789abcdef12345678901234568"
        binance = "0x28c6c06298d514db089934071355e5743bf21d60"

        complaint_id = "NCRP-2024-PONZI-001"
        trace_id = "trace-ponzi-001"

        # Check existing
        if db.query(Trace).filter_by(id=trace_id).first():
            print("Scenario 1 already exists, updating...")
            db.query(Trace).filter_by(id=trace_id).delete()
            db.query(Complaint).filter_by(id=complaint_id).delete()
            db.commit()

        complaint = Complaint(
            id=complaint_id,
            victim_wallet=victim,
            tx_hashes=["0x4a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b"],
            status="completed",
            source="NCRP"
        )
        db.add(complaint)

        hops = []
        curr_from = victim
        nodes = [{"data": {"id": victim, "label": "Victim (0x98f4...4567)", "type": "victim", "riskScore": 0.05}}]
        edges = []

        for i in range(1, 13):
            if i == 1:
                curr_to = attacker
                node_type = "attacker"
                node_lbl = "Ponzi Smart Contract"
                r_score = 0.95
            elif i == 12:
                curr_to = binance
                node_type = "exchange"
                node_lbl = "Binance 14 (Deposit)"
                r_score = 0.30
            else:
                curr_to = f"0x{'a'*36}{i:04d}"
                node_type = "mule"
                node_lbl = f"Transit Mule #{i}"
                r_score = 0.85

            amt = f"{max(0.2, 15.0 - (i * 0.9)):.2f}"
            tx_h = f"0x{'tx'*30}{i:04d}"

            hops.append({
                "hop_number": i,
                "from": curr_from,
                "to": curr_to,
                "value": amt,
                "tx_hash": tx_h,
                "asset": "ETH",
                "chain": "ETH"
            })

            nodes.append({"data": {"id": curr_to, "label": node_lbl, "type": node_type, "riskScore": r_score}})
            edges.append({"data": {"id": f"e_{i}", "source": curr_from, "target": curr_to, "label": f"{amt} ETH", "amount": amt, "tx_hash": tx_h}})
            curr_from = curr_to

        trace = Trace(
            id=trace_id,
            complaint_id=complaint_id,
            source_wallet=victim,
            target_vasp="Binance 14",
            hops_count=12,
            risk_score=0.94,
            hops_data={
                "trace_id": trace_id,
                "source": victim,
                "hops": hops,
                "hops_count": 12,
                "risk_score": 0.94,
                "identified_exchanges": [
                    {"address": binance, "name": "Binance 14", "entity_type": "EXCHANGE", "confidence": 0.99, "source": "ForensicsCurated"}
                ],
                "target_vasp": "Binance 14",
                "graph": {"nodes": nodes, "edges": edges}
            }
        )
        db.add(trace)
        db.commit()
        print("✓ Scenario 1 seeded: High-Yield Ponzi Scheme (12 hops -> Binance)")
    finally:
        db.close()

def seed_scenario_2():
    """Romance Scam with Privacy Mixer Hop: 8 hops through Tornado.Cash to CoinDCX"""
    db = SessionLocal()
    try:
        victim = "0x55a1b2c3d4e5f60718293a4b5c6d7e8f90123456"
        mixer = "0xd90e2f925da726b50c4ed8d0fb90ad053324f31b"
        coindcx = "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be"

        complaint_id = "SAHYOG-2024-ROMANCE-002"
        trace_id = "trace-romance-mixer-002"

        if db.query(Trace).filter_by(id=trace_id).first():
            db.query(Trace).filter_by(id=trace_id).delete()
            db.query(Complaint).filter_by(id=complaint_id).delete()
            db.commit()

        complaint = Complaint(
            id=complaint_id,
            victim_wallet=victim,
            tx_hashes=["0x8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d"],
            status="completed",
            source="SAHYOG"
        )
        db.add(complaint)

        hops = []
        curr_from = victim
        nodes = [{"data": {"id": victim, "label": "Victim (0x55a1...3456)", "type": "victim", "riskScore": 0.10}}]
        edges = []

        sequence = [
            ("0x1111222233334444555566667777888899990001", "attacker", "Impersonator Wallet", 0.96),
            ("0x1111222233334444555566667777888899990002", "mule", "Mule Splitter 1", 0.88),
            (mixer, "mixer", "Tornado.Cash Router", 0.99),
            ("0x1111222233334444555566667777888899990003", "mixer", "Mixer Relayer Pool", 0.92),
            ("0x1111222233334444555566667777888899990004", "mule", "Transit Mule 2", 0.84),
            ("0x1111222233334444555566667777888899990005", "mule", "Transit Mule 3", 0.80),
            (coindcx, "exchange", "CoinDCX Treasury", 0.35),
        ]

        for i, (addr, n_type, n_lbl, r_sc) in enumerate(sequence, 1):
            amt = f"{max(0.5, 8.5 - (i * 0.7)):.2f}"
            tx_h = f"0x{'tx'*28}rom{i:04d}"
            hops.append({
                "hop_number": i,
                "from": curr_from,
                "to": addr,
                "value": amt,
                "tx_hash": tx_h,
                "asset": "ETH",
                "chain": "ETH"
            })
            nodes.append({"data": {"id": addr, "label": n_lbl, "type": n_type, "riskScore": r_sc}})
            edges.append({"data": {"id": f"e_rom_{i}", "source": curr_from, "target": addr, "label": f"{amt} ETH", "amount": amt, "tx_hash": tx_h}})
            curr_from = addr

        trace = Trace(
            id=trace_id,
            complaint_id=complaint_id,
            source_wallet=victim,
            target_vasp="CoinDCX Treasury",
            hops_count=len(hops),
            risk_score=0.91,
            hops_data={
                "trace_id": trace_id,
                "source": victim,
                "hops": hops,
                "hops_count": len(hops),
                "risk_score": 0.91,
                "identified_exchanges": [
                    {"address": mixer, "name": "Tornado.Cash Router", "entity_type": "MIXER", "confidence": 0.99, "source": "ForensicsCurated"},
                    {"address": coindcx, "name": "CoinDCX Treasury", "entity_type": "EXCHANGE", "confidence": 0.97, "source": "ForensicsCurated"}
                ],
                "target_vasp": "CoinDCX Treasury",
                "graph": {"nodes": nodes, "edges": edges}
            }
        )
        db.add(trace)
        db.commit()
        print("✓ Scenario 2 seeded: Romance Scam with Mixer (7 hops -> CoinDCX)")
    finally:
        db.close()

def seed_scenario_3():
    """Ransomware Extortion: 15 hops peeling chain cashout into Kraken & Coinbase"""
    db = SessionLocal()
    try:
        victim = "0x3344556677889900aabbccddeeff001122334455"
        kraken = "0x2910543af39aba0cd09dbb2d50200b3e800a63d2"
        coinbase = "0x71660c4005ba85c37ccec55d0c4493e66fe775d3"

        complaint_id = "I4C-2024-RANSOM-003"
        trace_id = "trace-ransomware-003"

        if db.query(Trace).filter_by(id=trace_id).first():
            db.query(Trace).filter_by(id=trace_id).delete()
            db.query(Complaint).filter_by(id=complaint_id).delete()
            db.commit()

        complaint = Complaint(
            id=complaint_id,
            victim_wallet=victim,
            tx_hashes=["0xbb99aa887766554433221100ffeeddccbbaa99887766554433221100ffeeddcc"],
            status="completed",
            source="I4C_DIRECT"
        )
        db.add(complaint)

        hops = []
        nodes = [{"data": {"id": victim, "label": "Enterprise Victim (0x3344...4455)", "type": "victim", "riskScore": 0.05}}]
        edges = []

        curr_from = victim
        for i in range(1, 16):
            if i == 1:
                curr_to = "0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c"
                n_type = "attacker"
                n_lbl = "Ransomware Treasury"
                r_sc = 0.98
            elif i == 8:
                curr_to = kraken
                n_type = "exchange"
                n_lbl = "Kraken 1 (Exit Rail 1)"
                r_sc = 0.30
            elif i == 15:
                curr_to = coinbase
                n_type = "exchange"
                n_lbl = "Coinbase 1 (Exit Rail 2)"
                r_sc = 0.30
            else:
                curr_to = f"0x{'c'*36}{i:04d}"
                n_type = "mule"
                n_lbl = f"Peeling Hop #{i}"
                r_sc = 0.88

            amt = f"{max(1.0, 45.0 - (i * 2.5)):.2f}"
            tx_h = f"0x{'rn'*28}{i:04d}"

            hops.append({
                "hop_number": i,
                "from": curr_from,
                "to": curr_to,
                "value": amt,
                "tx_hash": tx_h,
                "asset": "ETH",
                "chain": "ETH"
            })
            nodes.append({"data": {"id": curr_to, "label": n_lbl, "type": n_type, "riskScore": r_sc}})
            edges.append({"data": {"id": f"e_rn_{i}", "source": curr_from, "target": curr_to, "label": f"{amt} ETH", "amount": amt, "tx_hash": tx_h}})
            curr_from = curr_to

        trace = Trace(
            id=trace_id,
            complaint_id=complaint_id,
            source_wallet=victim,
            target_vasp="Kraken 1 / Coinbase 1",
            hops_count=15,
            risk_score=0.96,
            hops_data={
                "trace_id": trace_id,
                "source": victim,
                "hops": hops,
                "hops_count": 15,
                "risk_score": 0.96,
                "identified_exchanges": [
                    {"address": kraken, "name": "Kraken 1", "entity_type": "EXCHANGE", "confidence": 0.99, "source": "ForensicsCurated"},
                    {"address": coinbase, "name": "Coinbase 1", "entity_type": "EXCHANGE", "confidence": 0.99, "source": "ForensicsCurated"}
                ],
                "target_vasp": "Kraken 1 / Coinbase 1",
                "graph": {"nodes": nodes, "edges": edges}
            }
        )
        db.add(trace)
        db.commit()
        print("✓ Scenario 3 seeded: Ransomware Campaign (15 hops -> Kraken + Coinbase)")
    finally:
        db.close()

def seed_scenario_4():
    """3-Hop Phishing Scam: Victim -> Attacker -> Mule -> Binance 14"""
    db = SessionLocal()
    try:
        victim = "0x3a9b1c8f4d7e2a5b6c0d8f1e3a5c7e9b2d4f6a81"
        attacker = "0x7b2c9d4e1f8a3b5c6d0e2f4a6b8d1c3e5f7a9b02"
        mule = "0x4f1a8b3c9d2e5f7a6b0c8d1e3f5a7b9c2d4e6f03"
        binance = "0x28c6c06298d514db089934071355e5743bf21d60"

        complaint_id = "NCRP-2024-3HOP-004"
        trace_id = "trace-3hop-004"

        if db.query(Trace).filter_by(id=trace_id).first():
            db.query(Trace).filter_by(id=trace_id).delete()
            db.query(Complaint).filter_by(id=complaint_id).delete()
            db.commit()

        complaint = Complaint(
            id=complaint_id,
            victim_wallet=victim,
            tx_hashes=["0x3311aa22bb33cc44dd55ee66ff77aa88bb99cc00112233445566778899aabbcc"],
            status="completed",
            source="NCRP"
        )
        db.add(complaint)

        hops = [
            {
                "hop_number": 1,
                "from": victim,
                "to": attacker,
                "value": "4.50",
                "tx_hash": "0x3311aa22bb33cc44dd55ee66ff77aa88bb99cc00112233445566778899aabbcc",
                "asset": "ETH",
                "chain": "ETH"
            },
            {
                "hop_number": 2,
                "from": attacker,
                "to": mule,
                "value": "4.48",
                "tx_hash": "0x5522bb33cc44dd55ee66ff77aa88bb99cc00112233445566778899aabbcc1122",
                "asset": "ETH",
                "chain": "ETH"
            },
            {
                "hop_number": 3,
                "from": mule,
                "to": binance,
                "value": "4.45",
                "tx_hash": "0x7733cc44dd55ee66ff77aa88bb99cc00112233445566778899aabbcc22334455",
                "asset": "ETH",
                "chain": "ETH"
            }
        ]

        nodes = [
            {"data": {"id": victim, "label": "Victim (0x3a9b...6a81)", "type": "victim", "riskScore": 0.05}},
            {"data": {"id": attacker, "label": "Phishing Attacker", "type": "attacker", "riskScore": 0.95}},
            {"data": {"id": mule, "label": "Transit Mule #1", "type": "mule", "riskScore": 0.82}},
            {"data": {"id": binance, "label": "Binance 14 (Deposit)", "type": "exchange", "riskScore": 0.30}}
        ]

        edges = [
            {"data": {"id": "e_3h_1", "source": victim, "target": attacker, "label": "4.50 ETH", "amount": "4.50", "tx_hash": hops[0]["tx_hash"]}},
            {"data": {"id": "e_3h_2", "source": attacker, "target": mule, "label": "4.48 ETH", "amount": "4.48", "tx_hash": hops[1]["tx_hash"]}},
            {"data": {"id": "e_3h_3", "source": mule, "target": binance, "label": "4.45 ETH", "amount": "4.45", "tx_hash": hops[2]["tx_hash"]}}
        ]

        trace = Trace(
            id=trace_id,
            complaint_id=complaint_id,
            source_wallet=victim,
            target_vasp="Binance 14",
            hops_count=3,
            risk_score=0.92,
            hops_data={
                "trace_id": trace_id,
                "source": victim,
                "hops": hops,
                "hops_count": 3,
                "risk_score": 0.92,
                "identified_exchanges": [
                    {"address": binance, "name": "Binance 14", "entity_type": "EXCHANGE", "confidence": 0.99, "source": "ForensicsCurated"}
                ],
                "target_vasp": "Binance 14",
                "graph": {"nodes": nodes, "edges": edges}
            }
        )
        db.add(trace)
        db.commit()
        print("✓ Scenario 4 seeded: 3-Hop Phishing Case (3 hops -> Binance)")
    finally:
        db.close()

def main():
    print("=====================================================")
    print(" CRYPTOFRAUD TRACE - PRE-SEEDING DEMO SCENARIOS      ")
    print("=====================================================")
    init_db()
    ExchangeCrawler().seed_wallet_labels()
    seed_scenario_1()
    seed_scenario_2()
    seed_scenario_3()
    seed_scenario_4()
    print("=====================================================")
    print("✓ ALL DEMO SCENARIOS SEEDED & READY FOR PRESENTATION")
    print("=====================================================")

if __name__ == '__main__':
    main()
