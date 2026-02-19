import React, { useState } from 'react';
import { Send, Plus, Minus, CheckCircle, AlertCircle, Sliders } from 'lucide-react';
import AICoach from '../components/AICoach';
import QuickInsights from '../components/QuickInsights';

// ─── preset catalogue ────────────────────────────────────────────────────────
const PRESET_FORMATIONS = {
  '4-3-3': {
    description: 'Classic balanced formation – 4 defenders, 3 midfielders, 3 forwards',
    strengths: ['Very balanced', 'Strong midfield control', 'Good defensive shape'],
    weaknesses: ['Can be predictable', 'Vulnerable to wide play'],
    coherence: 0.87,
    style: 'Versatile',
  },
  '4-4-2': {
    description: 'Traditional two-striker setup with four across the middle',
    strengths: ['Solid midfield line', 'Classic reliability', 'Strong set pieces'],
    weaknesses: ['Limited width', 'Midfield can get overrun'],
    coherence: 0.84,
    style: 'Direct',
  },
  '3-5-2': {
    description: 'Five-man midfield dominance with two spearheads',
    strengths: ['Dominant midfield', 'Wide play options', 'Attacking threat'],
    weaknesses: ['Defensive gaps at back-three', 'Press-vulnerable flanks'],
    coherence: 0.85,
    style: 'Attacking',
  },
  '5-3-2': {
    description: 'Five defenders absorb pressure and counter with pace',
    strengths: ['Solid defence', 'Hard to break down', 'Counter-attack ready'],
    weaknesses: ['Limited attacking options', 'Slow build-up'],
    coherence: 0.86,
    style: 'Defensive',
  },
  '4-2-3-1': {
    description: 'Double pivot shields back-four; attacking trio supports lone striker',
    strengths: ['Solid defensive base', 'Fluid attacking transitions', 'Wide outlets'],
    weaknesses: ['Lone striker isolation', 'Tiring for wide mids'],
    coherence: 0.86,
    style: 'Structured',
  },
  '4-1-4-1': {
    description: 'Single defensive mid protects back-four; flat four plus lone striker',
    strengths: ['Excellent defensive coverage', 'Compact shape', 'Width in midfield'],
    weaknesses: ['Striker out-numbered', 'Slow progression'],
    coherence: 0.83,
    style: 'Defensive',
  },
  '4-3-2-1': {
    description: 'Christmas-tree: narrow attacking trident funnels through a single focal point',
    strengths: ['Central overload', 'Quick transitions', 'Press triggers'],
    weaknesses: ['No width', 'Vulnerable on flanks'],
    coherence: 0.82,
    style: 'Narrow',
  },
  '3-4-3': {
    description: 'High-pressing three-back with four mids and three forwards',
    strengths: ['Intense press', 'Powerful attacking width', 'Fluid wing-backs'],
    weaknesses: ['Exposed on counter', 'Requires high stamina'],
    coherence: 0.8,
    style: 'Aggressive',
  },
  '4-2-4': {
    description: 'Ultra-offensive: four strikers backed by double pivot',
    strengths: ['Maximum attacking threat', 'Overloads last line', 'xG boost'],
    weaknesses: ['Minimal defensive cover', 'Risky if possession lost'],
    coherence: 0.78,
    style: 'Ultra-attack',
  },
};

// ─── pitch visualiser ────────────────────────────────────────────────────────
function FormationPitch({ formation }) {
  const lines = formation.split('-').map(Number);
  const validLines = lines.every((n) => !isNaN(n));
  if (!validLines) return null;

  // Build rows: GK at bottom + outfield lines top-to-bottom (attack → defence)
  const rows = [...lines].reverse(); // reverse so defence is nearest GK
  rows.push(1); // GK row

  const rowCount = rows.length;
  const pitchH = 320;
  const pitchW = 200;
  const yStep = pitchH / (rowCount + 1);

  const players = [];
  rows.forEach((count, rowIdx) => {
    const y = pitchH - (rowIdx + 1) * yStep;
    const xStep = pitchW / (count + 1);
    for (let i = 0; i < count; i++) {
      players.push({ x: xStep * (i + 1), y });
    }
  });

  return (
    <div
      style={{
        position: 'relative',
        width: `${pitchW}px`,
        height: `${pitchH}px`,
        margin: '0 auto',
      }}
    >
      {/* pitch background */}
      <svg width={pitchW} height={pitchH} style={{ position: 'absolute', top: 0, left: 0 }}>
        <rect width={pitchW} height={pitchH} rx="6" fill="#1a3a0e" />
        {/* stripes */}
        {Array.from({ length: 5 }).map((_, i) => (
          <rect key={i} x={0} y={i * 64} width={pitchW} height={32} fill="rgba(255,255,255,0.03)" />
        ))}
        {/* centre circle */}
        <circle
          cx={pitchW / 2}
          cy={pitchH / 2}
          r={28}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />
        {/* half-way line */}
        <line
          x1={0}
          y1={pitchH / 2}
          x2={pitchW}
          y2={pitchH / 2}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />
        {/* goal areas */}
        <rect
          x={pitchW / 2 - 30}
          y={2}
          width={60}
          height={20}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        <rect
          x={pitchW / 2 - 30}
          y={pitchH - 22}
          width={60}
          height={20}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        {/* border */}
        <rect
          x={1}
          y={1}
          width={pitchW - 2}
          height={pitchH - 2}
          rx="5"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
        />
      </svg>
      {/* player dots */}
      {players.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x - 10,
            top: p.y - 10,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: i === players.length - 1 ? '#F59E0B' : 'var(--plasma)',
            border: '2px solid rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            fontWeight: '800',
            color: '#000',
            boxShadow: '0 0 6px rgba(0,0,0,0.5)',
            zIndex: 1,
          }}
        >
          {i === players.length - 1 ? 'GK' : ''}
        </div>
      ))}
    </div>
  );
}

// ─── coherence gauge ─────────────────────────────────────────────────────────
function CoherenceGauge({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? 'var(--success)' : pct >= 78 ? 'var(--plasma)' : 'var(--warning)';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 6px' }}>
        <svg width={80} height={80} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={40} cy={40} r={32} fill="none" stroke="var(--surface-0)" strokeWidth={8} />
          <circle
            cx={40}
            cy={40}
            r={32}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeDasharray={`${2 * Math.PI * 32}`}
            strokeDashoffset={`${2 * Math.PI * 32 * (1 - value)}`}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '16px',
            fontWeight: '800',
            color,
          }}
        >
          {pct}%
        </div>
      </div>
      <div
        style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)',
        }}
      >
        Coherence
      </div>
    </div>
  );
}

// ─── custom builder ──────────────────────────────────────────────────────────
function CustomBuilder({ onApply }) {
  const [lines, setLines] = useState([4, 3, 3]); // default 4-3-3

  const total = lines.reduce((a, b) => a + b, 0);
  const isValid =
    total === 10 && lines.length >= 2 && lines.length <= 5 && lines.every((l) => l >= 1 && l <= 6);
  const formationStr = lines.join('-');

  const addLine = () => {
    if (lines.length < 5) setLines([...lines, 1]);
  };
  const removeLine = (i) => {
    if (lines.length > 2) setLines(lines.filter((_, idx) => idx !== i));
  };
  const changeLine = (i, delta) => {
    const next = [...lines];
    next[i] = Math.max(1, Math.min(6, next[i] + delta));
    setLines(next);
  };

  const validationMsg = !isValid
    ? total !== 10
      ? `Total must be 10 outfield players (currently ${total})`
      : 'Each line must have 1–6 players'
    : null;

  return (
    <div className="panel" style={{ marginBottom: '18px' }}>
      <div className="panel-header">
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sliders size={14} /> Custom Formation Builder
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            color: 'var(--plasma)',
            fontWeight: 800,
          }}
        >
          {formationStr}
        </div>
      </div>

      {/* Line editor — ATTACK is top row, DEFENCE is bottom */}
      <div style={{ marginBottom: '14px' }}>
        <div
          style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            marginBottom: 8,
            textTransform: 'uppercase',
          }}
        >
          Attack ↑ — Defence ↓ (GK fixed)
        </div>
        {lines.map((count, i) => {
          const label = i === 0 ? 'DEF' : i === lines.length - 1 ? 'FWD' : `MID${i > 1 ? i : ''}`;
          return (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}
            >
              <div
                style={{
                  width: 36,
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </div>
              <button
                onClick={() => changeLine(i, -1)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-0)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Minus size={12} />
              </button>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  fontSize: 18,
                  width: 24,
                  textAlign: 'center',
                  color: 'var(--text-primary)',
                }}
              >
                {count}
              </div>
              <button
                onClick={() => changeLine(i, +1)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-0)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={12} />
              </button>
              {/* player pip row */}
              <div style={{ display: 'flex', gap: 3, flex: 1 }}>
                {Array.from({ length: count }).map((_, j) => (
                  <div
                    key={j}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: 'var(--plasma)',
                      opacity: 0.8,
                    }}
                  />
                ))}
              </div>
              {lines.length > 2 && (
                <button
                  onClick={() => removeLine(i)}
                  style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <Minus size={12} />
                </button>
              )}
            </div>
          );
        })}
        {/* GK row (fixed) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.5 }}>
          <div
            style={{
              width: 36,
              fontSize: '10px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
            }}
          >
            GK
          </div>
          <div style={{ width: 26, height: 26 }} />
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: 18,
              width: 24,
              textAlign: 'center',
            }}
          >
            1
          </div>
          <div style={{ width: 26, height: 26 }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
        </div>
      </div>

      {/* Add line button */}
      {lines.length < 5 && (
        <button
          onClick={addLine}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: 'var(--surface-0)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--panel-radius)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 11,
            marginBottom: 12,
          }}
        >
          <Plus size={12} /> Add line
        </button>
      )}

      {/* Total counter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Outfield players:{' '}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: total === 10 ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {total}
          </span>
          <span style={{ color: 'var(--text-muted)' }}> / 10</span>
        </div>
        {validationMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '11px',
              color: 'var(--warning)',
            }}
          >
            <AlertCircle size={12} /> {validationMsg}
          </div>
        )}
      </div>

      <button
        onClick={() => isValid && onApply(formationStr)}
        disabled={!isValid}
        style={{
          width: '100%',
          padding: '10px',
          fontWeight: 800,
          fontSize: 13,
          background: isValid ? 'var(--plasma)' : 'var(--surface-0)',
          color: isValid ? 'var(--void)' : 'var(--text-muted)',
          border: `1px solid ${isValid ? 'var(--plasma)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--panel-radius)',
          cursor: isValid ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {isValid && <CheckCircle size={14} />}
        Apply {formationStr}
      </button>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────
export default function Formations({ selectedFormation, onFormationChange, simResults }) {
  const [tab, setTab] = useState('presets'); // 'presets' | 'custom'

  const isPreset = selectedFormation in PRESET_FORMATIONS;
  const currentDetails = PRESET_FORMATIONS[selectedFormation];

  // Compute coherence for any selection
  function computeLocalCoherence(formation) {
    if (PRESET_FORMATIONS[formation]) return PRESET_FORMATIONS[formation].coherence;
    try {
      const parts = formation.split('-').map(Number);
      if (parts.some(isNaN)) return 0.82;
      const n = parts.length;
      const mean = parts.reduce((a, b) => a + b, 0) / n;
      const variance = parts.reduce((sum, p) => sum + (p - mean) ** 2, 0) / n;
      return Math.max(0.7, Math.min(0.92, 0.88 - 0.015 * Math.abs(n - 3) - variance * 0.018));
    } catch {
      return 0.82;
    }
  }

  const coherence = computeLocalCoherence(selectedFormation);
  const presetList = Object.keys(PRESET_FORMATIONS);

  function handleApplyCustom(formationStr) {
    onFormationChange(formationStr);
    setTab('presets'); // show pitch after applying
  }

  return (
    <div className="page-container">
      <div className="dashboard-body">
        <div style={{ flex: 1 }}>
          {/* Header */}
          <div className="command-header">
            <div className="command-identity">
              <div className="cmd-label">
                <Send size={14} style={{ display: 'inline', marginRight: '6px' }} /> Tactical Setup
              </div>
              <h1 style={{ fontFamily: 'var(--font-mono)' }}>{selectedFormation}</h1>
              <p>{currentDetails?.description || 'Custom formation — edit lines then simulate'}</p>
            </div>
            <CoherenceGauge value={coherence} />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {['presets', 'custom'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '7px 16px',
                  fontWeight: 700,
                  fontSize: 12,
                  background: tab === t ? 'var(--plasma)' : 'var(--surface-1)',
                  color: tab === t ? 'var(--void)' : 'var(--text-muted)',
                  border: `1px solid ${tab === t ? 'var(--plasma)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--panel-radius)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {t === 'presets' ? 'Preset Formations' : '⚙ Custom Builder'}
              </button>
            ))}
          </div>

          {tab === 'presets' && (
            <>
              {/* Formation Selector Grid */}
              <div style={{ marginBottom: '18px' }}>
                <div className="section-title" style={{ marginBottom: '12px', paddingLeft: '0' }}>
                  Select Formation
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '8px',
                  }}
                >
                  {presetList.map((formation) => (
                    <button
                      key={formation}
                      onClick={() => onFormationChange(formation)}
                      style={{
                        padding: '12px 8px',
                        background:
                          selectedFormation === formation ? 'var(--plasma)' : 'var(--surface-1)',
                        color:
                          selectedFormation === formation ? 'var(--void)' : 'var(--text-primary)',
                        border: `1px solid ${
                          selectedFormation === formation ? 'var(--plasma)' : 'var(--border-subtle)'
                        }`,
                        borderRadius: 'var(--panel-radius)',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '13px',
                        fontFamily: 'var(--font-mono)',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {formation}
                      <div
                        style={{
                          fontSize: '9px',
                          marginTop: 4,
                          opacity: 0.7,
                          fontFamily: 'sans-serif',
                        }}
                      >
                        {PRESET_FORMATIONS[formation].style}
                      </div>
                    </button>
                  ))}
                  {/* Show active custom formation as a pill if not a preset */}
                  {!isPreset && (
                    <button
                      style={{
                        padding: '12px 8px',
                        background: 'var(--plasma)',
                        color: 'var(--void)',
                        border: '1px solid var(--plasma)',
                        borderRadius: 'var(--panel-radius)',
                        fontWeight: '700',
                        fontSize: '13px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {selectedFormation}
                      <div
                        style={{
                          fontSize: '9px',
                          marginTop: 4,
                          opacity: 0.7,
                          fontFamily: 'sans-serif',
                        }}
                      >
                        Custom
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Pitch + details side by side */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '220px 1fr',
                  gap: 18,
                  marginBottom: 18,
                }}
              >
                <div
                  className="panel"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 12px',
                  }}
                >
                  <FormationPitch formation={selectedFormation} />
                </div>

                <div>
                  {currentDetails ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div
                        className="panel"
                        style={{ borderLeftWidth: '3px', borderLeftColor: 'var(--plasma)' }}
                      >
                        <div
                          className="section-title"
                          style={{ marginBottom: '12px', color: 'var(--plasma)' }}
                        >
                          Strengths
                        </div>
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: '20px',
                            fontSize: '12px',
                            lineHeight: '1.7',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {currentDetails.strengths.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div
                        className="panel"
                        style={{ borderLeftWidth: '3px', borderLeftColor: 'var(--danger)' }}
                      >
                        <div
                          className="section-title"
                          style={{ marginBottom: '12px', color: 'var(--danger)' }}
                        >
                          Weaknesses
                        </div>
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: '20px',
                            fontSize: '12px',
                            lineHeight: '1.7',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {currentDetails.weaknesses.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="panel"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <CheckCircle size={24} style={{ color: 'var(--success)' }} />
                      <div style={{ fontWeight: 700, fontSize: 14 }}>Custom formation applied</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Coherence score:{' '}
                        <strong style={{ color: 'var(--plasma)' }}>
                          {Math.round(coherence * 100)}%
                        </strong>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Switch to <strong>Custom Builder</strong> tab to adjust
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comparison table */}
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Formation Comparison</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="player-table">
                    <thead>
                      <tr>
                        <th>Formation</th>
                        <th style={{ textAlign: 'center' }}>Style</th>
                        <th style={{ textAlign: 'center' }}>Coherence</th>
                        <th style={{ textAlign: 'left' }}>Best For</th>
                      </tr>
                    </thead>
                    <tbody>
                      {presetList.map((f) => (
                        <tr
                          key={f}
                          onClick={() => onFormationChange(f)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <span
                              className="player-name"
                              style={{
                                fontFamily: 'var(--font-mono)',
                                color: selectedFormation === f ? 'var(--plasma)' : undefined,
                                fontWeight: selectedFormation === f ? 800 : undefined,
                              }}
                            >
                              {f}
                            </span>
                          </td>
                          <td
                            style={{
                              textAlign: 'center',
                              fontSize: '11px',
                              textTransform: 'capitalize',
                            }}
                          >
                            {PRESET_FORMATIONS[f].style}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <code
                              style={{
                                fontWeight: '700',
                                color:
                                  PRESET_FORMATIONS[f].coherence >= 0.85
                                    ? 'var(--success)'
                                    : 'var(--plasma)',
                              }}
                            >
                              {(PRESET_FORMATIONS[f].coherence * 100).toFixed(0)}%
                            </code>
                          </td>
                          <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {PRESET_FORMATIONS[f].strengths[0]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === 'custom' && (
            <>
              <CustomBuilder onApply={handleApplyCustom} />
              <div
                className="panel"
                style={{
                  padding: '14px 16px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                }}
              >
                <strong style={{ color: 'var(--text-primary)' }}>Custom formation rules:</strong>
                <br />• Outfield players must total <strong>10</strong> (GK is always added
                automatically)
                <br />• Each line must have between <strong>1 – 6</strong> players
                <br />• Min <strong>2 lines</strong>, max <strong>5 lines</strong>
                <br />• Coherence is computed automatically from line balance
              </div>
            </>
          )}
        </div>
        <div
          style={{
            width: '300px',
            minWidth: '260px',
            maxWidth: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <AICoach
            matchState={
              simResults
                ? {
                    formation_id: 0,
                    tactic_id: 0,
                    possession_pct: simResults.avgPossession || 50,
                    team_fatigue: simResults.avgTeamFatigue || 50,
                    momentum_pmu: simResults.avgPMU_A || 0,
                    opponent_formation_id: 1,
                    opponent_tactic_id: 0,
                    score_differential: (simResults.goals_a || 0) - (simResults.goals_b || 0),
                  }
                : null
            }
          />
          <QuickInsights simResults={simResults} />
        </div>
      </div>
    </div>
  );
}
