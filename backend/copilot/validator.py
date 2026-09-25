"""
Deterministic Citation Validator for Grounded AI Copilot.
Strips hallucinated citations, ungrounded factual claims, and unauthorized guilt assertions.
Guarantees zero-hallucination turns with deterministic fallback without re-prompting.
"""

import re
from typing import Set, List, Tuple, Optional, Any
from dataclasses import dataclass, field
from backend.copilot.tools import list_findings

# Citation regex matching: [tx:0x...], [edge:e_...], [finding:f_...], [exit:ex_...], [evidence:sha256:...]
CITATION_REGEX = re.compile(
    r'\[(tx|edge|finding|exit|evidence):\s*([a-zA-Z0-9_:.-]+)\]',
    re.IGNORECASE
)

# Factual claim heuristics: sentences containing blockchain primitives or forensic actions
FACTUAL_INDICATORS = [
    re.compile(r'\b0x[a-fA-F0-9]{4,}\b'),                     # Wallet/contract/tx addresses
    re.compile(r'\b\d+(\.\d+)?\s*(ETH|USDT|USDC|BTC|POL)\b', re.IGNORECASE),  # Token amounts
    re.compile(r'\b(forwarded|transferred|dispersed|consolidated|deposited|withdrew|laundered)\b', re.IGNORECASE),
    re.compile(r'\b(peel\s*chain|fan-out|fan-in|rapid\s*pass-through|mixer|privacy\s*pool)\b', re.IGNORECASE),
    re.compile(r'\bhop\s*\d+\b', re.IGNORECASE),
]

# Strict forbidden guilt assertion phrases
GUILT_ASSERTION_PATTERNS = [
    re.compile(r'\b(is|are|was|were)\s+(definitively\s+|proven\s+|found\s+)?guilty\b', re.IGNORECASE),
    re.compile(r'\b(verdict|conviction|ruling)\s+is\s+guilty\b', re.IGNORECASE),
    re.compile(r'\bguilty\s+of\s+(fraud|theft|laundering|scam)\b', re.IGNORECASE),
    re.compile(r'\bdeclare(s)?\s+(the\s+suspect|the\s+wallet|this\s+address)\s+guilty\b', re.IGNORECASE),
]


@dataclass
class ValidationResult:
    cleaned_text: str
    original_text: str
    citations: List[str] = field(default_factory=list)
    stripped_sentences: int = 0
    fallback_triggered: bool = False
    stripped_reasons: List[str] = field(default_factory=list)


def extract_citations(text: str) -> List[Tuple[str, str, str]]:
    """
    Extracts all citations from text.
    Returns list of tuples: (full_match, citation_type, entity_id)
    """
    matches = []
    for m in CITATION_REGEX.finditer(text):
        matches.append((m.group(0), m.group(1).lower(), m.group(2).strip()))
    return matches


def is_factual_sentence(sentence: str) -> bool:
    """Detects whether a sentence makes empirical blockchain or forensic assertions."""
    for pattern in FACTUAL_INDICATORS:
        if pattern.search(sentence):
            return True
    return False


def is_affirmative_guilt_assertion(sentence: str) -> bool:
    """Detects if sentence violates the law-enforcement neutral refusal policy by asserting guilt."""
    # Allow explicit denials/refusals like "I cannot determine guilt", "cannot declare guilt", "not guilty"
    lower = sentence.lower()
    if any(refusal in lower for refusal in [
        "cannot determine guilt",
        "do not determine guilt",
        "cannot declare",
        "not empowered to determine guilt",
        "neither guilty nor innocent",
        "cannot make a legal determination",
        "only the judiciary can determine guilt",
    ]):
        return False

    for pattern in GUILT_ASSERTION_PATTERNS:
        if pattern.search(sentence):
            return True
    return False


def split_into_sentences(text: str) -> List[str]:
    """Splits paragraph into individual sentences while preserving structure."""
    if not text.strip():
        return []
    # Split on terminal punctuation followed by space or newline, or on multiple newlines
    raw_sentences = re.split(r'(?<=[.!?])\s+|\n\n+', text.strip())
    return [s.strip() for s in raw_sentences if s.strip()]


def build_deterministic_fallback(case_id: str, db: Optional[Any] = None) -> str:
    """
    Generates a deterministic summary directly from rule findings
    when an LLM response is stripped of unverified claims.
    """
    findings = list_findings(case_id, db=db)
    if not findings:
        return (
            "Deterministic summary (AI response lacked verified citations): "
            f"No automated rule findings currently flagged for case dossier '{case_id}'."
        )

    lines = [
        "Deterministic summary (AI response lacked verified citations):",
        f"Verified forensic findings for case dossier '{case_id}':"
    ]
    for idx, f in enumerate(findings, 1):
        rule = f.get("rule", "RULE")
        fid = f.get("finding_id", "fid")
        explanation = f.get("explanation", "")
        lines.append(f"{idx}. {rule}: {explanation} [finding:{fid}]")

    return "\n".join(lines)


def validate_citations(
    text: str,
    verified_ids: Set[str],
    case_id: str = "trace-sample-001",
    db: Optional[Any] = None,
) -> ValidationResult:
    """
    Validates all sentences in the text against turn-verified IDs.
    Strips sentences with hallucinated citations, uncited factual claims, or guilt verdicts.
    Triggers deterministic fallback if response becomes empty or invalid.
    """
    if not text or not text.strip():
        fallback = build_deterministic_fallback(case_id, db)
        return ValidationResult(
            cleaned_text=fallback,
            original_text="",
            stripped_sentences=0,
            fallback_triggered=True,
            stripped_reasons=["Empty initial draft"],
        )

    sentences = split_into_sentences(text)
    kept_sentences: List[str] = []
    stripped_count = 0
    stripped_reasons: List[str] = []
    all_valid_citations: List[str] = []

    # Normalize verified IDs for case-insensitive hex comparison
    normalized_verified = {i.lower() for i in verified_ids}

    for s in sentences:
        # Check 1: Forbidden affirmative guilt determination
        if is_affirmative_guilt_assertion(s):
            stripped_count += 1
            stripped_reasons.append(f"Forbidden guilt verdict assertion: '{s}'")
            continue

        citations = extract_citations(s)

        # Check 2: Sentence has citations — check each one
        if citations:
            hallucinated_citation = False
            for full_match, c_type, entity_id in citations:
                if entity_id.lower() not in normalized_verified:
                    hallucinated_citation = True
                    stripped_reasons.append(
                        f"Unverified or hallucinated citation [{c_type}:{entity_id}] in: '{s}'"
                    )
                    break

            if hallucinated_citation:
                stripped_count += 1
                continue
            else:
                # All citations in this sentence are verified
                for full_match, _, _ in citations:
                    all_valid_citations.append(full_match)
                kept_sentences.append(s)

        # Check 3: Sentence has NO citations
        else:
            if is_factual_sentence(s):
                stripped_count += 1
                stripped_reasons.append(f"Uncited factual forensic claim: '{s}'")
                continue
            else:
                # Conversational, disclaimers, or refusal statements survive
                kept_sentences.append(s)

    # If no sentences survived or all factual content was stripped leaving only empty text
    cleaned_body = " ".join(kept_sentences).strip()

    # If the surviving text has zero valid citations and no informative content
    has_substantive_content = len(cleaned_body) > 10 and (
        len(all_valid_citations) > 0 or
        any(k in cleaned_body.lower() for k in ["cannot determine guilt", "data is unavailable", "no data"])
    )

    if not cleaned_body or not has_substantive_content:
        fallback = build_deterministic_fallback(case_id, db)
        return ValidationResult(
            cleaned_text=fallback,
            original_text=text,
            citations=[],
            stripped_sentences=stripped_count,
            fallback_triggered=True,
            stripped_reasons=stripped_reasons,
        )

    return ValidationResult(
        cleaned_text=cleaned_body,
        original_text=text,
        citations=list(dict.fromkeys(all_valid_citations)),
        stripped_sentences=stripped_count,
        fallback_triggered=False,
        stripped_reasons=stripped_reasons,
    )
