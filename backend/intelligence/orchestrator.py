"""
Orchestrator for TraceX Intelligence Engine.
Executes deterministic rules R1-R6 + R8 over trace edges.
Guarantees byte-identical, idempotent Finding[] output for identical inputs.
"""

from typing import List, Dict, Any, Optional
from .models import Finding
from .rules import (
    detect_rapid_passthrough,
    detect_peel_chain,
    detect_fan_out,
    detect_fan_in,
    detect_privacy_protocol,
    detect_gas_sponsor_match,
    detect_exchange_exit,
    get_deterministic_timestamp,
)

def run_intelligence_pipeline(
    edges: List[Dict[str, Any]],
    trace_id: str,
    gas_clusters: Optional[List[Dict[str, Any]]] = None,
    exits: Optional[List[Dict[str, Any]]] = None,
    data_mode: str = "LIVE",
    computed_at: Optional[str] = None,
) -> List[Finding]:
    """
    Executes all active deterministic rules (R1-R6, R8; skips R7 stub) over a given trace.
    Returns sorted list of Findings.
    """
    if not edges:
        return []

    timestamp = computed_at or get_deterministic_timestamp(edges)
    all_findings: List[Finding] = []

    # R1: Rapid pass-through
    all_findings.extend(
        detect_rapid_passthrough(
            edges=edges,
            trace_id=trace_id,
            data_mode=data_mode,
            computed_at=timestamp,
        )
    )

    # R2: Peel chain
    all_findings.extend(
        detect_peel_chain(
            edges=edges,
            trace_id=trace_id,
            data_mode=data_mode,
            computed_at=timestamp,
        )
    )

    # R3: Fan-out
    all_findings.extend(
        detect_fan_out(
            edges=edges,
            trace_id=trace_id,
            data_mode=data_mode,
            computed_at=timestamp,
        )
    )

    # R4: Fan-in
    all_findings.extend(
        detect_fan_in(
            edges=edges,
            trace_id=trace_id,
            data_mode=data_mode,
            computed_at=timestamp,
        )
    )

    # R5: Privacy protocol
    all_findings.extend(
        detect_privacy_protocol(
            edges=edges,
            trace_id=trace_id,
            data_mode=data_mode,
            computed_at=timestamp,
        )
    )

    # R6: Gas sponsor match
    if gas_clusters:
        all_findings.extend(
            detect_gas_sponsor_match(
                edges=edges,
                trace_id=trace_id,
                gas_clusters=gas_clusters,
                data_mode=data_mode,
                computed_at=timestamp,
            )
        )

    # R8: Exchange exit
    all_findings.extend(
        detect_exchange_exit(
            edges=edges,
            trace_id=trace_id,
            exits=exits,
            data_mode=data_mode,
            computed_at=timestamp,
        )
    )

    # Sort deterministically by rule then finding_id
    all_findings.sort(key=lambda f: (f.rule, f.finding_id))
    return all_findings
