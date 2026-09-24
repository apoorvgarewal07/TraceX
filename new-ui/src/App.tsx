import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ForensicCase } from './types';
import { api, BackendTraceDetail } from './api/client';
import { buildForensicCaseFromBackend } from './utils/graphAdapter';
import { useWebSocket } from './hooks/useWebSocket';

import { LoginPage } from './pages/LoginPage';
import { CaseListPage } from './pages/CaseListPage';
import { CaseCreatePage } from './pages/CaseCreatePage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { ForbiddenPage } from './pages/ForbiddenPage';

function AppRoutes() {
  const navigate = useNavigate();
  const [hasActiveSession, setHasActiveSession] = useState<boolean>(false);
  const [currentCase, setCurrentCase] = useState<ForensicCase | null>(null);
  const [activeHop, setActiveHop] = useState<number>(0);
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [activeTraceId, setActiveTraceId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [pinnedAddresses, setPinnedAddresses] = useState<Set<string>>(new Set());
  const [lastBackendDetail, setLastBackendDetail] = useState<BackendTraceDetail | null>(null);

  // Real-time WebSocket connection to backend forensics engine
  const { status: traceStatus, progress: traceProgress, latestHop } = useWebSocket(activeTraceId, {
    onHopDiscovered: (_hop, _progress) => {
      // When a hop is discovered live, optionally fetch intermediate detail
      if (activeTraceId) {
        api
          .getTrace(activeTraceId)
          .then((detail) => {
            if (detail && detail.hops && detail.hops.length > 0) {
              setLastBackendDetail(detail);
              const partialCase = buildForensicCaseFromBackend(
                detail,
                currentCase?.chain || 'ETH',
                currentCase?.ncrpDocketNumber,
                pinnedAddresses
              );
              setCurrentCase(partialCase);
            }
          })
          .catch(() => {});
      }
    },
    onTraceCompleted: async () => {
      if (activeTraceId) {
        try {
          const detail = await api.getTrace(activeTraceId);
          setLastBackendDetail(detail);
          const adaptedCase = buildForensicCaseFromBackend(
            detail,
            currentCase?.chain || 'ETH',
            currentCase?.ncrpDocketNumber,
            pinnedAddresses
          );
          setCurrentCase(adaptedCase);
          const maxH =
            adaptedCase.edges.length > 0
              ? Math.max(...adaptedCase.edges.map((e) => e.hopIndex))
              : 1;
          setActiveHop(maxH);
        } catch (e) {
          console.error('[App] Error fetching completed trace detail:', e);
        }
      }
      setIsExecuting(false);
    },
    onTraceFailed: (error) => {
      console.warn('[App] Real-time trace failed:', error);
      setIsExecuting(false);
    },
  });

  const handlePinNode = (address: string) => {
    const addrLower = address.toLowerCase();
    const nextPinned = new Set<string>(pinnedAddresses);
    nextPinned.add(addrLower);
    setPinnedAddresses(nextPinned);

    if (lastBackendDetail) {
      const adapted = buildForensicCaseFromBackend(
        lastBackendDetail,
        currentCase?.chain || 'ETH',
        currentCase?.ncrpDocketNumber,
        nextPinned
      );
      setCurrentCase(adapted);
    } else {
      // Support promotion in mock/preset cases
      setCurrentCase((prevCase) => {
        if (!prevCase) return null;
        let promotedWallet: any = null;
        let targetClusterHop = 2;

        const updatedNodes = prevCase.nodes.map((n) => {
          if (n.entityType === 'cluster' && n.clusteredNodes) {
            const found = n.clusteredNodes.find(
              (cn) => cn.address.toLowerCase() === addrLower
            );
            if (found) {
              targetClusterHop = n.hopIndex;
              promotedWallet = {
                ...found,
                id: found.id || `promoted-${addrLower.slice(0, 8)}`,
                isPinned: true,
                x: n.x,
                y: Math.max(80, n.y - 100),
              };
              const remaining = n.clusteredNodes.filter(
                (cn) => cn.address.toLowerCase() !== addrLower
              );
              return {
                ...n,
                label: `+ ${remaining.length} Dispersed Wallets`,
                clusteredNodes: remaining,
                y: n.y + 30,
              };
            }
          }
          return n;
        });

        if (promotedWallet) {
          const updatedEdges = [...prevCase.edges];
          const srcSiphon = updatedNodes.find((n) => n.hopIndex === targetClusterHop - 1);
          const tgtConsolidator = updatedNodes.find((n) => n.hopIndex === targetClusterHop + 1);

          if (srcSiphon && !updatedEdges.some((e) => e.target === promotedWallet.id)) {
            updatedEdges.push({
              id: `edge-pin-${srcSiphon.id}-${promotedWallet.id}`,
              source: srcSiphon.id,
              target: promotedWallet.id,
              txHash: `0xpin${Math.random().toString(36).slice(2, 12)}`,
              amountCrypto: promotedWallet.volumeOut || '3.50 ETH',
              token: prevCase.token || 'ETH',
              amountINR: promotedWallet.fiatEquivalentINR || '₹9,10,000',
              timestamp: 'On-chain',
              delayFromPrevious: `Hop ${targetClusterHop}`,
              hopIndex: targetClusterHop,
              gasFee: '0.0021 ETH',
              resolved: true,
            });
          }
          if (tgtConsolidator && !updatedEdges.some((e) => e.source === promotedWallet.id)) {
            updatedEdges.push({
              id: `edge-pin-${promotedWallet.id}-${tgtConsolidator.id}`,
              source: promotedWallet.id,
              target: tgtConsolidator.id,
              txHash: `0xpin${Math.random().toString(36).slice(2, 12)}`,
              amountCrypto: promotedWallet.volumeOut || '3.50 ETH',
              token: prevCase.token || 'ETH',
              amountINR: promotedWallet.fiatEquivalentINR || '₹9,10,000',
              timestamp: 'On-chain',
              delayFromPrevious: `Hop ${targetClusterHop + 1}`,
              hopIndex: targetClusterHop + 1,
              gasFee: '0.0021 ETH',
              resolved: true,
            });
          }

          return {
            ...prevCase,
            nodes: [...updatedNodes, promotedWallet],
            edges: updatedEdges,
          };
        }
        return prevCase;
      });
    }
  };

  const handleSelectCase = (selectedCase: ForensicCase) => {
    setActiveTraceId(null);
    setLastBackendDetail(null);
    setPinnedAddresses(new Set<string>());
    // Explicitly tag demo/preset dataset so it's visibly marked as simulation
    const taggedCase: ForensicCase = {
      ...selectedCase,
      ncrpDocketNumber: selectedCase.ncrpDocketNumber.startsWith('[SIMULATION]')
        ? selectedCase.ncrpDocketNumber
        : `[SIMULATION] ${selectedCase.ncrpDocketNumber}`,
    };
    setCurrentCase(taggedCase);
    setHasActiveSession(true);
    setActiveHop(0);
    setIsTracing(false);
    navigate(`/cases/${taggedCase.id}`);
  };

  const handleResetTrace = () => {
    setActiveHop(0);
    setIsTracing(false);
  };

  // Fallback simulator for offline/demo operation when backend is not reached
  const handleCustomSearchFallback = (
    address: string,
    chain: string = 'Ethereum (ETH)',
    complaintId?: string
  ) => {
    const docket = complaintId ? `[SIMULATION] ${complaintId}` : `[SIMULATION] NCRP/2024/${Math.floor(10000 + Math.random() * 90000)}`;
    const shortAddr = address.slice(0, 8);
    const customCase: ForensicCase = {
      id: `custom-sim-${Date.now()}`,
      ncrpDocketNumber: docket,
      firNumber: `[SIMULATION] FIR ${Math.floor(100 + Math.random() * 900)}/2024`,
      policeStation: 'Special Cyber Crime Cell, New Delhi',
      investigatingOfficer: 'Inspector Vikramaditya Sen',
      rank: 'Inspector of Police (Forensic Cyber)',
      badgeNumber: 'I4C-DEL-7712',
      reportingDate:
        new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' IST',
      crimeCategory: 'Cryptocurrency Fraud & P2P Siphoning',
      complainantName: 'Rameshwar K. & 2 Others',
      stolenAmountCrypto: '48.50 ETH',
      stolenAmountINR: '₹1,26,10,000',
      chain,
      token: 'ETH',
      targetWallet: address,
      riskScore: 91,
      riskSummary:
        'High-velocity dispersal detected from suspect address into intermediate consolidator terminating in FIU-IND registered exchange deposit wallet.',
      exchange: {
        name: 'Binance Holdings Ltd.',
        fiuRegistrationNumber: 'FIU-IND-VDA-2024-0012',
        depositUid: `99${Math.floor(100000 + Math.random() * 900000)}`,
        depositTag: 'MEMO_TARGET_INFLOW',
        kycStatus: 'Verified (PAN + Aadhaar)',
        accountHolderMasked: 'M**** P**** (Thane, Maharashtra)',
        accountAgeDays: 32,
        nodalEmail: 'law-enforcement@binance.com',
        nodalDeskPhone: '+91 11 4982 9100',
        physicalJurisdiction: 'Indian Nodal Compliance Office, Cyber City, Gurugram',
        estimatedRecoverableBalance: '42.20 ETH (₹1,09,72,000)',
        freezeStatus: 'Notice Pending',
        isSimulatedAccountData: true,
      },
      riskFactors: [
        {
          title: 'Direct Link to Active NCRP Report',
          description: 'Address matches open citizen fraud complaints on National Cyber Crime Portal.',
          severity: 'high',
          impactScore: 35,
        },
        {
          title: 'Algorithmic Peeling Chain',
          description: 'Outflow executed within 180 seconds across 2 intermediate transit tiers.',
          severity: 'high',
          impactScore: 32,
        },
        {
          title: 'Registered Exchange Terminal Node',
          description: 'Deposit identified with full Indian KYC documentation.',
          severity: 'low',
          impactScore: 14,
        },
      ],
      investigatorNotes: [
        `Automated forensic probe initiated for target wallet address ${address}.`,
        'Funds originated from victim phishing portal deposit, dispersed through mule accounts.',
        'Immediate statutory Section 91 preservation notice recommended to freeze account assets.',
      ],
      nodes: [
        {
          id: 'custom-victim',
          label: 'Victim Inflow Source',
          address: `0x${address.slice(2, 6)}aaa${address.slice(-34)}`,
          entityType: 'victim',
          risk: 'low',
          balance: '0.00 ETH',
          volumeOut: '48.50 ETH',
          volumeIn: '48.50 ETH',
          fiatEquivalentINR: '₹1,26,10,000',
          x: 80,
          y: 220,
          hopIndex: 0,
          txCount: 1,
          status: 'resolved',
          tags: ['Incident Origin'],
          firstSeen: 'Recent Inflow',
          lastSeen: 'Recent Inflow',
        },
        {
          id: 'custom-mule-1',
          label: 'Target Suspect Wallet',
          address,
          entityType: 'mule',
          risk: 'high',
          balance: '0.82 ETH',
          volumeOut: '47.68 ETH',
          volumeIn: '48.50 ETH',
          fiatEquivalentINR: '₹1,23,96,800',
          x: 340,
          y: 170,
          hopIndex: 1,
          txCount: 12,
          status: 'pending',
          tags: ['Target Address', 'Mule Tier-1'],
          firstSeen: 'Recent Inflow',
          lastSeen: 'Recent Inflow',
        },
        {
          id: 'custom-peel-2a',
          label: 'Peeling Split Sub-Account',
          address: `0x${address.slice(2, 6)}bbb${address.slice(-34)}`,
          entityType: 'peeling',
          risk: 'high',
          balance: '0.12 ETH',
          volumeOut: '45.10 ETH',
          volumeIn: '45.22 ETH',
          fiatEquivalentINR: '₹1,17,26,000',
          x: 600,
          y: 130,
          hopIndex: 2,
          txCount: 6,
          status: 'pending',
          tags: ['94% Traced Stream'],
          firstSeen: 'Recent',
          lastSeen: 'Recent',
        },
        {
          id: 'custom-peel-2b',
          label: 'Mule Fee Cut',
          address: `0x${address.slice(2, 6)}ccc${address.slice(-34)}`,
          entityType: 'peeling',
          risk: 'medium',
          balance: '2.46 ETH',
          volumeOut: '0.00 ETH',
          volumeIn: '2.46 ETH',
          fiatEquivalentINR: '₹6,39,600',
          x: 580,
          y: 330,
          hopIndex: 2,
          txCount: 2,
          status: 'pending',
          tags: ['Commission Cut'],
          firstSeen: 'Recent',
          lastSeen: 'Recent',
        },
        {
          id: 'custom-exchange',
          label: 'Binance Centralized Exchange',
          address: '0x28c6c06298d514db089934071355e5743bf21d60',
          entityType: 'exchange',
          risk: 'medium',
          balance: '45.10 ETH',
          volumeOut: '0.00 ETH',
          volumeIn: '45.10 ETH',
          fiatEquivalentINR: '₹1,17,26,000',
          x: 880,
          y: 220,
          hopIndex: 3,
          txCount: 1,
          status: 'pending',
          tags: ['Identified Exchange', 'PAN/Aadhaar KYC'],
          firstSeen: 'Recent',
          lastSeen: 'Recent',
        },
      ],
      edges: [
        {
          id: 'edge-custom-0-1',
          source: 'custom-victim',
          target: 'custom-mule-1',
          txHash: `0x4a8b${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`,
          amountCrypto: '48.50 ETH',
          token: 'ETH',
          amountINR: '₹1,26,10,000',
          timestamp: 'Recent Block',
          delayFromPrevious: 'Incident Inflow',
          hopIndex: 1,
          gasFee: '0.0021 ETH',
          resolved: false,
        },
        {
          id: 'edge-custom-1-2a',
          source: 'custom-mule-1',
          target: 'custom-peel-2a',
          txHash: `0x7c2d${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`,
          amountCrypto: '45.22 ETH',
          token: 'ETH',
          amountINR: '₹1,17,57,200',
          timestamp: 'Recent Block +4m',
          delayFromPrevious: '+4m 12s',
          hopIndex: 2,
          gasFee: '0.0024 ETH',
          resolved: false,
        },
        {
          id: 'edge-custom-1-2b',
          source: 'custom-mule-1',
          target: 'custom-peel-2b',
          txHash: `0x9e1f${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`,
          amountCrypto: '2.46 ETH',
          token: 'ETH',
          amountINR: '₹6,39,600',
          timestamp: 'Recent Block +4m',
          delayFromPrevious: '+4m 15s',
          hopIndex: 2,
          gasFee: '0.0018 ETH',
          resolved: false,
        },
        {
          id: 'edge-custom-2a-exchange',
          source: 'custom-peel-2a',
          target: 'custom-exchange',
          txHash: `0x1f3a${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`,
          amountCrypto: '45.10 ETH',
          token: 'ETH',
          amountINR: '₹1,17,26,000',
          timestamp: 'Recent Block +9m',
          delayFromPrevious: '+5m 02s',
          hopIndex: 3,
          gasFee: '0.0035 ETH',
          resolved: false,
        },
      ],
    };

    setCurrentCase(customCase);
    setHasActiveSession(true);
    setActiveHop(0);
    setIsTracing(false);
    setIsExecuting(false);
    navigate(`/cases/${customCase.id}`);
  };

  // Primary execution handler: triggers live backend trace, then falls back seamlessly if offline
  const handleExecuteTrace = async (address: string, chain: string, complaintId?: string) => {
    // Initial container for the live investigation (never Euler exploit)
    const initialLiveCase: ForensicCase = {
      id: `trace-live-${Date.now()}`,
      ncrpDocketNumber: complaintId || `CASE-${Date.now().toString().slice(-6)}`,
      firNumber: 'LIVE TRACE IN PROGRESS',
      policeStation: 'Cyber Crime Investigation Division',
      investigatingOfficer: 'Authorized Investigator',
      rank: 'Investigating Officer',
      badgeNumber: 'I4C-ACTIVE',
      reportingDate: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' IST',
      crimeCategory: 'Active On-Chain Asset Trail',
      complainantName: 'Real-time On-Chain Target',
      stolenAmountCrypto: 'Pending Discovery',
      stolenAmountINR: 'Calculating...',
      chain,
      token: chain.includes('Polygon') ? 'MATIC' : 'ETH',
      targetWallet: address,
      riskScore: 0,
      riskSummary: 'Investigative trace initiated. Traversing live on-chain hops...',
      exchange: {
        name: 'Pending Discovery',
        fiuRegistrationNumber: 'N/A',
        depositUid: 'Pending',
        depositTag: 'Pending',
        kycStatus: 'Pending',
        accountHolderMasked: 'Pending',
        accountAgeDays: 0,
        nodalEmail: 'compliance@vasp.int',
        nodalDeskPhone: 'N/A',
        physicalJurisdiction: 'N/A',
        estimatedRecoverableBalance: 'N/A',
        freezeStatus: 'Awaiting Hop Analysis',
      },
      riskFactors: [],
      investigatorNotes: [`Live trace initiated for suspect address: ${address}`],
      nodes: [
        {
          id: 'origin',
          label: 'Suspect Target Wallet',
          address,
          entityType: 'victim',
          risk: 'high',
          balance: 'Querying...',
          volumeOut: '0.00',
          volumeIn: '0.00',
          fiatEquivalentINR: '₹0',
          x: 150,
          y: 300,
          hopIndex: 0,
          txCount: 0,
          status: 'active',
          tags: ['Origin', 'Investigation Target'],
          firstSeen: 'On-chain',
          lastSeen: 'Present',
        },
      ],
      edges: [],
    };
    setCurrentCase(initialLiveCase);
    setHasActiveSession(true);
    navigate(`/cases/${initialLiveCase.id}`);
    setIsExecuting(true);
    setActiveHop(0);
    setIsTracing(false);

    try {
      const resp = await api.startTrace({
        victim_wallet: address,
        chain: chain.includes('Polygon') ? 'POLYGON' : 'ETH',
        complaint_id: complaintId,
      });

      if (resp && resp.trace_id) {
        setActiveTraceId(resp.trace_id);

        // Polling fallback to ensure completion is captured even without active WebSockets
        let attempts = 0;
        const pollInterval = setInterval(async () => {
          attempts += 1;
          try {
            const detail = await api.getTrace(resp.trace_id);
            if (detail && detail.status === 'completed') {
              clearInterval(pollInterval);
              const adaptedCase = buildForensicCaseFromBackend(detail, chain, complaintId);
              setCurrentCase(adaptedCase);
              const maxH = adaptedCase.edges.length > 0
                ? Math.max(...adaptedCase.edges.map((e) => e.hopIndex))
                : 1;
              setActiveHop(maxH);
              setIsExecuting(false);
            } else if (detail && detail.hops && detail.hops.length > 0) {
              const partialCase = buildForensicCaseFromBackend(detail, chain, complaintId);
              setCurrentCase(partialCase);
            }
          } catch {
            // keep polling
          }

          if (attempts > 20) {
            clearInterval(pollInterval);
            setIsExecuting(false);
          }
        }, 1500);

        return;
      }
    } catch (err) {
      console.warn('[App] Backend API offline or unreachable, switching to simulation fallback:', err);
      handleCustomSearchFallback(address, chain, complaintId);
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <CaseListPage
            onExecuteTrace={handleExecuteTrace}
            onSelectCase={handleSelectCase}
            hasActiveSession={hasActiveSession && !!currentCase}
            activeCase={currentCase || undefined}
            onReturnToDashboard={currentCase ? () => navigate(`/cases/${currentCase.id}`) : undefined}
          />
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cases/new" element={<CaseCreatePage />} />
      <Route
        path="/cases/:caseId"
        element={
          <CaseDetailPage
            currentCase={currentCase}
            activeHop={activeHop}
            setActiveHop={setActiveHop}
            isTracing={isTracing}
            setIsTracing={setIsTracing}
            traceStatus={traceStatus}
            traceProgress={traceProgress}
            latestHop={latestHop}
            isExecuting={isExecuting}
            onPinNode={handlePinNode}
            onSelectCase={handleSelectCase}
            onExecuteTrace={handleExecuteTrace}
            onResetTrace={handleResetTrace}
            isNoticeModalOpen={isNoticeModalOpen}
            setIsNoticeModalOpen={setIsNoticeModalOpen}
            isExportModalOpen={isExportModalOpen}
            setIsExportModalOpen={setIsExportModalOpen}
            onNavigateHome={() => navigate('/')}
          />
        }
      />
      <Route path="/unauthorized" element={<ForbiddenPage />} />
      <Route
        path="*"
        element={
          <CaseListPage
            onExecuteTrace={handleExecuteTrace}
            onSelectCase={handleSelectCase}
            hasActiveSession={hasActiveSession && !!currentCase}
            activeCase={currentCase || undefined}
            onReturnToDashboard={currentCase ? () => navigate(`/cases/${currentCase.id}`) : undefined}
          />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
