"""
Hand-written edges[] fixture matching the frozen contract in Blueprint Section 3.3.
Exercises canonical multi-hop fraud tracing and boundary conditions for R1-R8.
"""

from typing import List, Dict, Any

# Root fraud transaction reference
ROOT_TX_HASH = "0x4a8b79234c01f68749e7b2f0a1c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1"

# -----------------------------------------------------------------------------
# Canonical Multi-Hop Fixture
# -----------------------------------------------------------------------------
SAMPLE_TRACE_EDGES: List[Dict[str, Any]] = [
  # Hop 1: Origin to Mule 1
  {
    "edge_id": "e_001",
    "from": "0x1111111111111111111111111111111111111111",
    "to": "0x2222222222222222222222222222222222222222",
    "tx_hash": "0xaaa001",
    "value": "100.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T11:00:00Z",
    "hop_number": 1,
    "taint_amount": "100.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "sha256:ev_001",
    "boundary_type": "NONE",
    "data_mode": "LIVE",
  },
  # Hop 2: Rapid pass-through: 0x2222 receives 100 ETH, forwards 95 ETH (95%) in 120s (< 300s)
  {
    "edge_id": "e_002",
    "from": "0x2222222222222222222222222222222222222222",
    "to": "0x3333333333333333333333333333333333333333",
    "tx_hash": "0xaaa002",
    "value": "95.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T11:02:00Z",
    "hop_number": 2,
    "taint_amount": "95.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "sha256:ev_002",
    "boundary_type": "NONE",
    "data_mode": "LIVE",
  },
  # Hop 3: Fan-out: 0x3333 sends to 5 distinct addresses at hop 3
  {
    "edge_id": "e_003_1",
    "from": "0x3333333333333333333333333333333333333333",
    "to": "0x4444444444444444444444444444444444444401",
    "tx_hash": "0xaaa003_1",
    "value": "15.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T11:10:00Z",
    "hop_number": 3,
    "taint_amount": "15.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "sha256:ev_003_1",
    "boundary_type": "NONE",
    "data_mode": "LIVE",
  },
  {
    "edge_id": "e_003_2",
    "from": "0x3333333333333333333333333333333333333333",
    "to": "0x4444444444444444444444444444444444444402",
    "tx_hash": "0xaaa003_2",
    "value": "15.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T11:10:15Z",
    "hop_number": 3,
    "taint_amount": "15.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "sha256:ev_003_2",
    "boundary_type": "NONE",
    "data_mode": "LIVE",
  },
  {
    "edge_id": "e_003_3",
    "from": "0x3333333333333333333333333333333333333333",
    "to": "0x4444444444444444444444444444444444444403",
    "tx_hash": "0xaaa003_3",
    "value": "15.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T11:10:30Z",
    "hop_number": 3,
    "taint_amount": "15.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "sha256:ev_003_3",
    "boundary_type": "NONE",
    "data_mode": "LIVE",
  },
  {
    "edge_id": "e_003_4",
    "from": "0x3333333333333333333333333333333333333333",
    "to": "0x4444444444444444444444444444444444444404",
    "tx_hash": "0xaaa003_4",
    "value": "15.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T11:10:45Z",
    "hop_number": 3,
    "taint_amount": "15.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "sha256:ev_003_4",
    "boundary_type": "NONE",
    "data_mode": "LIVE",
  },
  {
    "edge_id": "e_003_5",
    "from": "0x3333333333333333333333333333333333333333",
    "to": "0x4444444444444444444444444444444444444405",
    "tx_hash": "0xaaa003_5",
    "value": "15.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T11:11:00Z",
    "hop_number": 3,
    "taint_amount": "15.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "sha256:ev_003_5",
    "boundary_type": "NONE",
    "data_mode": "LIVE",
  },
  # Hop 4: Privacy Protocol mixer deposit from 0x4444...01
  {
    "edge_id": "e_004_mixer",
    "from": "0x4444444444444444444444444444444444444401",
    "to": "0xd90e2f925da726b50c4ed8d0fb90ad053324f31b",
    "tx_hash": "0xaaa004",
    "value": "10.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T11:20:00Z",
    "hop_number": 4,
    "taint_amount": "10.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "sha256:ev_004",
    "boundary_type": "MIXER",
    "data_mode": "LIVE",
  },
  # Hop 5: Exchange Exit to Tier A VASP
  {
    "edge_id": "e_005_exchange",
    "from": "0x4444444444444444444444444444444444444402",
    "to": "0x28c6c06298d514db089934071355e5743bf21d60",
    "tx_hash": "0xaaa005",
    "value": "14.5",
    "asset": "ETH",
    "timestamp": "2026-09-20T11:35:00Z",
    "hop_number": 4,
    "taint_amount": "14.5",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "sha256:ev_005",
    "boundary_type": "EXCHANGE",
    "data_mode": "LIVE",
    "exit_tier": "A",
    "vasp_name": "Binance Holdings Ltd.",
  },
]

# -----------------------------------------------------------------------------
# R1 Boundary Test Fixtures (>=90% taint forwarded within <=300s)
# -----------------------------------------------------------------------------
R1_EXACT_90_300S_PASS: List[Dict[str, Any]] = [
  {
    "edge_id": "in_1",
    "from": "0xsource",
    "to": "0xwallet_r1",
    "tx_hash": "0xtx_in",
    "value": "100.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T12:00:00Z",
    "hop_number": 1,
    "taint_amount": "100.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "ev_in",
    "boundary_type": "NONE",
  },
  {
    "edge_id": "out_1",
    "from": "0xwallet_r1",
    "to": "0xtarget",
    "tx_hash": "0xtx_out",
    "value": "90.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T12:05:00Z",  # exactly 300s
    "hop_number": 2,
    "taint_amount": "90.0",                 # exactly 90%
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "ev_out",
    "boundary_type": "NONE",
  },
]

R1_BELOW_90_FAIL: List[Dict[str, Any]] = [
  {
    "edge_id": "in_1",
    "from": "0xsource",
    "to": "0xwallet_r1",
    "tx_hash": "0xtx_in",
    "value": "100.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T12:00:00Z",
    "hop_number": 1,
    "taint_amount": "100.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "ev_in",
    "boundary_type": "NONE",
  },
  {
    "edge_id": "out_1",
    "from": "0xwallet_r1",
    "to": "0xtarget",
    "tx_hash": "0xtx_out",
    "value": "89.9",
    "asset": "ETH",
    "timestamp": "2026-09-20T12:02:00Z",  # 120s (well within window)
    "hop_number": 2,
    "taint_amount": "89.9",                 # 89.9% (< 90%)
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "ev_out",
    "boundary_type": "NONE",
  },
]

R1_OVER_300S_FAIL: List[Dict[str, Any]] = [
  {
    "edge_id": "in_1",
    "from": "0xsource",
    "to": "0xwallet_r1",
    "tx_hash": "0xtx_in",
    "value": "100.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T12:00:00Z",
    "hop_number": 1,
    "taint_amount": "100.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "ev_in",
    "boundary_type": "NONE",
  },
  {
    "edge_id": "out_1",
    "from": "0xwallet_r1",
    "to": "0xtarget",
    "tx_hash": "0xtx_out",
    "value": "95.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T12:05:01Z",  # 301s (> 300s)
    "hop_number": 2,
    "taint_amount": "95.0",                 # 95%
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "ev_out",
    "boundary_type": "NONE",
  },
]

# -----------------------------------------------------------------------------
# R2 Boundary Test Fixtures (Peel chain: >=3 sequential edges, each <20% of taint)
# -----------------------------------------------------------------------------
R2_EXACT_3_PEELS_PASS: List[Dict[str, Any]] = [
  {
    "edge_id": "in_r2",
    "from": "0xsrc",
    "to": "0xpeel_wallet",
    "tx_hash": "0xin_tx",
    "value": "100.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T13:00:00Z",
    "hop_number": 1,
    "taint_amount": "100.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "ev_r2_in",
    "boundary_type": "NONE",
  },
  # Peel 1: 19% (<20%)
  {
    "edge_id": "out_r2_1",
    "from": "0xpeel_wallet",
    "to": "0xmule1",
    "tx_hash": "0xpeel_1",
    "value": "19.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T13:02:00Z",
    "hop_number": 2,
    "taint_amount": "19.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "ev_r2_out1",
    "boundary_type": "NONE",
  },
  # Peel 2: 15% (<20%)
  {
    "edge_id": "out_r2_2",
    "from": "0xpeel_wallet",
    "to": "0xmule2",
    "tx_hash": "0xpeel_2",
    "value": "15.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T13:04:00Z",
    "hop_number": 3,
    "taint_amount": "15.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "ev_r2_out2",
    "boundary_type": "NONE",
  },
  # Peel 3: 10% (<20%)
  {
    "edge_id": "out_r2_3",
    "from": "0xpeel_wallet",
    "to": "0xmule3",
    "tx_hash": "0xpeel_3",
    "value": "10.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T13:06:00Z",
    "hop_number": 4,
    "taint_amount": "10.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "ev_r2_out3",
    "boundary_type": "NONE",
  },
]

R2_ONLY_2_PEELS_FAIL: List[Dict[str, Any]] = [
  {
    "edge_id": "in_r2",
    "from": "0xsrc",
    "to": "0xpeel_wallet",
    "tx_hash": "0xin_tx",
    "value": "100.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T13:00:00Z",
    "hop_number": 1,
    "taint_amount": "100.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "ev_r2_in",
    "boundary_type": "NONE",
  },
  {
    "edge_id": "out_r2_1",
    "from": "0xpeel_wallet",
    "to": "0xmule1",
    "tx_hash": "0xpeel_1",
    "value": "15.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T13:02:00Z",
    "hop_number": 2,
    "taint_amount": "15.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "ev_r2_out1",
    "boundary_type": "NONE",
  },
  {
    "edge_id": "out_r2_2",
    "from": "0xpeel_wallet",
    "to": "0xmule2",
    "tx_hash": "0xpeel_2",
    "value": "15.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T13:04:00Z",
    "hop_number": 3,
    "taint_amount": "15.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "ev_r2_out2",
    "boundary_type": "NONE",
  },
]

R2_EDGE_20_PCT_FAIL: List[Dict[str, Any]] = [
  {
    "edge_id": "in_r2",
    "from": "0xsrc",
    "to": "0xpeel_wallet",
    "tx_hash": "0xin_tx",
    "value": "100.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T13:00:00Z",
    "hop_number": 1,
    "taint_amount": "100.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "ev_r2_in",
    "boundary_type": "NONE",
  },
  {
    "edge_id": "out_r2_1",
    "from": "0xpeel_wallet",
    "to": "0xmule1",
    "tx_hash": "0xpeel_1",
    "value": "20.0",  # exactly 20.0%, fails condition (< 20%)
    "asset": "ETH",
    "timestamp": "2026-09-20T13:02:00Z",
    "hop_number": 2,
    "taint_amount": "20.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "ev_r2_out1",
    "boundary_type": "NONE",
  },
  {
    "edge_id": "out_r2_2",
    "from": "0xpeel_wallet",
    "to": "0xmule2",
    "tx_hash": "0xpeel_2",
    "value": "15.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T13:04:00Z",
    "hop_number": 3,
    "taint_amount": "15.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "ev_r2_out2",
    "boundary_type": "NONE",
  },
  {
    "edge_id": "out_r2_3",
    "from": "0xpeel_wallet",
    "to": "0xmule3",
    "tx_hash": "0xpeel_3",
    "value": "10.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T13:06:00Z",
    "hop_number": 4,
    "taint_amount": "10.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "ev_r2_out3",
    "boundary_type": "NONE",
  },
]

# -----------------------------------------------------------------------------
# R3 Boundary Test Fixtures (Fan-out: single wallet sends to >=5 distinct targets)
# -----------------------------------------------------------------------------
def make_fan_out_edges(wallet: str, target_count: int, hop_number: int = 2) -> List[Dict[str, Any]]:
  return [
    {
      "edge_id": f"fanout_{i}",
      "from": wallet,
      "to": f"0xtarget_{i}",
      "tx_hash": f"0xfan_{i}",
      "value": "5.0",
      "asset": "ETH",
      "timestamp": "2026-09-20T14:00:00Z",
      "hop_number": hop_number,
      "taint_amount": "5.0",
      "taint_source_tx": ROOT_TX_HASH,
      "evidence_id": f"ev_fan_{i}",
      "boundary_type": "NONE",
    }
    for i in range(1, target_count + 1)
  ]

R3_EXACT_5_PASS: List[Dict[str, Any]] = make_fan_out_edges("0xfan_src", 5)
R3_EXACT_4_FAIL: List[Dict[str, Any]] = make_fan_out_edges("0xfan_src", 4)

# -----------------------------------------------------------------------------
# R4 Boundary Test Fixtures (Fan-in: >=5 distinct sources converge into one wallet in <=1800s)
# -----------------------------------------------------------------------------
def make_fan_in_edges(target_wallet: str, source_count: int, time_span_s: int) -> List[Dict[str, Any]]:
  edges = []
  base_time_s = 1758360000  # Unix timestamp
  step = float(time_span_s) / max(source_count - 1, 1)
  for i in range(1, source_count + 1):
    t_unix = int(base_time_s + round((i - 1) * step))
    # Format ISO 8601
    import datetime
    dt_str = datetime.datetime.fromtimestamp(t_unix, tz=datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    edges.append({
      "edge_id": f"fanin_{i}",
      "from": f"0xsource_wallet_{i}",
      "to": target_wallet,
      "tx_hash": f"0xfanin_tx_{i}",
      "value": "5.0",
      "asset": "ETH",
      "timestamp": dt_str,
      "hop_number": 3,
      "taint_amount": "5.0",
      "taint_source_tx": ROOT_TX_HASH,
      "evidence_id": f"ev_fanin_{i}",
      "boundary_type": "NONE",
    })
  return edges

R4_EXACT_5_PASS: List[Dict[str, Any]] = make_fan_in_edges("0xconsolidator", 5, 1800)
R4_EXACT_4_FAIL: List[Dict[str, Any]] = make_fan_in_edges("0xconsolidator", 4, 1800)
R4_OVER_1800S_FAIL: List[Dict[str, Any]] = make_fan_in_edges("0xconsolidator", 5, 1805)

# -----------------------------------------------------------------------------
# R5 Boundary Test Fixtures (Privacy protocol: boundary_type == "MIXER")
# -----------------------------------------------------------------------------
R5_MIXER_PASS: List[Dict[str, Any]] = [
  {
    "edge_id": "e_mixer",
    "from": "0xuser",
    "to": "0xmixer_contract",
    "tx_hash": "0xtx_mixer",
    "value": "10.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T15:00:00Z",
    "hop_number": 2,
    "taint_amount": "10.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "sha256:mixer_evidence",
    "boundary_type": "MIXER",
  }
]

R5_NONE_FAIL: List[Dict[str, Any]] = [
  {
    "edge_id": "e_regular",
    "from": "0xuser",
    "to": "0xcontract",
    "tx_hash": "0xtx_regular",
    "value": "10.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T15:00:00Z",
    "hop_number": 2,
    "taint_amount": "10.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "sha256:regular_evidence",
    "boundary_type": "NONE",
  }
]

# -----------------------------------------------------------------------------
# R6 Gas Sponsor Match Fixtures (>=2 wallets in trace funded by same parent)
# -----------------------------------------------------------------------------
R6_SAMPLE_CLUSTERS = [
  {
    "cluster_id": "gasc_001",
    "funding_wallet": "0xparent_gas_sponsor",
    "funded_wallets": [
      "0x2222222222222222222222222222222222222222",
      "0x3333333333333333333333333333333333333333",
    ],
    "evidence_ids": ["sha256:gas_cluster_evidence"],
  }
]

# -----------------------------------------------------------------------------
# R8 Exchange Exit Boundary Test Fixtures
# -----------------------------------------------------------------------------
R8_EXCHANGE_TIER_A_PASS: List[Dict[str, Any]] = [
  {
    "edge_id": "e_exit_a",
    "from": "0xmule",
    "to": "0xexchange_deposit",
    "tx_hash": "0xtx_exit",
    "value": "20.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T16:00:00Z",
    "hop_number": 3,
    "taint_amount": "20.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "sha256:exit_evidence",
    "boundary_type": "EXCHANGE",
    "exit_tier": "A",
    "vasp_name": "CoinDCX",
  }
]

R8_EXCHANGE_TIER_B_PASS: List[Dict[str, Any]] = [
  {
    "edge_id": "e_exit_b",
    "from": "0xmule",
    "to": "0xexchange_deposit",
    "tx_hash": "0xtx_exit_b",
    "value": "20.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T16:00:00Z",
    "hop_number": 3,
    "taint_amount": "20.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "sha256:exit_evidence_b",
    "boundary_type": "EXCHANGE",
    "exit_tier": "B",
    "vasp_name": "WazirX",
  }
]

R8_EXCHANGE_TIER_C_FAIL: List[Dict[str, Any]] = [
  {
    "edge_id": "e_exit_c",
    "from": "0xmule",
    "to": "0xunknown_service",
    "tx_hash": "0xtx_exit_c",
    "value": "20.0",
    "asset": "ETH",
    "timestamp": "2026-09-20T16:00:00Z",
    "hop_number": 3,
    "taint_amount": "20.0",
    "taint_source_tx": ROOT_TX_HASH,
    "evidence_id": "sha256:exit_evidence_c",
    "boundary_type": "EXCHANGE",
    "exit_tier": "C",
    "vasp_name": "Unverified OTC",
  }
]
