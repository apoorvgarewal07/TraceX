/**
 * TEMPORARY STUB — remove when Person 1's backend endpoints:
 *   - GET /api/v1/cases/:caseId/gas-parent-clusters
 *   - GET /api/v1/cases/:caseId/cross-complaint-matches
 *   - GET /api/v1/cases/:caseId/exits
 * are confirmed live. See T10 in execution package.
 *
 * WAIT FOR PERSON 1: /gas-parent-clusters
 * WAIT FOR PERSON 1: /cross-complaint-matches
 * WAIT FOR PERSON 1: /exits
 */

export type VaspTier = 'Tier A' | 'Tier B' | 'Tier C';

export interface ExitDetail {
  exit_id: string;
  wallet: string;
  vasp_name: string;
  tier: VaspTier;
  evidence_ids: string[];
  confidence: number;
}

export interface GasParentCluster {
  cluster_id: string;
  funding_wallet: string;
  funded_wallets: string[];
  evidence_ids: string[];
}

export interface CrossComplaintMatch {
  matched_case_id: string;
  shared_wallet_or_parent: string;
  confidence: number;
  matched_source?: 'NCRP' | 'Sahyog' | 'State Portal';
  matched_date?: string;
  case_status?: string;
}

export const STUB_EXITS: ExitDetail[] = [
  {
    exit_id: 'exit-binance-001',
    wallet: '0x28c6c06298d514db089934071355e5743bf21d60',
    vasp_name: 'Binance (Hot Wallet 6 / FIU Registered)',
    tier: 'Tier A',
    evidence_ids: ['sha256:exit-binance-001', 'sha256:tx-0x9a8f4c'],
    confidence: 0.99,
  },
  {
    exit_id: 'exit-kucoin-002',
    wallet: '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b',
    vasp_name: 'KuCoin (Deposit Aggregator / Seychelles)',
    tier: 'Tier B',
    evidence_ids: ['sha256:exit-kucoin-002', 'sha256:tx-0x12dc77'],
    confidence: 0.92,
  },
  {
    exit_id: 'exit-mixer-tornado-003',
    wallet: '0xd90e2f925da726b50c4ed8d0fb90ad053324f31b',
    vasp_name: 'Tornado.Cash 100 ETH Privacy Pool',
    tier: 'Tier C',
    evidence_ids: ['sha256:exit-tornado-003'],
    confidence: 0.98,
  },
];

export const STUB_GAS_CLUSTERS: GasParentCluster[] = [
  {
    cluster_id: 'cluster-gas-euler-01',
    funding_wallet: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
    funded_wallets: [
      '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
      '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    ],
    evidence_ids: ['sha256:gas-cluster-euler-001', 'sha256:gas-cluster-euler-002'],
  },
  {
    cluster_id: 'cluster-gas-relayer-02',
    funding_wallet: '0x1a9c8182c09f50c8318d769245bea52c32be35bc',
    funded_wallets: [
      '0x4838b106fce9647bdf1e7877bf73ce8b0bad5f97',
      '0x5a0b54d5dc17e0aadc383d2db43b0a0d3e029c4c',
    ],
    evidence_ids: ['sha256:gas-cluster-relayer-001'],
  },
];

export const STUB_CROSS_COMPLAINT_MATCHES: CrossComplaintMatch[] = [
  {
    matched_case_id: 'NCRP-2024-MH-883921',
    shared_wallet_or_parent: '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
    confidence: 0.95,
    matched_source: 'NCRP',
    matched_date: '2024-03-12',
    case_status: 'UNDER_INVESTIGATION',
  },
  {
    matched_case_id: 'SAHYOG-BLR-2024-0044',
    shared_wallet_or_parent: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
    confidence: 0.89,
    matched_source: 'Sahyog',
    matched_date: '2024-03-15',
    case_status: 'FREEZE_ORDER_SERVED',
  },
  {
    matched_case_id: 'CYBER-DELHI-2024-1102',
    shared_wallet_or_parent: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    confidence: 0.91,
    matched_source: 'State Portal',
    matched_date: '2024-03-18',
    case_status: 'FIR_REGISTERED',
  },
];

export const intelligenceVizStub = {
  async getExits(_caseId: string): Promise<ExitDetail[]> {
    return [...STUB_EXITS];
  },
  async getGasParentClusters(_caseId: string): Promise<GasParentCluster[]> {
    return [...STUB_GAS_CLUSTERS];
  },
  async getCrossComplaintMatches(_caseId: string): Promise<CrossComplaintMatch[]> {
    return [...STUB_CROSS_COMPLAINT_MATCHES];
  },
};
