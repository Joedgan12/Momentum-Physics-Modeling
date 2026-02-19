import React, { useRef, useEffect, useState } from 'react';
import {
  shortenPlayerName,
  getPlayerAbbreviation,
  detectSimilarNames,
} from '../utils/playerNameUtils';

/* ── Field constants ── */
const FW = 105; // metres as SVG units
const FH = 68;

/* ── Demo roster (pre-sim) ── */
const DEMO_PLAYERS = [
  { id: 'A1', name: 'Ederson Moraes', number: 31, team: 'A', x: 5, y: 34, pmu: 18, position: 'GK' },
  { id: 'A2', name: 'Joao Cancelo', number: 27, team: 'A', x: 22, y: 12, pmu: 26, position: 'LB' },
  { id: 'A3', name: 'Ruben Dias', number: 3, team: 'A', x: 20, y: 28, pmu: 24, position: 'CB' },
  { id: 'A4', name: 'John Stones', number: 5, team: 'A', x: 20, y: 40, pmu: 23, position: 'CB' },
  { id: 'A5', name: 'Kyle Walker', number: 2, team: 'A', x: 22, y: 56, pmu: 25, position: 'RB' },
  {
    id: 'A6',
    name: 'Rodri Hernandez',
    number: 16,
    team: 'A',
    x: 38,
    y: 34,
    pmu: 30,
    position: 'DM',
  },
  { id: 'A7', name: 'Phil Foden', number: 47, team: 'A', x: 48, y: 22, pmu: 34, position: 'CM' },
  {
    id: 'A8',
    name: 'Kevin De Bruyne',
    number: 17,
    team: 'A',
    x: 48,
    y: 46,
    pmu: 32,
    position: 'CM',
  },
  { id: 'A9', name: 'Jack Grealish', number: 10, team: 'A', x: 68, y: 14, pmu: 38, position: 'LW' },
  {
    id: 'A10',
    name: 'Bernardo Silva',
    number: 20,
    team: 'A',
    x: 68,
    y: 54,
    pmu: 36,
    position: 'RW',
  },
  {
    id: 'A11',
    name: 'Erling Haaland',
    number: 9,
    team: 'A',
    x: 80,
    y: 30,
    pmu: 45,
    position: 'ST',
  },

  { id: 'B1', name: 'David de Gea', number: 1, team: 'B', x: 100, y: 34, pmu: 17, position: 'GK' },
  { id: 'B2', name: 'Luke Shaw', number: 23, team: 'B', x: 83, y: 12, pmu: 22, position: 'LB' },
  {
    id: 'B3',
    name: 'Victor Lindelof',
    number: 2,
    team: 'B',
    x: 85,
    y: 28,
    pmu: 25,
    position: 'CB',
  },
  {
    id: 'B4',
    name: 'Raphael Varane',
    number: 19,
    team: 'B',
    x: 85,
    y: 40,
    pmu: 24,
    position: 'CB',
  },
  {
    id: 'B5',
    name: 'Aaron Wan-Bissaka',
    number: 29,
    team: 'B',
    x: 83,
    y: 56,
    pmu: 21,
    position: 'RB',
  },
  {
    id: 'B6',
    name: 'Scott McTominay',
    number: 39,
    team: 'B',
    x: 67,
    y: 34,
    pmu: 28,
    position: 'DM',
  },
  {
    id: 'B7',
    name: 'Bruno Fernandes',
    number: 18,
    team: 'B',
    x: 57,
    y: 22,
    pmu: 30,
    position: 'CM',
  },
  {
    id: 'B8',
    name: 'Christian Eriksen',
    number: 14,
    team: 'B',
    x: 57,
    y: 46,
    pmu: 29,
    position: 'CM',
  },
  { id: 'B9', name: 'Antony Silva', number: 21, team: 'B', x: 38, y: 20, pmu: 35, position: 'FW' },
  {
    id: 'B10',
    name: 'Marcus Rashford',
    number: 10,
    team: 'B',
    x: 38,
    y: 48,
    pmu: 33,
    position: 'FW',
  },
];

/* ── Team colors ── */
const A_COL = '#3b82f6'; /* blue  */
const B_COL = '#f472b6'; /* pink  */

/* ── Scale helper ── */
const pR = (pmu) => Math.max(1.0, 1.0 + (pmu / 100) * 1.8);
const hR = (pmu) => Math.max(7, 7 + (pmu / 100) * 22);

export default function Pitch({
  players = [],
  teamAPressure = {},
  teamBPressure = {},
  showHeat = true,
}) {
  const roster = players?.length ? players : DEMO_PLAYERS;

  /* top-3 per team for heatspot rendering */
  const topA = [...roster.filter((p) => p.team === 'A')]
    .sort((a, b) => (b.pmu || 0) - (a.pmu || 0))
    .slice(0, 3);
  const topB = [...roster.filter((p) => p.team === 'B')]
    .sort((a, b) => (b.pmu || 0) - (a.pmu || 0))
    .slice(0, 3);
  const hotspots = [...topA, ...topB];

  /* hover tooltip */
  const [hovered, setHovered] = useState(null);

  return (
    <div className="pitch-card">
      <div className="pitch-header">
        <div className="pitch-title">Field — Live Tactical View</div>
        <div className="pitch-sub">dot size = PMU · glow = pressure zone</div>
      </div>

      <svg className="pitch-svg" viewBox={`0 0 ${FW} ${FH}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Deep dark turf */}
          <linearGradient id="turfGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0a1f12" />
            <stop offset="50%" stopColor="#0d2416" />
            <stop offset="100%" stopColor="#081a0f" />
          </linearGradient>

          {/* Stripe pattern */}
          <pattern id="stripes" x="0" y="0" width="10" height={FH} patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="5" height={FH} fill="#0a1f12" />
            <rect x="5" y="0" width="5" height={FH} fill="#0d2416" />
          </pattern>

          {/* Soft glow filter */}
          <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Strong glow for high-PMU players */}
          <filter id="glow-strong" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Hotspot radial gradients */}
          {hotspots.map((h) => (
            <radialGradient key={h.id} id={`hg-${h.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={h.team === 'A' ? A_COL : B_COL} stopOpacity={0.38} />
              <stop offset="45%" stopColor={h.team === 'A' ? A_COL : B_COL} stopOpacity={0.12} />
              <stop offset="100%" stopColor={h.team === 'A' ? A_COL : B_COL} stopOpacity={0} />
            </radialGradient>
          ))}

          {/* Player aura gradients */}
          {roster.map((p) => (
            <radialGradient key={`rg-${p.id}`} id={`rg-${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={p.team === 'A' ? A_COL : B_COL} stopOpacity={0.55} />
              <stop offset="100%" stopColor={p.team === 'A' ? A_COL : B_COL} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>

        {/* ── Base turf ── */}
        <rect x="0" y="0" width={FW} height={FH} fill="url(#stripes)" />
        <rect x="0" y="0" width={FW} height={FH} fill="url(#turfGrad)" opacity={0.35} />

        {/* ── Pitch markings ── */}
        {/* Boundary */}
        <rect
          x="0"
          y="0"
          width={FW}
          height={FH}
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="0.45"
        />

        {/* Centre line */}
        <line
          x1={FW / 2}
          y1="0"
          x2={FW / 2}
          y2={FH}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="0.4"
        />

        {/* Centre circle */}
        <circle
          cx={FW / 2}
          cy={FH / 2}
          r="9.15"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="0.35"
          fill="none"
        />

        {/* Centre spot */}
        <circle cx={FW / 2} cy={FH / 2} r="0.45" fill="rgba(255,255,255,0.6)" />

        {/* Penalty areas */}
        <rect
          x="0"
          y={FH / 2 - 20.15}
          width="16.5"
          height="40.3"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="0.35"
          fill="none"
        />
        <rect
          x={FW - 16.5}
          y={FH / 2 - 20.15}
          width="16.5"
          height="40.3"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="0.35"
          fill="none"
        />

        {/* 6-yard boxes */}
        <rect
          x="0"
          y={FH / 2 - 9}
          width="5.5"
          height="18"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.3"
          fill="none"
        />
        <rect
          x={FW - 5.5}
          y={FH / 2 - 9}
          width="5.5"
          height="18"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.3"
          fill="none"
        />

        {/* Penalty spots */}
        <circle cx="11" cy={FH / 2} r="0.4" fill="rgba(255,255,255,0.45)" />
        <circle cx={FW - 11} cy={FH / 2} r="0.4" fill="rgba(255,255,255,0.45)" />

        {/* Goal lines */}
        <line
          x1="0"
          y1={FH / 2 - 3.66}
          x2="-1.5"
          y2={FH / 2 - 3.66}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="0.5"
        />
        <line
          x1="0"
          y1={FH / 2 + 3.66}
          x2="-1.5"
          y2={FH / 2 + 3.66}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="0.5"
        />
        <line
          x1={FW}
          y1={FH / 2 - 3.66}
          x2={FW + 1.5}
          y2={FH / 2 - 3.66}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="0.5"
        />
        <line
          x1={FW}
          y1={FH / 2 + 3.66}
          x2={FW + 1.5}
          y2={FH / 2 + 3.66}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="0.5"
        />

        {/* ── Pressure heatspots ── */}
        {showHeat &&
          hotspots.map((h) => (
            <circle key={`hs-${h.id}`} cx={h.x} cy={h.y} r={hR(h.pmu)} fill={`url(#hg-${h.id})`} />
          ))}

        {/* ── Player aura rings ── */}
        {roster.map((p) => (
          <circle
            key={`aura-${p.id}`}
            cx={p.x}
            cy={p.y}
            r={pR(p.pmu) + 2}
            fill={`url(#rg-${p.id})`}
          />
        ))}

        {/* ── Player dots ── */}
        {roster.map((p) => {
          const col = p.team === 'A' ? A_COL : B_COL;
          const r = pR(p.pmu);
          const high = (p.pmu || 0) > 40;
          return (
            <g
              key={p.id}
              className="player-group"
              transform={`translate(${p.x},${p.y})`}
              onMouseEnter={() => setHovered(p)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'crosshair' }}
            >
              {/* outer pulse ring */}
              <circle
                r={r + 1.2}
                fill="none"
                stroke={col}
                strokeWidth={0.4}
                opacity={0.35}
                filter={high ? 'url(#glow-strong)' : undefined}
              />
              {/* filled dot */}
              <circle
                r={r}
                fill={col}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={0.2}
                filter={high ? 'url(#glow)' : undefined}
              />
              {/* label - show shortened name */}
              <text
                x={r + 0.7}
                y={3.0}
                fontSize={2.0}
                fill="rgba(255,255,255,0.88)"
                fontWeight="700"
                style={{ fontFamily: 'Inter, sans-serif', pointerEvents: 'none' }}
              >
                {getPlayerAbbreviation(p.name)}
              </text>
              <title>{`${p.name} #${p.number} [${p.team}] PMU ${
                p.pmu?.toFixed ? p.pmu.toFixed(1) : '—'
              }`}</title>
            </g>
          );
        })}

        {/* ── Hover tooltip ── */}
        {hovered && (
          <g
            transform={`translate(${Math.min(hovered.x + 3, FW - 20)},${Math.max(
              hovered.y - 8,
              2,
            )})`}
          >
            <rect
              x="0"
              y="0"
              width="26"
              height="11"
              rx="1.5"
              fill="rgba(13,18,32,0.9)"
              stroke="rgba(0,229,160,0.4)"
              strokeWidth="0.3"
            />
            <text
              x="1.5"
              y="3.8"
              fontSize="2.6"
              fill="#eef2ff"
              fontWeight="700"
              style={{ fontFamily: 'Inter, sans-serif', pointerEvents: 'none' }}
            >
              {shortenPlayerName(hovered.name, 'medium')} #{hovered.number}
            </text>
            <text
              x="1.5"
              y="7.2"
              fontSize="2.0"
              fill="rgba(120,140,180,0.9)"
              style={{ fontFamily: 'Inter, sans-serif', pointerEvents: 'none' }}
            >
              {hovered.position} · PMU {hovered.pmu?.toFixed ? hovered.pmu.toFixed(1) : '—'}
            </text>
          </g>
        )}
      </svg>

      {/* ── Legend ── */}
      <div className="pitch-legend">
        <div className="legend-item">
          <div
            className="legend-dot"
            style={{ background: A_COL, boxShadow: `0 0 6px ${A_COL}` }}
          />
          Team A
        </div>
        <div className="legend-item">
          <div
            className="legend-dot"
            style={{ background: B_COL, boxShadow: `0 0 6px ${B_COL}` }}
          />
          Team B
        </div>
        <div className="legend-item">
          <div
            className="legend-dot"
            style={{
              background:
                'radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(244,114,182,0.6) 100%)',
            }}
          />
          Pressure zone
        </div>
      </div>
    </div>
  );
}
