/**
 * TEMPORARY STUB — remove when Person 1's backend endpoints:
 *   - POST /api/v1/cases/:caseId/evidence/export
 *   - POST /api/v1/cases/:caseId/evidence/verify
 *   - GET /api/v1/cases/:caseId/manifest
 * are confirmed live. See T11 in execution package.
 *
 * WAIT FOR PERSON 1: /evidence/export
 * WAIT FOR PERSON 1: /evidence/verify
 * WAIT FOR PERSON 1: /manifest
 * WAIT FOR PERSON 1: reworked freeze-notice
 */

export interface EvidenceFileItem {
  name: string;
  size: number;
  content: string;
  sha256: string;
  description: string;
}

export interface EvidenceManifest {
  bundle_id: string;
  case_id: string;
  created_at: string;
  file_count: number;
  total_size_bytes: number;
  overall_merkle_root: string;
  hashes: Record<string, string>;
}

export interface EvidenceBundle {
  manifest: EvidenceManifest;
  files: EvidenceFileItem[];
}

export interface EvidenceMismatch {
  filename: string;
  expected_sha256: string;
  actual_sha256: string;
  status: 'HASH_MISMATCH' | 'FILE_CORRUPTED' | 'MISSING_FILE';
}

export interface EvidenceVerificationResult {
  valid: boolean;
  checked_at: string;
  verified_file_count: number;
  mismatches: EvidenceMismatch[];
}

export interface NoticeDraftPayload {
  case_id: string;
  vasp_name: string;
  target_wallet: string;
  terminal_tx_hash?: string;
  attributed_amount?: string;
  investigating_officer?: string;
  agency_ref?: string;
}

export interface NoticeDraftResult {
  draft_id: string;
  created_at: string;
  notice_text: string;
  target_vasp: string;
  target_wallet: string;
  disclaimer: string;
}

// Utility: Compute real SHA-256 hex string using browser Web Crypto API
export async function computeSha256Hex(content: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Lightweight fallback in non-browser env
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0;
  }
  return `sha256_mock_${Math.abs(hash).toString(16).padStart(64, '0')}`;
}

export const evidenceStub = {
  async exportEvidence(caseId: string): Promise<{ bundle_id: string; download_url: string; bundle: EvidenceBundle }> {
    const file1Content = JSON.stringify(
      {
        dossier_id: caseId,
        chain: 'ETH',
        fraud_tx: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d0123456789abcdef01234567',
        trace_timestamp: new Date().toISOString(),
        hops_analyzed: 4,
        status: 'COMPLETED',
      },
      null,
      2
    );

    const file2Content = JSON.stringify(
      [
        {
          finding_id: 'FINDING-R1-0',
          rule: 'R1_RAPID_PASSTHROUGH',
          severity: 'high',
          evidence_ids: ['sha256:edge-euler-001', 'sha256:edge-euler-002'],
          explanation: '95.4% of funds passed through intermediary wallet within 184 seconds.',
        },
        {
          finding_id: 'FINDING-R5-0',
          rule: 'R5_PRIVACY_PROTOCOL_INTERACTION',
          severity: 'high',
          evidence_ids: ['sha256:mixer-interaction-001'],
          explanation: 'Direct deposit into Tornado.Cash 100 ETH Privacy Pool detected.',
        },
        {
          finding_id: 'FINDING-R8-0',
          rule: 'R8_EXCHANGE_TERMINATION',
          severity: 'high',
          evidence_ids: ['sha256:exit-binance-001'],
          explanation: 'Stolen funds deposited into Binance Hot Wallet 6 (Tier A VASP).',
        },
      ],
      null,
      2
    );

    const file3Content = `LOG_ID: AUDIT-TRACE-${caseId}\nTIMESTAMP: ${new Date().toISOString()}\nOPERATOR_ROLE: INVESTIGATOR\nALGORITHM: FIFO_ATTRIBUTION\nVALIDATION: DETERMINISTIC_RULES_PASSED`;

    const [hash1, hash2, hash3] = await Promise.all([
      computeSha256Hex(file1Content),
      computeSha256Hex(file2Content),
      computeSha256Hex(file3Content),
    ]);

    const files: EvidenceFileItem[] = [
      {
        name: 'trace_ledger_manifest.json',
        size: file1Content.length,
        content: file1Content,
        sha256: hash1,
        description: 'Chronological EVM transaction hops and FIFO taint attribution tables',
      },
      {
        name: 'deterministic_rule_findings.json',
        size: file2Content.length,
        content: file2Content,
        sha256: hash2,
        description: 'Intelligence Engine R1-R8 deterministic mathematical rule evaluations',
      },
      {
        name: 'chain_of_custody_audit.log',
        size: file3Content.length,
        content: file3Content,
        sha256: hash3,
        description: 'Read-only query audit trail and cryptographic signature manifest',
      },
    ];

    const combinedHashes = `${hash1}:${hash2}:${hash3}`;
    const merkleRoot = await computeSha256Hex(combinedHashes);
    const bundleId = `bundle-sha256-${merkleRoot.slice(0, 16)}`;

    const manifest: EvidenceManifest = {
      bundle_id: bundleId,
      case_id: caseId,
      created_at: new Date().toISOString(),
      file_count: files.length,
      total_size_bytes: files.reduce((acc, f) => acc + f.size, 0),
      overall_merkle_root: merkleRoot,
      hashes: {
        'trace_ledger_manifest.json': hash1,
        'deterministic_rule_findings.json': hash2,
        'chain_of_custody_audit.log': hash3,
      },
    };

    const bundle: EvidenceBundle = { manifest, files };

    // Create client download URL for json bundle
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);

    return {
      bundle_id: bundleId,
      download_url: downloadUrl,
      bundle,
    };
  },

  async verifyEvidence(bundle: EvidenceBundle): Promise<EvidenceVerificationResult> {
    const mismatches: EvidenceMismatch[] = [];
    const files = bundle.files || [];
    const expectedHashes = bundle.manifest?.hashes || {};

    for (const file of files) {
      const expected = expectedHashes[file.name] || file.sha256;
      const actual = await computeSha256Hex(file.content);

      if (expected !== actual) {
        mismatches.push({
          filename: file.name,
          expected_sha256: expected,
          actual_sha256: actual,
          status: 'HASH_MISMATCH',
        });
      }
    }

    return {
      valid: mismatches.length === 0,
      checked_at: new Date().toISOString(),
      verified_file_count: files.length,
      mismatches,
    };
  },

  async generateNoticeDraft(payload: NoticeDraftPayload): Promise<NoticeDraftResult> {
    const draftId = `notice-draft-${Date.now()}`;
    const disclaimer =
      'DRAFT NOTICE PROPOSAL: Prepared solely for statutory review by an authorized officer under relevant procedural laws (e.g. CrPC s. 91 / BNSS s. 94). This document does not constitute a judicial warrant, has no automatic legal effect, and implies no judicial finding of guilt or liability.';

    const noticeText = `INVESTIGATIVE INFORMATION REQUEST / FREEZE DIRECTIVE DRAFT
Reference Case ID: ${payload.case_id}
Agency Docket: ${payload.agency_ref || 'NCRP-COMPLAINT-REF'}
Draft Generated: ${new Date().toISOString()}

TO: Compliance & Legal Department, ${payload.vasp_name}

1. In connection with an active inquiry regarding reported unauthorized crypto asset transfers:
   - Target Identified Address / Deposit UID: ${payload.target_wallet}
   - Attributed Flow Proceeds: ${payload.attributed_amount || 'Amount attributed to fraud transaction'}
   - Associated Transaction Reference: ${payload.terminal_tx_hash || 'Verified EVM transaction hash'}

2. You are requested to examine records relating to the above identified wallet/UID under applicable reporting procedures and preserve audit logs.

3. NOTICE CLARIFICATION:
   This document is an administrative draft prepared for investigator review. It does not carry self-executing court authority and requires endorsement by an authorized officer.

Investigating Officer: ${payload.investigating_officer || 'Authorized IO'}`;

    return {
      draft_id: draftId,
      created_at: new Date().toISOString(),
      notice_text: noticeText,
      target_vasp: payload.vasp_name,
      target_wallet: payload.target_wallet,
      disclaimer,
    };
  },
};
