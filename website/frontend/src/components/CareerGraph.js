import { useEffect, useRef, useState, useCallback } from 'react';
import './CareerGraph.css';

/* ─── Load D3 from CDN ─────────────────────────────────── */
const loadD3 = () =>
  new Promise((resolve) => {
    if (window.d3) { resolve(window.d3); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js';
    s.onload = () => resolve(window.d3);
    document.head.appendChild(s);
  });

/* ─── Graph data ───────────────────────────────────────── */
const NODES = [
  { id: 'robotack',       label: 'Robotack',        type: 'company',   size: 28, color: '#8b7cf8' },
  { id: 'just-lab',       label: 'JUST Lab',         type: 'company',   size: 22, color: '#8b7cf8' },
  { id: 'just-uni',       label: 'JUST University',  type: 'education', size: 24, color: '#60a5fa' },
  { id: 'robochat',       label: 'Robochat',         type: 'project',   size: 26, color: '#34d399' },
  { id: 'chatbot-builder',label: 'Chatbot Builder',  type: 'project',   size: 20, color: '#34d399' },
  { id: 'mflp',           label: 'MFLP',             type: 'project',   size: 18, color: '#34d399' },
  { id: 'portfolio',      label: 'This Portfolio',   type: 'project',   size: 22, color: '#34d399' },
  { id: 'java',           label: 'Java 21',          type: 'skill',     size: 24, color: '#f472b6' },
  { id: 'spring',         label: 'Spring Boot',      type: 'skill',     size: 22, color: '#f472b6' },
  { id: 'postgres',       label: 'PostgreSQL',       type: 'skill',     size: 18, color: '#f472b6' },
  { id: 'redis',          label: 'Redis',            type: 'skill',     size: 16, color: '#f472b6' },
  { id: 'react',          label: 'React',            type: 'skill',     size: 18, color: '#f472b6' },
  { id: 'docker',         label: 'Docker',           type: 'skill',     size: 16, color: '#f472b6' },
  { id: 'meta-api',       label: 'Meta API',         type: 'skill',     size: 16, color: '#f472b6' },
  { id: 'nlp',            label: 'NLP',              type: 'skill',     size: 16, color: '#f472b6' },
  { id: 'websocket',      label: 'WebSocket',        type: 'skill',     size: 15, color: '#f472b6' },
  { id: 'liquibase',      label: 'Liquibase',        type: 'skill',     size: 14, color: '#f472b6' },
  { id: 'team-lead',      label: 'Team Lead',        type: 'role',      size: 20, color: '#fbbf24' },
  { id: 'backend-dev',    label: 'Backend Dev',      type: 'role',      size: 18, color: '#fbbf24' },
  { id: 'germany',        label: '🇩🇪 Germany',      type: 'goal',      size: 20, color: '#fb923c' },
  { id: 'senior-role',    label: 'Senior Role',      type: 'goal',      size: 18, color: '#fb923c' },
];

const LINKS = [
  { source: 'robotack',       target: 'robochat',        label: 'built at' },
  { source: 'robotack',       target: 'chatbot-builder', label: 'built at' },
  { source: 'just-lab',       target: 'mflp',            label: 'built at' },
  { source: 'robotack',       target: 'portfolio',       label: 'working on' },
  { source: 'robochat',       target: 'java' },
  { source: 'robochat',       target: 'spring' },
  { source: 'robochat',       target: 'redis' },
  { source: 'robochat',       target: 'websocket' },
  { source: 'robochat',       target: 'meta-api' },
  { source: 'robochat',       target: 'postgres' },
  { source: 'chatbot-builder',target: 'react' },
  { source: 'chatbot-builder',target: 'spring' },
  { source: 'mflp',           target: 'nlp' },
  { source: 'portfolio',      target: 'react' },
  { source: 'portfolio',      target: 'spring' },
  { source: 'spring',         target: 'java',     label: 'requires' },
  { source: 'liquibase',      target: 'postgres', label: 'manages' },
  { source: 'just-uni',       target: 'java',     label: 'learned' },
  { source: 'just-uni',       target: 'nlp',      label: 'researched' },
  { source: 'robotack',       target: 'team-lead',   label: 'promoted to' },
  { source: 'just-lab',       target: 'backend-dev', label: 'role' },
  { source: 'team-lead',      target: 'germany',     label: 'aiming for' },
  { source: 'team-lead',      target: 'senior-role', label: 'targeting' },
];

const LEGEND_TYPES = [
  { type: 'company',   color: '#8b7cf8', label: 'Company' },
  { type: 'education', color: '#60a5fa', label: 'Education' },
  { type: 'project',   color: '#34d399', label: 'Project' },
  { type: 'skill',     color: '#f472b6', label: 'Skill' },
  { type: 'role',      color: '#fbbf24', label: 'Role' },
  { type: 'goal',      color: '#fb923c', label: 'Goal' },
];

const FILTER_OPTIONS = ['All', 'Skills', 'Projects', 'Companies'];

/* ─── Component ────────────────────────────────────────── */
export default function CareerGraph({ onBack }) {
  const svgRef       = useRef(null);
  const wrapRef      = useRef(null);
  const simRef       = useRef(null);
  const [d3Ready, setD3Ready]       = useState(false);
  const [d3Error, setD3Error]       = useState(false);
  const [filter, setFilter]         = useState('All');
  const [tooltip, setTooltip]       = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  /* Build a lookup for connections */
  const getConnections = useCallback((nodeId) => {
    return LINKS.filter(
      (l) => l.source === nodeId || l.target === nodeId ||
             (l.source.id && (l.source.id === nodeId || l.target.id === nodeId))
    );
  }, []);

  /* Load D3 */
  useEffect(() => {
    loadD3()
      .then(() => setD3Ready(true))
      .catch(() => setD3Error(true));
  }, []);

  /* Build graph once D3 is ready */
  useEffect(() => {
    if (!d3Ready || !svgRef.current || !wrapRef.current) return;

    const d3 = window.d3;
    const wrap = wrapRef.current;
    const W = wrap.clientWidth  || 800;
    const H = wrap.clientHeight || 560;

    /* Deep-clone data so D3 can mutate freely */
    const nodes = NODES.map((n) => ({ ...n }));
    const links = LINKS.map((l) => ({ ...l }));

    /* Clear previous render */
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', W)
      .attr('height', H);

    /* Zoom container */
    const g = svg.append('g');

    const zoom = d3
      .zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => g.attr('transform', event.transform));

    svg.call(zoom);

    /* Simulation */
    const simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide().radius((d) => d.size + 10));

    simRef.current = simulation;

    /* Links */
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'cg-link')
      .attr('stroke', 'var(--border)')
      .attr('stroke-opacity', 0.45)
      .attr('stroke-width', 1.2);

    /* Node groups */
    const nodeG = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'cg-node')
      .call(
        d3
          .drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      );

    /* Circles */
    nodeG
      .append('circle')
      .attr('r', (d) => d.size)
      .attr('fill', (d) => d.color)
      .attr('fill-opacity', 0.85)
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.4);

    /* Labels */
    nodeG
      .append('text')
      .attr('class', 'cg-node-label')
      .attr('dy', (d) => d.size + 13)
      .attr('text-anchor', 'middle')
      .text((d) => d.label.length > 14 ? d.label.slice(0, 13) + '…' : d.label);

    /* Hover — tooltip */
    nodeG
      .on('mousemove', (event, d) => {
        const conns = getConnections(d.id);
        setTooltip({
          x: event.clientX + 14,
          y: event.clientY - 10,
          label: d.label,
          type: d.type,
          connections: conns.length,
        });
      })
      .on('mouseleave', () => setTooltip(null));

    /* Click — highlight connected nodes */
    nodeG.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode((prev) => (prev === d.id ? null : d.id));
    });

    /* Double-click — zoom in */
    nodeG.on('dblclick', (event, d) => {
      event.stopPropagation();
      const transform = d3.zoomIdentity
        .translate(W / 2 - d.x * 2, H / 2 - d.y * 2)
        .scale(2);
      svg.transition().duration(500).call(zoom.transform, transform);
    });

    /* Click on background to deselect */
    svg.on('click', () => setSelectedNode(null));

    /* Tick */
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      nodeG.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [d3Ready, getConnections]);

  /* React to filter & selectedNode changes to update visual state */
  useEffect(() => {
    if (!d3Ready || !svgRef.current) return;
    const d3 = window.d3;
    const svg = d3.select(svgRef.current);

    const filterTypeMap = {
      All: null,
      Skills: 'skill',
      Projects: 'project',
      Companies: 'company',
    };
    const filterType = filterTypeMap[filter];

    /* Collect connected IDs for selectedNode */
    let connectedIds = new Set();
    if (selectedNode) {
      connectedIds.add(selectedNode);
      LINKS.forEach((l) => {
        const sid = typeof l.source === 'object' ? l.source.id : l.source;
        const tid = typeof l.target === 'object' ? l.target.id : l.target;
        if (sid === selectedNode) connectedIds.add(tid);
        if (tid === selectedNode) connectedIds.add(sid);
      });
    }

    svg.selectAll('.cg-node').attr('opacity', (d) => {
      if (filterType && d.type !== filterType) return 0.1;
      if (selectedNode && !connectedIds.has(d.id)) return 0.12;
      return 1;
    });

    svg.selectAll('.cg-link').attr('stroke-opacity', (d) => {
      const sid = typeof d.source === 'object' ? d.source.id : d.source;
      const tid = typeof d.target === 'object' ? d.target.id : d.target;
      if (filterType && (d.source.type !== filterType && d.target.type !== filterType)) return 0.06;
      if (selectedNode) {
        return (sid === selectedNode || tid === selectedNode) ? 0.9 : 0.06;
      }
      return 0.45;
    }).attr('stroke', (d) => {
      const sid = typeof d.source === 'object' ? d.source.id : d.source;
      const tid = typeof d.target === 'object' ? d.target.id : d.target;
      if (selectedNode && (sid === selectedNode || tid === selectedNode)) return 'var(--accent)';
      return 'var(--border)';
    });
  }, [filter, selectedNode, d3Ready]);

  return (
    <div className="cg-page">
      {/* Header */}
      <header className="cg-header">
        <div className="cg-header-left">
          <button className="cg-back" onClick={onBack}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
            Back
          </button>
          <div>
            <h2 className="cg-title">The Dependency Graph of Me</h2>
            <p className="cg-subtitle">Drag nodes · Click to highlight · Scroll to zoom · Double-click to focus</p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="cg-filters">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f}
            className={`cg-filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => { setFilter(f); setSelectedNode(null); }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="cg-canvas-wrap" ref={wrapRef}>
        {!d3Ready && !d3Error && (
          <div className="cg-loading">
            <div className="cg-spinner" />
            Loading graph…
          </div>
        )}
        {d3Error && (
          <div className="cg-loading">Failed to load D3. Check your internet connection.</div>
        )}
        <svg ref={svgRef} />
      </div>

      {/* Legend */}
      <div className="cg-legend">
        {LEGEND_TYPES.map((lt) => (
          <div className="cg-legend-item" key={lt.type}>
            <span className="cg-legend-dot" style={{ background: lt.color }} />
            {lt.label}
          </div>
        ))}
      </div>

      {/* Tooltip (portal-style, fixed position) */}
      {tooltip && (
        <div
          className="cg-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="cg-tooltip-label">{tooltip.label}</div>
          <div className="cg-tooltip-type">{tooltip.type}</div>
          <div className="cg-tooltip-connections">{tooltip.connections} connection{tooltip.connections !== 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
}
