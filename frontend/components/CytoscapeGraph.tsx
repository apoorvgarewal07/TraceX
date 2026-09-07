import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw, Download } from 'lucide-react';

interface GraphNode {
  data: {
    id: string;
    label: string;
    type?: string; // victim, exchange, mixer, mule, attacker
    riskScore?: number;
    address?: string;
  };
}

interface GraphEdge {
  data: {
    id?: string;
    source: string;
    target: string;
    label?: string;
    amount?: string;
    tx_hash?: string;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface CytoscapeGraphProps {
  data?: GraphData;
  onNodeClick?: (nodeId: string, nodeData: any) => void;
  height?: string;
}

export const CytoscapeGraph: React.FC<CytoscapeGraphProps> = ({
  data = { nodes: [], edges: [] },
  onNodeClick,
  height = '580px',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    let cyInstance: any;

    const initGraph = async () => {
      const cytoscape = (await import('cytoscape')).default;
      const dagre = (await import('cytoscape-dagre')).default;
      
      try {
        cytoscape.use(dagre);
      } catch (e) {
        // already registered
      }

      // Safe elements clone
      const elements = [
        ...(data.nodes || []).map((n) => ({
          group: 'nodes' as const,
          data: {
            id: n.data.id,
            label: n.data.label || n.data.id.substring(0, 8),
            type: n.data.type || 'mule',
            riskScore: n.data.riskScore ?? 0.5,
            address: n.data.address || n.data.id,
          },
        })),
        ...(data.edges || []).map((e, idx) => ({
          group: 'edges' as const,
          data: {
            id: e.data.id || `edge_${idx}`,
            source: e.data.source,
            target: e.data.target,
            label: e.data.label || `${e.data.amount || ''}`,
            amount: e.data.amount || '',
            tx_hash: e.data.tx_hash || '',
          },
        })),
      ];

      cyInstance = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': (ele: any) => {
                const type = (ele.data('type') || '').toLowerCase();
                if (type === 'victim') return '#ef4444'; // Red
                if (type === 'exchange') return '#10b981'; // Green
                if (type === 'mixer') return '#f59e0b'; // Amber
                if (type === 'attacker') return '#e11d48'; // Crimson
                if (type === 'mule') return '#8b5cf6'; // Purple
                return '#64748b'; // Slate
              },
              'border-width': 2,
              'border-color': '#0f172a',
              label: 'data(label)',
              'text-valign': 'bottom',
              'text-margin-y': 6,
              'font-size': 11,
              'font-family': 'Inter, sans-serif',
              'font-weight': 'bold',
              color: '#f8fafc',
              'text-outline-width': 2,
              'text-outline-color': '#0b0f19',
              width: (ele: any) => 36 + (ele.data('riskScore') || 0.5) * 16,
              height: (ele: any) => 36 + (ele.data('riskScore') || 0.5) * 16,
            },
          },
          {
            selector: 'node:selected',
            style: {
              'border-width': 4,
              'border-color': '#38bdf8',
              'shadow-blur': 15,
              'shadow-color': '#38bdf8',
            },
          },
          {
            selector: 'edge',
            style: {
              width: 2.5,
              'line-color': '#475569',
              'target-arrow-color': '#64748b',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'arrow-scale': 1.2,
              label: 'data(label)',
              'text-rotation': 'autorotate',
              'text-margin-y': -8,
              'font-size': 9,
              color: '#94a3b8',
              'text-background-color': '#0f172a',
              'text-background-opacity': 0.85,
              'text-background-padding': '2px',
              'text-background-shape': 'roundrectangle',
            },
          },
          {
            selector: '.faded',
            style: {
              opacity: 0.15,
            },
          },
          {
            selector: '.highlighted',
            style: {
              opacity: 1.0,
              'line-color': '#38bdf8',
              'target-arrow-color': '#38bdf8',
              'border-color': '#38bdf8',
              'border-width': 3,
            },
          },
        ],
        layout: {
          name: 'dagre',
          rankDir: 'LR',
          nodeSep: 60,
          rankSep: 100,
          animate: true,
          animationDuration: 500,
        },
      });

      cyRef.current = cyInstance;

      // Event Handlers
      cyInstance.on('tap', 'node', (evt: any) => {
        const node = evt.target;
        setSelectedNodeId(node.id());

        if (onNodeClick) {
          onNodeClick(node.id(), node.data());
        }

        // Highlight neighborhood
        cyInstance.elements().addClass('faded').removeClass('highlighted');
        node.removeClass('faded').addClass('highlighted');
        node.neighborhood().removeClass('faded').addClass('highlighted');
      });

      cyInstance.on('tap', (evt: any) => {
        if (evt.target === cyInstance) {
          setSelectedNodeId(null);
          cyInstance.elements().removeClass('faded').removeClass('highlighted');
        }
      });
    };

    initGraph();

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [data, onNodeClick]);

  // Controls
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 40);
  const handleReset = () => {
    if (cyRef.current) {
      cyRef.current.elements().removeClass('faded').removeClass('highlighted');
      cyRef.current.layout({ name: 'dagre', rankDir: 'LR', nodeSep: 60, rankSep: 100 }).run();
      cyRef.current.fit(undefined, 40);
    }
  };

  const handleExportPNG = () => {
    if (cyRef.current) {
      const png64 = cyRef.current.png({ full: true, scale: 2, bg: '#0b0f19' });
      const a = document.createElement('a');
      a.href = png64;
      a.download = `forensic_graph_${Date.now()}.png`;
      a.click();
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#070b14] shadow-2xl">
      {/* Legend Header */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2 glass-panel px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-700/60 shadow-lg">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
          <span className="text-slate-300">Victim</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" />
          <span className="text-slate-300">Attacker</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
          <span className="text-slate-300">Mixer</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
          <span className="text-slate-300">Mule Node</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
          <span className="text-emerald-400 font-bold">Exchange / VASP</span>
        </div>
      </div>

      {/* Floating Canvas Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1 glass-panel p-1 rounded-xl border border-slate-700/60 shadow-lg">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFit}
          title="Fit to Screen"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Reset Layout"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={handleExportPNG}
          title="Export Graph Image"
          className="p-1.5 text-cyan-400 hover:text-white hover:bg-cyan-900/50 rounded-lg transition"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={{ width: '100%', height }} className="cursor-grab active:cursor-grabbing" />

      {(!data.nodes || data.nodes.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#070b14]/90">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-medium">Synthesizing multi-hop forensic graph...</p>
          </div>
        </div>
      )}
    </div>
  );
};
