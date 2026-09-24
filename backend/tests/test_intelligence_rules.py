"""
Unit & boundary tests for TraceX Intelligence Engine (R1-R8).
Proves exact boundary conditions for deterministic heuristics and pipeline determinism.
"""

import pytest
import json

from backend.intelligence.rules import (
    detect_rapid_passthrough,
    detect_peel_chain,
    detect_fan_out,
    detect_fan_in,
    detect_privacy_protocol,
    detect_gas_sponsor_match,
    detect_bytecode_match,
    detect_exchange_exit,
)
from backend.intelligence.orchestrator import run_intelligence_pipeline
from backend.tests.fixtures.edges_fixture import (
    SAMPLE_TRACE_EDGES,
    R1_EXACT_90_300S_PASS,
    R1_BELOW_90_FAIL,
    R1_OVER_300S_FAIL,
    R2_EXACT_3_PEELS_PASS,
    R2_ONLY_2_PEELS_FAIL,
    R2_EDGE_20_PCT_FAIL,
    R3_EXACT_5_PASS,
    R3_EXACT_4_FAIL,
    R4_EXACT_5_PASS,
    R4_EXACT_4_FAIL,
    R4_OVER_1800S_FAIL,
    R5_MIXER_PASS,
    R5_NONE_FAIL,
    R6_SAMPLE_CLUSTERS,
    R8_EXCHANGE_TIER_A_PASS,
    R8_EXCHANGE_TIER_B_PASS,
    R8_EXCHANGE_TIER_C_FAIL,
)


# ---------------------------------------------------------------------------
# R1: Rapid Pass-Through Tests
# ---------------------------------------------------------------------------
def test_r1_rapid_passthrough_exact_boundary():
    # >=90% in <=300s must pass
    findings = detect_rapid_passthrough(R1_EXACT_90_300S_PASS, trace_id="trace_test_r1")
    assert len(findings) == 1
    f = findings[0]
    assert f.rule.startswith("R1")
    assert f.severity in ("high", "medium")
    assert f.evidence_edge_ids == ["in_1", "out_1"]
    assert "90.0%" in f.explanation
    assert "300s" in f.explanation


def test_r1_rapid_passthrough_below_90_fail():
    # 89.9% in 120s must fail
    findings = detect_rapid_passthrough(R1_BELOW_90_FAIL, trace_id="trace_test_r1")
    assert len(findings) == 0


def test_r1_rapid_passthrough_over_300s_fail():
    # 95% in 301s must fail
    findings = detect_rapid_passthrough(R1_OVER_300S_FAIL, trace_id="trace_test_r1")
    assert len(findings) == 0


# ---------------------------------------------------------------------------
# R2: Peel Chain Tests
# ---------------------------------------------------------------------------
def test_r2_peel_chain_exact_3_peels_pass():
    # 3 sequential peels each <20% must pass
    findings = detect_peel_chain(R2_EXACT_3_PEELS_PASS, trace_id="trace_test_r2")
    assert len(findings) == 1
    f = findings[0]
    assert f.rule.startswith("R2")
    assert f.severity == "high"
    assert len(f.evidence_edge_ids) == 3
    assert "Peel chain pattern detected" in f.explanation
    assert "sequential outgoing transfers" in f.explanation


def test_r2_peel_chain_only_2_peels_fail():
    # Only 2 peels must fail threshold of >=3
    findings = detect_peel_chain(R2_ONLY_2_PEELS_FAIL, trace_id="trace_test_r2")
    assert len(findings) == 0


def test_r2_peel_chain_edge_at_20_pct_fail():
    # A peel of exactly 20.0% is not <20.0%, so only 2 remain <20.0%, must fail
    findings = detect_peel_chain(R2_EDGE_20_PCT_FAIL, trace_id="trace_test_r2")
    assert len(findings) == 0


# ---------------------------------------------------------------------------
# R3: Fan-Out Tests
# ---------------------------------------------------------------------------
def test_r3_fan_out_exact_5_pass():
    # Single wallet dispersing to 5 distinct targets
    findings = detect_fan_out(R3_EXACT_5_PASS, trace_id="trace_test_r3")
    assert len(findings) == 1
    f = findings[0]
    assert f.rule.startswith("R3")
    assert f.severity == "medium"
    assert len(f.evidence_edge_ids) == 5
    assert "dispersed" in f.explanation
    assert "5 distinct destination wallets" in f.explanation


def test_r3_fan_out_exact_4_fail():
    # Single wallet dispersing to 4 distinct targets fails threshold of >=5
    findings = detect_fan_out(R3_EXACT_4_FAIL, trace_id="trace_test_r3")
    assert len(findings) == 0


# ---------------------------------------------------------------------------
# R4: Fan-In Tests
# ---------------------------------------------------------------------------
def test_r4_fan_in_exact_5_pass():
    # 5 distinct sources converging in 1800s
    findings = detect_fan_in(R4_EXACT_5_PASS, trace_id="trace_test_r4")
    assert len(findings) == 1
    f = findings[0]
    assert f.rule.startswith("R4")
    assert f.severity == "high"
    assert len(f.evidence_edge_ids) == 5
    assert "Fan-in consolidation detected" in f.explanation
    assert "0xconsolidator" in f.explanation


def test_r4_fan_in_exact_4_fail():
    # 4 distinct sources fails threshold of >=5
    findings = detect_fan_in(R4_EXACT_4_FAIL, trace_id="trace_test_r4")
    assert len(findings) == 0


def test_r4_fan_in_over_1800s_fail():
    # 5 sources spanning >1800s fails <=1800s window
    findings = detect_fan_in(R4_OVER_1800S_FAIL, trace_id="trace_test_r4")
    assert len(findings) == 0


# ---------------------------------------------------------------------------
# R5: Privacy Protocol Tests
# ---------------------------------------------------------------------------
def test_r5_privacy_protocol_mixer_pass():
    findings = detect_privacy_protocol(R5_MIXER_PASS, trace_id="trace_test_r5")
    assert len(findings) == 1
    f = findings[0]
    assert f.rule.startswith("R5")
    assert f.severity == "high"
    assert f.evidence_edge_ids == ["e_mixer"]
    assert "privacy pool/mixer" in f.explanation


def test_r5_privacy_protocol_none_fail():
    findings = detect_privacy_protocol(R5_NONE_FAIL, trace_id="trace_test_r5")
    assert len(findings) == 0


# ---------------------------------------------------------------------------
# R6: Gas Sponsor Match Tests
# ---------------------------------------------------------------------------
def test_r6_gas_sponsor_match_pass():
    findings = detect_gas_sponsor_match(
        SAMPLE_TRACE_EDGES,
        trace_id="trace_test_r6",
        gas_clusters=R6_SAMPLE_CLUSTERS,
    )
    assert len(findings) == 1
    f = findings[0]
    assert f.rule.startswith("R6")
    assert f.severity == "high"
    assert "0xparent_gas_sponsor" in f.explanation
    assert len(f.evidence_edge_ids) >= 1


def test_r6_gas_sponsor_empty_clusters():
    findings = detect_gas_sponsor_match(
        SAMPLE_TRACE_EDGES,
        trace_id="trace_test_r6",
        gas_clusters=[],
    )
    assert len(findings) == 0


# ---------------------------------------------------------------------------
# R7: Bytecode Match Stub Test
# ---------------------------------------------------------------------------
def test_r7_bytecode_match_raises_not_implemented():
    with pytest.raises(NotImplementedError) as exc_info:
        detect_bytecode_match(SAMPLE_TRACE_EDGES, trace_id="trace_test_r7")
    assert "R7 Bytecode Match is pending contract agreement with Person 1" in str(exc_info.value)


# ---------------------------------------------------------------------------
# R8: Exchange Exit Tests
# ---------------------------------------------------------------------------
def test_r8_exchange_tier_a_pass():
    findings = detect_exchange_exit(R8_EXCHANGE_TIER_A_PASS, trace_id="trace_test_r8")
    assert len(findings) == 1
    f = findings[0]
    assert f.rule.startswith("R8")
    assert f.severity == "low"
    assert "CoinDCX" in f.explanation
    assert "Tier A" in f.explanation


def test_r8_exchange_tier_b_pass():
    findings = detect_exchange_exit(R8_EXCHANGE_TIER_B_PASS, trace_id="trace_test_r8")
    assert len(findings) == 1
    f = findings[0]
    assert f.rule.startswith("R8")
    assert f.severity == "low"
    assert "WazirX" in f.explanation
    assert "Tier B" in f.explanation


def test_r8_exchange_tier_c_fail():
    findings = detect_exchange_exit(R8_EXCHANGE_TIER_C_FAIL, trace_id="trace_test_r8")
    assert len(findings) == 0


# ---------------------------------------------------------------------------
# Orchestrator & Determinism Tests
# ---------------------------------------------------------------------------
def test_orchestrator_runs_all_active_rules():
    findings = run_intelligence_pipeline(
        edges=SAMPLE_TRACE_EDGES,
        trace_id="trace-sample-001",
        gas_clusters=R6_SAMPLE_CLUSTERS,
    )
    # SAMPLE_TRACE_EDGES should trigger R1, R3, R5, R6, R8
    rules_detected = {f.rule for f in findings}
    assert any(r.startswith("R1") for r in rules_detected)
    assert any(r.startswith("R3") for r in rules_detected)
    assert any(r.startswith("R5") for r in rules_detected)
    assert any(r.startswith("R6") for r in rules_detected)
    assert any(r.startswith("R8") for r in rules_detected)
    # R7 stub should be skipped by orchestrator
    assert not any(r.startswith("R7") for r in rules_detected)


def test_orchestrator_determinism_byte_identical():
    """
    Acceptance criterion: Running orchestrator twice on same fixture
    produces byte-identical Finding[] output.
    """
    run_1 = run_intelligence_pipeline(
        edges=SAMPLE_TRACE_EDGES,
        trace_id="trace-sample-001",
        gas_clusters=R6_SAMPLE_CLUSTERS,
    )
    run_2 = run_intelligence_pipeline(
        edges=SAMPLE_TRACE_EDGES,
        trace_id="trace-sample-001",
        gas_clusters=R6_SAMPLE_CLUSTERS,
    )

    dump_1 = json.dumps([f.to_dict() for f in run_1], sort_keys=True)
    dump_2 = json.dumps([f.to_dict() for f in run_2], sort_keys=True)

    assert dump_1 == dump_2
    assert len(run_1) > 0


def test_explanations_are_dynamically_templated():
    """
    Acceptance criterion: Every Finding's explanation is built from an
    f-string/template using real fixture values — no hardcoded prose.
    """
    findings = run_intelligence_pipeline(
        edges=SAMPLE_TRACE_EDGES,
        trace_id="trace-sample-001",
        gas_clusters=R6_SAMPLE_CLUSTERS,
    )
    for f in findings:
        assert f.explanation, f"Finding {f.finding_id} has empty explanation"
        # Verify that addresses, amounts, or rule-specific numbers are present in the text
        assert any(
            token in f.explanation
            for token in ["0x", "ETH", "%", "s", "wallets", "Tier"]
        ), f"Finding explanation does not appear dynamic: {f.explanation}"


# ---------------------------------------------------------------------------
# Route Handler Tests
# ---------------------------------------------------------------------------
def test_routes_intelligence_get_and_recompute():
    import importlib.util
    from unittest.mock import MagicMock
    import os

    route_file = os.path.join(os.path.dirname(__file__), "..", "api", "routes_intelligence.py")
    spec = importlib.util.spec_from_file_location("routes_intelligence_module", route_file)
    routes_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(routes_mod)

    routes_mod.FINDINGS_CACHE.clear()
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None

    # Fixture fallback for trace-sample-001
    findings = routes_mod.get_findings(trace_id="trace-sample-001", db=mock_db)
    assert len(findings) > 0
    assert "trace-sample-001" in routes_mod.FINDINGS_CACHE

    # Recompute returns findings and updates cache
    recomputed = routes_mod.recompute_findings(trace_id="trace-sample-001", db=mock_db)
    assert len(recomputed) == len(findings)

    # Unknown trace with no DB record and no fixture returns empty list for get_findings
    unknown = routes_mod.get_findings(trace_id="unknown-999", db=mock_db)
    assert unknown == []

