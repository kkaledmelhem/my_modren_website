import { useState, useEffect, useRef, useCallback } from 'react';
import './ArchViz.css';

/* ─── Architecture data ─── */
const ARCHITECTURES = {
  'umniah-chatbot': {
    nodes: [
      { id: 'wa',    label: 'WhatsApp API',        icon: '📱', color: '#25D366', x: 10,  y: 20 },
      { id: 'ig',    label: 'Instagram API',        icon: '📸', color: '#E1306C', x: 10,  y: 60 },
      { id: 'gw',    label: 'Spring Boot Gateway',  icon: '⚙️',  color: 'var(--accent)', x: 35, y: 40 },
      { id: 'df',    label: 'Dialogflow NLP',       icon: '🤖', color: 'var(--teal)',   x: 60, y: 15 },
      { id: 'redis', label: 'Redis Cache',          icon: '⚡', color: '#DC382D', x: 60, y: 42 },
      { id: 'mysql', label: 'MySQL',                icon: '🗄️', color: '#00758F', x: 60, y: 68 },
      { id: 'agent', label: 'Live Agent',           icon: '👤', color: 'var(--muted)', x: 85, y: 40 },
    ],
    edges: [
      { from: 'wa',    to: 'gw'    },
      { from: 'ig',    to: 'gw'    },
      { from: 'gw',    to: 'df'    },
      { from: 'gw',    to: 'redis' },
      { from: 'gw',    to: 'mysql' },
      { from: 'gw',    to: 'agent' },
    ],
  },
  'chatbot-builder': {
    nodes: [
      { id: 'react',  label: 'React UI',           icon: '⚛️',  color: '#61DAFB', x: 10,  y: 40 },
      { id: 'api',    label: 'REST API',            icon: '🔗', color: 'var(--accent)', x: 35, y: 40 },
      { id: 'sec',    label: 'Spring Security',     icon: '🔒', color: 'var(--teal)',   x: 60, y: 20 },
      { id: 'db',     label: 'MySQL Flow Graph',    icon: '🗄️', color: '#00758F', x: 60, y: 55 },
      { id: 'engine', label: 'Flow Engine',         icon: '⚙️',  color: 'var(--muted)', x: 85, y: 40 },
    ],
    edges: [
      { from: 'react',  to: 'api'    },
      { from: 'api',    to: 'sec'    },
      { from: 'api',    to: 'db'     },
      { from: 'api',    to: 'engine' },
      { from: 'db',     to: 'engine' },
    ],
  },
  'legacy-modernization': {
    nodes: [
      { id: 'old',    label: 'Java 8 / Spring 5',   icon: '⚠️', color: '#e74c3c', x: 8,  y: 40 },
      { id: 'shadow', label: 'Shadow Environment',   icon: '🔀', color: 'var(--muted)', x: 35, y: 40 },
      { id: 'new',    label: 'Java 21 / Boot 3',     icon: '✅', color: 'var(--teal)',   x: 60, y: 40 },
      { id: 'docker', label: 'Docker',               icon: '🐳', color: '#2496ED', x: 80, y: 20 },
      { id: 'ci',     label: 'GitHub Actions',       icon: '🚀', color: 'var(--accent)', x: 80, y: 60 },
    ],
    edges: [
      { from: 'old',    to: 'shadow' },
      { from: 'shadow', to: 'new'    },
      { from: 'new',    to: 'docker' },
      { from: 'new',    to: 'ci'     },
    ],
  },
};

/* ─── Node descriptions shown on click ─── */
const NODE_DESCRIPTIONS = {
  wa:     'WhatsApp Business API — receives and sends messages via Meta Graph API webhooks.',
  ig:     'Instagram Graph API — handles DM events from Instagram Business accounts.',
  gw:     'Spring Boot Gateway — central event processor, routes messages to the right service.',
  df:     'Dialogflow ES — NLP engine that classifies user intent and extracts entities.',
  redis:  'Redis — caches active conversation sessions for sub-millisecond reads.',
  mysql:  'MySQL — persists conversation state, flow graphs, and client configuration.',
  agent:  'Live Agent fallback — escalates unresolved conversations to human agents.',
  react:  'React drag-and-drop canvas — lets non-engineers visually build flows.',
  api:    'Spring Boot REST API — CRUD operations on the flow graph data model.',
  sec:    'Spring Security — JWT auth, role-based access for client team members.',
  db:     'MySQL Flow Graph — directed graph of nodes and edges stored relationally.',
  engine: 'Flow Engine — traverses the graph at runtime to determine next bot step.',
  old:    'Legacy stack: Java 8 + Spring 5, reached end-of-life with 17 CVEs.',
  shadow: 'Shadow environment ran both stacks in parallel for 3 weeks to verify parity.',
  new:    'New stack: Java 21 + Spring Boot 3 + virtual threads. 34% faster cold start.',
  docker: 'Docker — containerised deployment with blue-green switch strategy.',
  ci:     'GitHub Actions — automated build, test, and deploy pipeline.',
};

/* ─── Layout constants ─── */
const SVG_H      = 220;   // viewBox height
const NODE_W     = 108;
const NODE_H     = 42;
const CORNER_R   = 8;

/* Convert percent coords to SVG px coords */
function pct(val, total) { return (val / 100) * total; }

/* Build a bezier path string between two node centres */
function buildPath(x1, y1, x2, y2) {
  const cx1 = x1 + (x2 - x1) * 0.45;
  const cx2 = x1 + (x2 - x1) * 0.55;
  return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
}

/* Resolve CSS var colours for glow (SVG filters need real values) */
const CSS_VAR_MAP = {
  'var(--accent)': '#8b7cf8',
  'var(--teal)':   '#34d399',
  'var(--muted)':  'rgba(232,232,240,0.5)',
};
function resolveColor(color) {
  return CSS_VAR_MAP[color] || color;
}

/* ─── Main component ─── */
export default function ArchViz({ projectId }) {
  const arch = ARCHITECTURES[projectId];
  const svgRef   = useRef(null);
  const wrapRef  = useRef(null);

  const [svgW,       setSvgW]       = useState(600);
  const [mounted,    setMounted]    = useState(false);
  const [hovered,    setHovered]    = useState(null);   // node id
  const [activeNode, setActiveNode] = useState(null);   // node id — clicked
  const [tooltip,    setTooltip]    = useState(null);   // { x, y, nodeId }

  /* Observe wrapper width for responsive scaling */
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      if (w > 0) setSvgW(w);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  /* Mount animation trigger */
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /* Reset state when project changes */
  useEffect(() => {
    setHovered(null);
    setActiveNode(null);
    setTooltip(null);
    setMounted(false);
    const id = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(id);
  }, [projectId]);

  /* Close tooltip on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (svgRef.current && !svgRef.current.contains(e.target)) {
        setActiveNode(null);
        setTooltip(null);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  const handleNodeClick = useCallback((node, e) => {
    e.stopPropagation();
    if (activeNode === node.id) {
      setActiveNode(null);
      setTooltip(null);
      return;
    }
    const nx = pct(node.x, svgW) + NODE_W / 2;
    const ny = pct(node.y, SVG_H);
    setActiveNode(node.id);
    setTooltip({ x: nx, y: ny, nodeId: node.id });
  }, [activeNode, svgW]);

  if (!arch) return null;

  const { nodes, edges } = arch;

  /* Pre-compute node centre positions */
  const nodeCentres = {};
  nodes.forEach(n => {
    nodeCentres[n.id] = {
      cx: pct(n.x, svgW) + NODE_W / 2,
      cy: pct(n.y, SVG_H) + NODE_H / 2,
    };
  });

  /* Which edges are connected to hovered/active node */
  const highlightedEdgeIds = new Set();
  const highlightTarget = hovered || activeNode;
  if (highlightTarget) {
    edges.forEach((edge, i) => {
      if (edge.from === highlightTarget || edge.to === highlightTarget) {
        highlightedEdgeIds.add(i);
      }
    });
  }

  /* Tooltip position clamped so it doesn't overflow */
  let ttX = 0, ttY = 0;
  if (tooltip) {
    const ttW = 220, ttH = 70;
    ttX = Math.min(Math.max(tooltip.x - ttW / 2, 4), svgW - ttW - 4);
    ttY = tooltip.y - NODE_H / 2 - ttH - 10;
    if (ttY < 4) ttY = tooltip.y + NODE_H / 2 + 10;
  }

  return (
    <div className="archviz-wrap" ref={wrapRef}>
      <div className="archviz-label">System Architecture</div>

      <div className="archviz-canvas-wrap">
        <svg
          ref={svgRef}
          className="archviz-svg"
          width={svgW}
          height={SVG_H}
          viewBox={`0 0 ${svgW} ${SVG_H}`}
          aria-label="System architecture diagram"
          onClick={() => { setActiveNode(null); setTooltip(null); }}
        >
          <defs>
            {/* Grid pattern */}
            <pattern id="arch-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path
                d="M 24 0 L 0 0 0 24"
                fill="none"
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeOpacity="0.6"
              />
            </pattern>

            {/* Glow filters per unique color */}
            {nodes.map(n => {
              const resolved = resolveColor(n.color);
              return (
                <filter key={`glow-${n.id}`} id={`glow-${n.id}`} x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feFlood floodColor={resolved} floodOpacity="0.6" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              );
            })}

            {/* Arrow marker */}
            <marker
              id="arch-arrow"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M 0 0 L 7 3.5 L 0 7 z" fill="var(--border)" />
            </marker>
            <marker
              id="arch-arrow-hi"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M 0 0 L 7 3.5 L 0 7 z" fill="var(--accent)" />
            </marker>
          </defs>

          {/* Background */}
          <rect width={svgW} height={SVG_H} fill="var(--bg2)" rx="12" />
          <rect width={svgW} height={SVG_H} fill="url(#arch-grid)" rx="12" />

          {/* Edges */}
          {edges.map((edge, i) => {
            const { cx: x1, cy: y1 } = nodeCentres[edge.from] || {};
            const { cx: x2, cy: y2 } = nodeCentres[edge.to]   || {};
            if (x1 == null || x2 == null) return null;
            const isHi = highlightedEdgeIds.has(i);
            return (
              <path
                key={i}
                d={buildPath(x1, y1, x2, y2)}
                fill="none"
                stroke={isHi ? 'var(--accent)' : 'var(--border)'}
                strokeWidth={isHi ? 2 : 1.2}
                strokeOpacity={isHi ? 1 : 0.55}
                markerEnd={isHi ? 'url(#arch-arrow-hi)' : 'url(#arch-arrow)'}
                className={`archviz-edge${isHi ? ' archviz-edge--hi' : ''}`}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const nx  = pct(node.x, svgW);
            const ny  = pct(node.y, SVG_H);
            const isH = hovered === node.id;
            const isA = activeNode === node.id;
            const resolved = resolveColor(node.color);
            const delay = i * 60;

            return (
              <g
                key={node.id}
                className={`archviz-node${mounted ? ' archviz-node--in' : ''}${isH || isA ? ' archviz-node--glow' : ''}`}
                style={{ '--delay': `${delay}ms`, '--node-color': resolved }}
                transform={`translate(${nx}, ${ny})`}
                onPointerEnter={() => setHovered(node.id)}
                onPointerLeave={() => setHovered(null)}
                onClick={(e) => handleNodeClick(node, e)}
                role="button"
                tabIndex={0}
                aria-label={node.label}
                onKeyDown={(e) => e.key === 'Enter' && handleNodeClick(node, e)}
                filter={isH || isA ? `url(#glow-${node.id})` : undefined}
              >
                {/* Card rect */}
                <rect
                  x={0}
                  y={0}
                  width={NODE_W}
                  height={NODE_H}
                  rx={CORNER_R}
                  ry={CORNER_R}
                  fill="var(--card)"
                  stroke={resolved}
                  strokeWidth={isH || isA ? 1.8 : 1}
                  strokeOpacity={isH || isA ? 1 : 0.55}
                />
                {/* Icon */}
                <text
                  x={14}
                  y={NODE_H / 2 + 5}
                  fontSize="14"
                  textAnchor="middle"
                  style={{ userSelect: 'none' }}
                >
                  {node.icon}
                </text>
                {/* Label */}
                <text
                  x={NODE_W / 2 + 6}
                  y={NODE_H / 2 - 1}
                  fontSize="8.5"
                  fontFamily="var(--mono)"
                  fill="var(--text)"
                  fillOpacity="0.9"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip — rendered as HTML over the SVG */}
        {tooltip && (
          <div
            className="archviz-tooltip"
            style={{ left: ttX, top: ttY }}
            role="tooltip"
          >
            <div className="archviz-tooltip-arrow" />
            <p className="archviz-tooltip-text">
              {NODE_DESCRIPTIONS[tooltip.nodeId] || 'No description available.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
