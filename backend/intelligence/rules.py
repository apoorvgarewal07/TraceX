"""
Deterministic R1-R8 Rule Implementations for TraceX Intelligence Engine.
Pure functions over edges[] contract without external side-effects or LLM dependencies.
"""

import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Set
from .models import Finding

# -----------------------------------------------------------------------------
# Helper Utilities
# -----------------------------------------------------------------------------
def parse_timestamp(ts: Any) -> float:
    """Deterministic conversion of ISO 8601 string or numeric timestamp to epoch seconds."""
    if isinstance(ts, (int, float)):
        return float(ts)
    if isinstance(ts, str):
        # Normalize trailing Z to UTC
        cleaned = ts.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(cleaned)
            return dt.timestamp()
        except Exception:
            pass
    return 0.0

def parse_amount(val: Any) -> float:
    """Extract numeric value from string or float."""
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        try:
            return float(val.strip().split()[0])
        except (ValueError, IndexError):
            return 0.0
    return 0.0

def make_finding_id(rule: str, trace_id: str, edge_ids: List[str]) -> str:
    """Generate deterministic finding_id based on rule name and evidence edge keys."""
    sorted_edges = ":".join(sorted(edge_ids))
    seed = f"{rule}:{trace_id}:{sorted_edges}"
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:8]
    return f"f_{rule.lower()}_{digest}"

def get_deterministic_timestamp(edges: List[Dict[str, Any]]) -> str:
    """Derive deterministic timestamp from latest edge in trace to ensure byte-identical outputs."""
    timestamps = [e.get("timestamp") for e in edges if e.get("timestamp")]
    if timestamps:
        return max(timestamps)
    return "2026-09-24T00:00:00Z"


# -----------------------------------------------------------------------------
# R1: Rapid Pass-Through
# Wallet forwards >=90% of taint_amount within 300s of receiving it in a single outgoing edge.
# -----------------------------------------------------------------------------
def detect_rapid_passthrough(
    edges: List[Dict[str, Any]],
    trace_id: str,
    max_window_seconds: float = 300.0,
    min_passthrough_ratio: float = 0.90,
    data_mode: str = "LIVE",
    computed_at: Optional[str] = None,
) -> List[Finding]:
    findings: List[Finding] = []
    computed_at = computed_at or get_deterministic_timestamp(edges)

    # Group incoming edges by recipient wallet
    in_edges_by_wallet: Dict[str, List[Dict[str, Any]]] = {}
    out_edges_by_wallet: Dict[str, List[Dict[str, Any]]] = {}

    for e in edges:
        from_w = (e.get("from") or "").lower()
        to_w = (e.get("to") or "").lower()
        if to_w:
            in_edges_by_wallet.setdefault(to_w, []).append(e)
        if from_w:
            out_edges_by_wallet.setdefault(from_w, []).append(e)

    for wallet, in_list in in_edges_by_wallet.items():
        out_list = out_edges_by_wallet.get(wallet, [])
        if not out_list:
            continue

        for in_edge in in_list:
            t_in = parse_timestamp(in_edge.get("timestamp"))
            in_taint = parse_amount(in_edge.get("taint_amount") or in_edge.get("value"))
            if in_taint <= 0:
                continue

            for out_edge in out_list:
                t_out = parse_timestamp(out_edge.get("timestamp"))
                delta_t = t_out - t_in

                # Must occur after arrival and within max_window_seconds
                if 0.0 <= delta_t <= max_window_seconds:
                    out_taint = parse_amount(out_edge.get("taint_amount") or out_edge.get("value"))
                    ratio = out_taint / in_taint

                    if ratio >= min_passthrough_ratio:
                        evidence_edges = [in_edge["edge_id"], out_edge["edge_id"]]
                        evidence_ids = [
                            ev for ev in [in_edge.get("evidence_id"), out_edge.get("evidence_id")] if ev
                        ]
                        pct = ratio * 100.0
                        asset = out_edge.get("asset") or in_edge.get("asset") or "ETH"
                        explanation = (
                            f"Rapid pass-through: Wallet {wallet} received {in_taint:.2f} {asset} via tx "
                            f"{in_edge.get('tx_hash', 'N/A')} and forwarded {out_taint:.2f} {asset} ({pct:.1f}%) "
                            f"within {delta_t:.0f}s (threshold: >={min_passthrough_ratio*100:.0f}% within "
                            f"{max_window_seconds:.0f}s) via tx {out_edge.get('tx_hash', 'N/A')}."
                        )
                        finding = Finding(
                            finding_id=make_finding_id("R1_RAPID_PASS_THROUGH", trace_id, evidence_edges),
                            rule="R1_RAPID_PASS_THROUGH",
                            trace_id=trace_id,
                            severity="medium",
                            evidence_edge_ids=evidence_edges,
                            evidence_ids=evidence_ids,
                            explanation=explanation,
                            computed_at=computed_at,
                            data_mode=data_mode,
                        )
                        findings.append(finding)

    # Sort deterministically
    findings.sort(key=lambda f: f.finding_id)
    return findings


# -----------------------------------------------------------------------------
# R2: Peel Chain
# Wallet splits incoming taint into >=3 sequential outgoing edges, each <20% of received taint,
# across consecutive hops from the same source.
# -----------------------------------------------------------------------------
def detect_peel_chain(
    edges: List[Dict[str, Any]],
    trace_id: str,
    min_peels: int = 3,
    max_peel_ratio: float = 0.20,
    data_mode: str = "LIVE",
    computed_at: Optional[str] = None,
) -> List[Finding]:
    findings: List[Finding] = []
    computed_at = computed_at or get_deterministic_timestamp(edges)

    in_edges_by_wallet: Dict[str, List[Dict[str, Any]]] = {}
    out_edges_by_wallet: Dict[str, List[Dict[str, Any]]] = {}

    for e in edges:
        from_w = (e.get("from") or "").lower()
        to_w = (e.get("to") or "").lower()
        if to_w:
            in_edges_by_wallet.setdefault(to_w, []).append(e)
        if from_w:
            out_edges_by_wallet.setdefault(from_w, []).append(e)

    for wallet, in_list in in_edges_by_wallet.items():
        out_list = out_edges_by_wallet.get(wallet, [])
        if len(out_list) < min_peels:
            continue

        # Total incoming taint received by this wallet
        total_in_taint = sum(
            parse_amount(e.get("taint_amount") or e.get("value")) for e in in_list
        )
        if total_in_taint <= 0:
            continue

        # Sort outgoing edges by timestamp then hop
        sorted_outs = sorted(
            out_list,
            key=lambda e: (parse_timestamp(e.get("timestamp")), e.get("hop_number", 0)),
        )

        peel_edges: List[Dict[str, Any]] = []
        for out_edge in sorted_outs:
            out_val = parse_amount(out_edge.get("taint_amount") or out_edge.get("value"))
            ratio = out_val / total_in_taint
            # Condition: each < 20%
            if ratio < max_peel_ratio:
                peel_edges.append(out_edge)

        if len(peel_edges) >= min_peels:
            edge_ids = [e["edge_id"] for e in peel_edges]
            ev_ids = [e.get("evidence_id") for e in peel_edges if e.get("evidence_id")]
            peel_pcts = [
                f"{(parse_amount(e.get('taint_amount') or e.get('value'))/total_in_taint)*100:.1f}%"
                for e in peel_edges
            ]
            asset = peel_edges[0].get("asset") or "ETH"
            explanation = (
                f"Peel chain pattern detected: Wallet {wallet} received {total_in_taint:.2f} {asset} and fragmented "
                f"it into {len(peel_edges)} sequential outgoing transfers (each <{max_peel_ratio*100:.0f}% of total "
                f"received taint: [{', '.join(peel_pcts)}]), characteristic of automated peeling to evade AML detection."
            )
            finding = Finding(
                finding_id=make_finding_id("R2_PEEL_CHAIN", trace_id, edge_ids),
                rule="R2_PEEL_CHAIN",
                trace_id=trace_id,
                severity="high",
                evidence_edge_ids=edge_ids,
                evidence_ids=ev_ids,
                explanation=explanation,
                computed_at=computed_at,
                data_mode=data_mode,
            )
            findings.append(finding)

    findings.sort(key=lambda f: f.finding_id)
    return findings


# -----------------------------------------------------------------------------
# R3: Fan-Out
# Single wallet sends to >=5 distinct addresses within one hop_number.
# -----------------------------------------------------------------------------
def detect_fan_out(
    edges: List[Dict[str, Any]],
    trace_id: str,
    min_targets: int = 5,
    data_mode: str = "LIVE",
    computed_at: Optional[str] = None,
) -> List[Finding]:
    findings: List[Finding] = []
    computed_at = computed_at or get_deterministic_timestamp(edges)

    # Group by (from_wallet, hop_number)
    grouped: Dict[tuple, List[Dict[str, Any]]] = {}
    for e in edges:
        from_w = (e.get("from") or "").lower()
        hop = e.get("hop_number", 1)
        if from_w:
            grouped.setdefault((from_w, hop), []).append(e)

    for (from_w, hop), edge_list in grouped.items():
        distinct_targets: Set[str] = set((e.get("to") or "").lower() for e in edge_list if e.get("to"))
        if len(distinct_targets) >= min_targets:
            edge_ids = [e["edge_id"] for e in edge_list]
            ev_ids = [e.get("evidence_id") for e in edge_list if e.get("evidence_id")]
            total_val = sum(parse_amount(e.get("taint_amount") or e.get("value")) for e in edge_list)
            asset = edge_list[0].get("asset") or "ETH"

            explanation = (
                f"Fan-out dispersion detected: Wallet {from_w} dispersed {total_val:.2f} {asset} across "
                f"{len(distinct_targets)} distinct destination wallets at hop {hop} (threshold: >={min_targets} targets)."
            )
            finding = Finding(
                finding_id=make_finding_id("R3_FAN_OUT", trace_id, edge_ids),
                rule="R3_FAN_OUT",
                trace_id=trace_id,
                severity="medium",
                evidence_edge_ids=edge_ids,
                evidence_ids=ev_ids,
                explanation=explanation,
                computed_at=computed_at,
                data_mode=data_mode,
            )
            findings.append(finding)

    findings.sort(key=lambda f: f.finding_id)
    return findings


# -----------------------------------------------------------------------------
# R4: Fan-In
# >=5 distinct addresses converge into one wallet within a bounded time window (<=1800s).
# -----------------------------------------------------------------------------
def detect_fan_in(
    edges: List[Dict[str, Any]],
    trace_id: str,
    min_sources: int = 5,
    max_window_seconds: float = 1800.0,
    data_mode: str = "LIVE",
    computed_at: Optional[str] = None,
) -> List[Finding]:
    findings: List[Finding] = []
    computed_at = computed_at or get_deterministic_timestamp(edges)

    in_edges_by_wallet: Dict[str, List[Dict[str, Any]]] = {}
    for e in edges:
        to_w = (e.get("to") or "").lower()
        if to_w:
            in_edges_by_wallet.setdefault(to_w, []).append(e)

    for wallet, edge_list in in_edges_by_wallet.items():
        distinct_sources = set((e.get("from") or "").lower() for e in edge_list if e.get("from"))
        if len(distinct_sources) < min_sources:
            continue

        # Sort by timestamp
        sorted_edges = sorted(edge_list, key=lambda e: parse_timestamp(e.get("timestamp")))

        # Check sliding time window for >= min_sources distinct senders
        n = len(sorted_edges)
        for i in range(n):
            window_edges: List[Dict[str, Any]] = []
            t_start = parse_timestamp(sorted_edges[i].get("timestamp"))

            for j in range(i, n):
                t_curr = parse_timestamp(sorted_edges[j].get("timestamp"))
                if t_curr - t_start <= max_window_seconds:
                    window_edges.append(sorted_edges[j])
                else:
                    break

            sources_in_window = set((e.get("from") or "").lower() for e in window_edges if e.get("from"))
            if len(sources_in_window) >= min_sources:
                edge_ids = [e["edge_id"] for e in window_edges]
                ev_ids = [e.get("evidence_id") for e in window_edges if e.get("evidence_id")]
                t_end = parse_timestamp(window_edges[-1].get("timestamp"))
                actual_window = max(t_end - t_start, 0.0)
                total_val = sum(parse_amount(e.get("taint_amount") or e.get("value")) for e in window_edges)
                asset = window_edges[0].get("asset") or "ETH"

                explanation = (
                    f"Fan-in consolidation detected: {len(sources_in_window)} distinct source addresses "
                    f"converged {total_val:.2f} {asset} into consolidator wallet {wallet} within {actual_window:.0f}s "
                    f"(threshold: >={min_sources} sources within {max_window_seconds:.0f}s)."
                )
                finding = Finding(
                    finding_id=make_finding_id("R4_FAN_IN", trace_id, edge_ids),
                    rule="R4_FAN_IN",
                    trace_id=trace_id,
                    severity="high",
                    evidence_edge_ids=edge_ids,
                    evidence_ids=ev_ids,
                    explanation=explanation,
                    computed_at=computed_at,
                    data_mode=data_mode,
                )
                findings.append(finding)
                # Found valid window for this wallet; avoid duplicate window emissions
                break

    findings.sort(key=lambda f: f.finding_id)
    return findings


# -----------------------------------------------------------------------------
# R5: Privacy Protocol
# edge.boundary_type == "MIXER" (or known mixer contract interaction).
# -----------------------------------------------------------------------------
def detect_privacy_protocol(
    edges: List[Dict[str, Any]],
    trace_id: str,
    data_mode: str = "LIVE",
    computed_at: Optional[str] = None,
) -> List[Finding]:
    findings: List[Finding] = []
    computed_at = computed_at or get_deterministic_timestamp(edges)

    for e in edges:
        b_type = (e.get("boundary_type") or "").upper()
        if b_type == "MIXER":
            edge_ids = [e["edge_id"]]
            ev_ids = [e["evidence_id"]] if e.get("evidence_id") else []
            tx_hash = e.get("tx_hash") or "N/A"
            dest = e.get("to") or "unknown mixer contract"
            val = parse_amount(e.get("taint_amount") or e.get("value"))
            asset = e.get("asset") or "ETH"

            explanation = (
                f"Privacy protocol boundary reached: Transaction {tx_hash} transferred {val:.2f} {asset} into "
                f"privacy pool/mixer contract at {dest}, obfuscating cryptographic provenance."
            )
            finding = Finding(
                finding_id=make_finding_id("R5_PRIVACY_PROTOCOL", trace_id, edge_ids),
                rule="R5_PRIVACY_PROTOCOL",
                trace_id=trace_id,
                severity="high",
                evidence_edge_ids=edge_ids,
                evidence_ids=ev_ids,
                explanation=explanation,
                computed_at=computed_at,
                data_mode=data_mode,
            )
            findings.append(finding)

    findings.sort(key=lambda f: f.finding_id)
    return findings


# -----------------------------------------------------------------------------
# R6: Gas Sponsor Match
# >=2 wallets in the trace share the same gas-funding parent.
# Requires Person 1's gas-parent-cluster data.
# -----------------------------------------------------------------------------
def detect_gas_sponsor_match(
    edges: List[Dict[str, Any]],
    trace_id: str,
    gas_clusters: Optional[List[Dict[str, Any]]] = None,
    data_mode: str = "LIVE",
    computed_at: Optional[str] = None,
) -> List[Finding]:
    findings: List[Finding] = []
    if not gas_clusters:
        return findings

    computed_at = computed_at or get_deterministic_timestamp(edges)

    # Collect all unique wallets active in this trace
    trace_wallets: Set[str] = set()
    for e in edges:
        if e.get("from"):
            trace_wallets.add(e["from"].lower())
        if e.get("to"):
            trace_wallets.add(e["to"].lower())

    for cluster in gas_clusters:
        cluster_id = cluster.get("cluster_id") or "cluster_unknown"
        funding_parent = cluster.get("funding_wallet") or "unknown"
        cluster_funded = [w.lower() for w in cluster.get("funded_wallets", [])]

        # Wallets in this cluster that appear in the trace
        matched = [w for w in cluster_funded if w in trace_wallets]

        if len(matched) >= 2:
            # Gather relevant edges involving these matched wallets
            relevant_edge_ids = [
                e["edge_id"]
                for e in edges
                if (e.get("from") or "").lower() in matched or (e.get("to") or "").lower() in matched
            ]
            ev_ids = cluster.get("evidence_ids", [])
            matched_preview = ", ".join(matched[:3]) + (f" (+{len(matched)-3} more)" if len(matched) > 3 else "")

            explanation = (
                f"Common gas sponsor match: {len(matched)} wallets in trace ({matched_preview}) share the same "
                f"native gas-funding parent wallet {funding_parent} (Cluster ID: {cluster_id}), establishing operational linkage."
            )
            finding = Finding(
                finding_id=make_finding_id("R6_GAS_SPONSOR_MATCH", trace_id, relevant_edge_ids or [cluster_id]),
                rule="R6_GAS_SPONSOR_MATCH",
                trace_id=trace_id,
                severity="high",
                evidence_edge_ids=relevant_edge_ids,
                evidence_ids=ev_ids,
                explanation=explanation,
                computed_at=computed_at,
                data_mode=data_mode,
            )
            findings.append(finding)

    findings.sort(key=lambda f: f.finding_id)
    return findings


# -----------------------------------------------------------------------------
# R7: Bytecode Match
# Two contract wallets share identical bytecode hash.
# STATUS: UNCONFIRMED WITH PERSON 1 — Stubbed per T6 specification.
# -----------------------------------------------------------------------------
def detect_bytecode_match(
    edges: List[Dict[str, Any]],
    trace_id: str,
    bytecode_hashes: Optional[Dict[str, str]] = None,
    data_mode: str = "LIVE",
) -> List[Finding]:
    """
    R7 Bytecode match stub.
    STATUS UNCONFIRMED WITH PERSON 1 — Person 1 has not yet confirmed contract bytecode extraction.
    Per T6 execution instructions: do not build this rule's data path; stub with NotImplementedError.
    """
    raise NotImplementedError(
        "R7 Bytecode Match is pending contract agreement with Person 1. "
        "See T6 in TraceX_Person2_Antigravity_Execution_Package.md"
    )


# -----------------------------------------------------------------------------
# R8: Exchange Exit
# edge.boundary_type == "EXCHANGE" AND exit tier is A or B (requires /exits data).
# -----------------------------------------------------------------------------
def detect_exchange_exit(
    edges: List[Dict[str, Any]],
    trace_id: str,
    exits: Optional[List[Dict[str, Any]]] = None,
    data_mode: str = "LIVE",
    computed_at: Optional[str] = None,
) -> List[Finding]:
    findings: List[Finding] = []
    computed_at = computed_at or get_deterministic_timestamp(edges)

    # Create lookup map if external exits list provided
    exits_by_wallet: Dict[str, Dict[str, Any]] = {}
    if exits:
        for ex in exits:
            w = (ex.get("wallet") or "").lower()
            if w:
                exits_by_wallet[w] = ex

    for e in edges:
        b_type = (e.get("boundary_type") or "").upper()
        if b_type != "EXCHANGE":
            continue

        to_wallet = (e.get("to") or "").lower()
        exit_info = exits_by_wallet.get(to_wallet, {})

        tier = (exit_info.get("tier") or e.get("exit_tier") or "").upper()
        vasp_name = exit_info.get("vasp_name") or e.get("vasp_name") or "Regulated VASP"

        # Condition: Exit tier must be A or B
        if tier in ("A", "B"):
            edge_ids = [e["edge_id"]]
            ev_ids = [e["evidence_id"]] if e.get("evidence_id") else []
            if exit_info.get("evidence_ids"):
                ev_ids.extend(exit_info["evidence_ids"])

            val = parse_amount(e.get("taint_amount") or e.get("value"))
            asset = e.get("asset") or "ETH"

            explanation = (
                f"Exchange exit identified: Traversal terminated into {vasp_name} custodial deposit endpoint "
                f"{e.get('to', 'unknown')} receiving {val:.2f} {asset} under confirmed compliance Tier {tier}. "
                f"Subject to Section 91 preservation and freeze directive."
            )
            finding = Finding(
                finding_id=make_finding_id("R8_EXCHANGE_EXIT", trace_id, edge_ids),
                rule="R8_EXCHANGE_EXIT",
                trace_id=trace_id,
                severity="low",  # Low severity / informational: actionable endpoint for recovery
                evidence_edge_ids=edge_ids,
                evidence_ids=ev_ids,
                explanation=explanation,
                computed_at=computed_at,
                data_mode=data_mode,
            )
            findings.append(finding)

    findings.sort(key=lambda f: f.finding_id)
    return findings
