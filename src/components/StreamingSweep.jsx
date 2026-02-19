// ── StreamingSweep.jsx — full dark design system rewrite ──────────────────
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AlertTriangle, Zap, Target, Activity, GitCompare, Award } from 'lucide-react';
import io from 'socket.io-client';
import AICoach from './AICoach';
import QuickInsights from './QuickInsights';

const FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '5-3-2'];
const TACTICS = ['aggressive', 'balanced', 'defensive', 'possession'];

const riskColor = (level) =>
  level === 'CRITICAL'
    ? 'var(--danger)'
    : level === 'HIGH'
      ? '#f97316'
      : level === 'MODERATE'
        ? 'var(--flare)'
        : 'var(--plasma)';
const deltaColor = (v) => (v > 0 ? 'var(--plasma)' : v < 0 ? 'var(--danger)' : 'var(--text-muted)');
const deltaSign = (v) => (v > 0 ? '+' : '');

export default function StreamingSweep({ iterations }) {
  const [sweepResults, setSweepResults] = useState(null);
  const [sweepRunning, setSweepRunning] = useState(false);
  const [sweepError, setSweepError] = useState(null);
  const [rankBy, setRankBy] = useState('xg');
  const [progress, setProgress] = useState(null);
  const [progressLog, setProgressLog] = useState([]);
  const [activeTab, setActiveTab] = useState('recommendations');
  const socketRef = useRef(null);
  const logEndRef = useRef(null);

  // ── WebSocket ──────────────────────────────────────────────────────────────
  useEffect(() => {
    socketRef.current = io('http://localhost:5000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    socketRef.current.on('sweep_progress', (data) => {
      setProgress(data);
      setProgressLog((prev) => [...prev.slice(-19), data]);
    });
    socketRef.current.on('sweep_complete', (data) => {
      setSweepResults(data.result);
      setSweepRunning(false);
    });
    socketRef.current.on('sweep_error', (data) => {
      setSweepError(data.error);
      setSweepRunning(false);
    });
    return () => socketRef.current?.disconnect();
  }, []);

  // ── Auto-scroll log ────────────────────────────────────────────────────────
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progressLog]);

  // ── Run sweep ──────────────────────────────────────────────────────────────
  const handleRunSweep = useCallback(async () => {
    setSweepRunning(true);
    setSweepError(null);
    setSweepResults(null);
    setProgress(null);
    setProgressLog([]);
    try {
      const res = await fetch('/api/sweep/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formation_b: '4-4-2',
          tactic_b: 'balanced',
          scenario: 'Counterfactual Sweep',
          iterations: Math.min(iterations, 300),
          start_minute: 0,
          end_minute: 90,
          crowd_noise: 80.0,
          rank_by: rankBy,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Sweep failed to start');
      socketRef.current?.emit('subscribe_job', { job_id: json.data.job_id });
    } catch (err) {
      setSweepError(err.message);
      setSweepRunning(false);
    }
  }, [iterations, rankBy]);

  // ── Heat matrix helpers ────────────────────────────────────────────────────
  const getMatrixCell = (formation, tactic) =>
    sweepResults?.ranked_scenarios?.find((s) => s.formation === formation && s.tactic === tactic) ||
    null;

  const allXg = sweepResults?.ranked_scenarios?.map((s) => s.metrics.xg) || [];
  const minXg = allXg.length ? Math.min(...allXg) : 0;
  const maxXg = allXg.length ? Math.max(...allXg) : 1;
  const xgNorm = (v) => (maxXg === minXg ? 0.5 : (v - minXg) / (maxXg - minXg));

  const bestResult = sweepResults?.top_3_recommendations?.[0];

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="dashboard-body">
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* ── Command header ── */}
          <div className="command-header" style={{ marginBottom: '14px' }}>
            <div className="command-identity">
              <div className="cmd-label">
                <GitCompare size={12} style={{ display: 'inline', marginRight: '6px' }} />
                Counterfactual Engine
              </div>
              <h1>Tactical Sweep</h1>
              <p>
                All {FORMATIONS.length * TACTICS.length} formation × tactic combos vs. a fixed 4-4-2
                Balanced opponent
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div
                  style={{
                    fontSize: '9px',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Rank by
                </div>
                <select
                  value={rankBy}
                  onChange={(e) => setRankBy(e.target.value)}
                  disabled={sweepRunning}
                  style={{
                    padding: '6px 10px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-low)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="xg">xG</option>
                  <option value="goal_prob">Goal Prob</option>
                  <option value="momentum">Momentum</option>
                  <option value="risk">Risk</option>
                </select>
              </div>
              <button
                className="btn-run"
                onClick={handleRunSweep}
                disabled={sweepRunning}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-end' }}
              >
                {sweepRunning ? (
                  <>
                    <span className="spinner" />
                    <span>Running…</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    <span>Run Sweep</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Error ── */}
          {sweepError && (
            <div
              className="panel"
              style={{
                borderColor: 'var(--danger)',
                background: 'var(--risk-dim)',
                marginBottom: '14px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--danger)',
                  fontWeight: 700,
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <AlertTriangle size={14} /> {sweepError}
              </div>
            </div>
          )}

          {/* ── Live progress ── */}
          {sweepRunning && progress && (
            <div
              className="panel"
              style={{ marginBottom: '14px', borderColor: 'var(--border-accent)' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--plasma)',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Live Progress
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {progress.combo_index} / {progress.total_combos}
                </div>
              </div>
              {/* bar */}
              <div
                style={{
                  height: '4px',
                  background: 'var(--surface-3)',
                  borderRadius: '2px',
                  marginBottom: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress.progress_percent}%`,
                    background: 'linear-gradient(90deg, var(--plasma), var(--pulse))',
                    borderRadius: '2px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                }}
              >
                <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
                  {progress.current_formation} + {progress.current_tactic}
                </span>
                <span>
                  {progress.progress_percent.toFixed(1)}% · {progress.elapsed_seconds.toFixed(1)}s ·
                  ~{progress.estimated_remaining_seconds.toFixed(1)}s left
                </span>
              </div>
              {/* mini metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3,1fr)',
                  gap: '8px',
                  marginBottom: '10px',
                }}
              >
                {[
                  { label: 'xG', value: progress.metrics?.xg?.toFixed(3) },
                  {
                    label: 'Goal %',
                    value: `${((progress.metrics?.goal_probability || 0) * 100).toFixed(1)}%`,
                  },
                  { label: 'PMU', value: progress.metrics?.momentum?.toFixed(1) },
                ].map((m, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--surface-0)',
                      borderRadius: '6px',
                      padding: '8px',
                      textAlign: 'center',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '9px',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontFamily: 'var(--font-mono)',
                        marginBottom: '3px',
                      }}
                    >
                      {m.label}
                    </div>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: 'var(--plasma)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {m.value || '—'}
                    </div>
                  </div>
                ))}
              </div>
              {/* streaming log */}
              <div
                style={{
                  background: 'var(--surface-0)',
                  borderRadius: '6px',
                  padding: '8px',
                  maxHeight: '80px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {progressLog.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: '10px',
                      color: i === progressLog.length - 1 ? 'var(--plasma)' : 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      lineHeight: 1.7,
                    }}
                  >
                    [{String(p.combo_index).padStart(2, '0')}] {p.current_formation} +{' '}
                    {p.current_tactic} → xG {p.metrics?.xg?.toFixed(3)} ·{' '}
                    {p.progress_percent.toFixed(0)}%
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          )}

          {/* ── Empty state ── */}
          {!sweepResults && !sweepRunning && (
            <div className="empty-state">
              <div className="empty-icon">
                <GitCompare size={40} style={{ opacity: 0.2 }} />
              </div>
              <h3>No Sweep Data</h3>
              <p>
                Click &quot;Run Sweep&quot; to evaluate all {FORMATIONS.length * TACTICS.length}{' '}
                formation × tactic combinations and rank them by your chosen metric.
              </p>
            </div>
          )}

          {/* ── Results ── */}
          {sweepResults && (
            <>
              {/* Summary row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                {[
                  {
                    label: 'Combinations',
                    value: sweepResults.total_combinations,
                    color: 'var(--text-primary)',
                  },
                  { label: 'Best Formation', value: bestResult?.formation, color: 'var(--plasma)' },
                  { label: 'Best Tactic', value: bestResult?.tactic, color: 'var(--pulse)' },
                  {
                    label: 'Best xG',
                    value: bestResult?.metrics?.xg?.toFixed(3),
                    color: 'var(--flare)',
                  },
                  {
                    label: 'Elapsed',
                    value: `${sweepResults.elapsed_seconds?.toFixed(1)}s`,
                    color: 'var(--text-secondary)',
                  },
                ].map((s, i) => (
                  <div key={i} className="stat-card">
                    <div className="stat-card-label">{s.label}</div>
                    <div
                      className="stat-card-value"
                      style={{ fontSize: '16px', color: s.color, fontFamily: 'var(--font-mono)' }}
                    >
                      {s.value || '—'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tab bar */}
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '14px',
                  background: 'var(--surface-1)',
                  padding: '4px',
                  borderRadius: '8px',
                  width: 'fit-content',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {[
                  { id: 'recommendations', label: 'Top Picks', icon: <Award size={12} /> },
                  { id: 'matrix', label: 'Heat Matrix', icon: <Target size={12} /> },
                  { id: 'table', label: 'Full Table', icon: <Activity size={12} /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      background: activeTab === tab.id ? 'var(--plasma)' : 'transparent',
                      color: activeTab === tab.id ? 'var(--void)' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      transition: 'all var(--dur-mid) var(--ease-snap)',
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Top Picks ── */}
              {activeTab === 'recommendations' && (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))',
                      gap: '12px',
                    }}
                  >
                    {sweepResults.top_3_recommendations?.map((s, idx) => {
                      const isTop = idx === 0;
                      return (
                        <div
                          key={idx}
                          className="panel"
                          style={{
                            borderColor: isTop ? 'var(--plasma)' : 'var(--border-subtle)',
                            background: isTop ? 'rgba(0,229,160,0.04)' : 'var(--surface-1)',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          {isTop && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '2px',
                                background: 'linear-gradient(90deg, var(--plasma), var(--pulse))',
                              }}
                            />
                          )}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              marginBottom: '12px',
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: '9px',
                                  color: isTop ? 'var(--plasma)' : 'var(--text-muted)',
                                  fontFamily: 'var(--font-mono)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.1em',
                                  marginBottom: '4px',
                                  fontWeight: 700,
                                }}
                              >
                                #{s.rank} Recommendation
                              </div>
                              <div
                                style={{
                                  fontSize: '18px',
                                  fontWeight: 800,
                                  color: 'var(--text-primary)',
                                  fontFamily: 'var(--font-mono)',
                                  letterSpacing: '-0.02em',
                                }}
                              >
                                {s.formation}
                              </div>
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: isTop ? 'var(--pulse)' : 'var(--text-secondary)',
                                  textTransform: 'capitalize',
                                  fontWeight: 600,
                                }}
                              >
                                {s.tactic}
                              </div>
                            </div>
                            <Award
                              size={22}
                              color={isTop ? 'var(--plasma)' : 'var(--text-muted)'}
                            />
                          </div>
                          {/* metrics */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3,1fr)',
                              gap: '6px',
                              marginBottom: '12px',
                            }}
                          >
                            {[
                              {
                                label: 'xG',
                                value: s.metrics.xg?.toFixed(3),
                                color: 'var(--flare)',
                              },
                              {
                                label: 'Goal %',
                                value: `${((s.metrics.goal_probability || 0) * 100).toFixed(1)}%`,
                                color: 'var(--plasma)',
                              },
                              {
                                label: 'PMU',
                                value: s.metrics.momentum_pmu?.toFixed(1),
                                color: 'var(--pulse)',
                              },
                            ].map((m, mi) => (
                              <div
                                key={mi}
                                style={{
                                  background: 'var(--surface-0)',
                                  borderRadius: '6px',
                                  padding: '7px',
                                  textAlign: 'center',
                                  border: '1px solid var(--border-subtle)',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '9px',
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    fontFamily: 'var(--font-mono)',
                                    marginBottom: '2px',
                                  }}
                                >
                                  {m.label}
                                </div>
                                <div
                                  style={{
                                    fontSize: '14px',
                                    fontWeight: 800,
                                    color: m.color,
                                    fontFamily: 'var(--font-mono)',
                                  }}
                                >
                                  {m.value || '—'}
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* xG delta bar */}
                          {s.metrics.xg_delta != null && (
                            <div style={{ marginBottom: '10px' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: '9px',
                                  color: 'var(--text-muted)',
                                  fontFamily: 'var(--font-mono)',
                                  marginBottom: '4px',
                                }}
                              >
                                <span>xG vs Baseline</span>
                                <span
                                  style={{ color: deltaColor(s.metrics.xg_delta), fontWeight: 700 }}
                                >
                                  {deltaSign(s.metrics.xg_delta)}
                                  {s.metrics.xg_delta.toFixed(3)}
                                </span>
                              </div>
                              <div
                                style={{
                                  height: '3px',
                                  background: 'var(--surface-3)',
                                  borderRadius: '2px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${Math.min(100, Math.abs(s.metrics.xg_delta) * 1000)}%`,
                                    background: deltaColor(s.metrics.xg_delta),
                                    borderRadius: '2px',
                                  }}
                                />
                              </div>
                            </div>
                          )}
                          {/* footer */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '9px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                fontFamily: 'var(--font-mono)',
                                color: riskColor(s.risk?.level),
                                background: `${riskColor(s.risk?.level)}18`,
                                padding: '3px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              {s.risk?.level || 'N/A'} Risk
                            </div>
                            {s.recommendations?.[0]?.action && (
                              <div
                                style={{
                                  fontSize: '10px',
                                  color: 'var(--text-muted)',
                                  maxWidth: '150px',
                                  textAlign: 'right',
                                  lineHeight: 1.4,
                                }}
                              >
                                {s.recommendations[0].action}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Concerning */}
                  {sweepResults.concerning_scenarios?.length > 0 && (
                    <div
                      className="panel"
                      style={{ borderColor: 'var(--danger)', background: 'var(--risk-dim)' }}
                    >
                      <div className="panel-header" style={{ borderColor: 'rgba(239,68,68,0.15)' }}>
                        <AlertTriangle size={13} color="var(--danger)" />
                        <div className="panel-title" style={{ color: 'var(--danger)' }}>
                          Avoid These Combinations
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))',
                          gap: '8px',
                        }}
                      >
                        {sweepResults.concerning_scenarios.map((s, i) => (
                          <div
                            key={i}
                            style={{
                              background: 'var(--surface-0)',
                              borderRadius: '6px',
                              padding: '10px',
                              border: '1px solid rgba(239,68,68,0.2)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  color: 'var(--text-primary)',
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                {s.formation}
                              </div>
                              <div
                                style={{
                                  fontSize: '10px',
                                  color: 'var(--text-muted)',
                                  textTransform: 'capitalize',
                                }}
                              >
                                {s.tactic}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  color: 'var(--danger)',
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                {s.metrics.xg?.toFixed(3)}
                              </div>
                              <div
                                style={{
                                  fontSize: '9px',
                                  color: 'var(--danger)',
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                {deltaSign(s.metrics.xg_delta)}
                                {s.metrics.xg_delta?.toFixed(3)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Heat Matrix ── */}
              {activeTab === 'matrix' && (
                <div className="panel">
                  <div className="panel-header">
                    <Target size={13} color="var(--pulse)" />
                    <div className="panel-title">xG Heat Matrix — Formation × Tactic</div>
                    <div
                      style={{
                        marginLeft: 'auto',
                        fontSize: '9px',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      darker = higher xG
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table
                      style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '4px' }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              padding: '6px 10px',
                              textAlign: 'left',
                              fontSize: '10px',
                              color: 'var(--text-muted)',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                            }}
                          >
                            Formation
                          </th>
                          {TACTICS.map((t) => (
                            <th
                              key={t}
                              style={{
                                padding: '6px 10px',
                                textAlign: 'center',
                                fontSize: '10px',
                                color: 'var(--pulse)',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {t}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {FORMATIONS.map((f) => (
                          <tr key={f}>
                            <td
                              style={{
                                padding: '6px 10px',
                                fontSize: '11px',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                color: 'var(--plasma)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {f}
                            </td>
                            {TACTICS.map((t) => {
                              const cell = getMatrixCell(f, t);
                              if (!cell)
                                return (
                                  <td key={t} style={{ padding: '4px', textAlign: 'center' }}>
                                    <div
                                      style={{
                                        background: 'var(--surface-0)',
                                        borderRadius: '6px',
                                        padding: '10px 6px',
                                        fontSize: '10px',
                                        color: 'var(--text-muted)',
                                        fontFamily: 'var(--font-mono)',
                                      }}
                                    >
                                      —
                                    </div>
                                  </td>
                                );
                              const norm = xgNorm(cell.metrics.xg);
                              const isTop = cell.rank <= 3;
                              const isBad = sweepResults.concerning_scenarios?.some(
                                (s) => s.combo === cell.combo,
                              );
                              return (
                                <td key={t} style={{ padding: '4px', textAlign: 'center' }}>
                                  <div
                                    style={{
                                      background: isTop
                                        ? `rgba(0,229,160,${0.1 + norm * 0.35})`
                                        : isBad
                                          ? `rgba(239,68,68,${0.1 + (1 - norm) * 0.25})`
                                          : `rgba(0,200,224,${0.05 + norm * 0.2})`,
                                      border: isTop
                                        ? '1px solid rgba(0,229,160,0.4)'
                                        : isBad
                                          ? '1px solid rgba(239,68,68,0.3)'
                                          : '1px solid var(--border-subtle)',
                                      borderRadius: '6px',
                                      padding: '8px 6px',
                                      cursor: 'default',
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: '13px',
                                        fontWeight: 800,
                                        color: isTop
                                          ? 'var(--plasma)'
                                          : isBad
                                            ? 'var(--danger)'
                                            : 'var(--text-primary)',
                                        fontFamily: 'var(--font-mono)',
                                      }}
                                    >
                                      {cell.metrics.xg.toFixed(3)}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: '9px',
                                        color: 'var(--text-muted)',
                                        fontFamily: 'var(--font-mono)',
                                        marginTop: '2px',
                                      }}
                                    >
                                      #{cell.rank}
                                    </div>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '16px',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span style={{ color: 'var(--plasma)' }}>■ Top 3</span>
                    <span style={{ color: 'var(--danger)' }}>■ Avoid</span>
                    <span style={{ color: 'var(--pulse)' }}>■ Mid-range</span>
                  </div>
                </div>
              )}

              {/* ── Full Table ── */}
              {activeTab === 'table' && (
                <div className="panel">
                  <div className="panel-header">
                    <Activity size={13} color="var(--pulse)" />
                    <div className="panel-title">
                      All {sweepResults.total_combinations} Combinations Ranked
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="player-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Formation</th>
                          <th>Tactic</th>
                          <th style={{ textAlign: 'right' }}>xG</th>
                          <th style={{ textAlign: 'right' }}>xG Δ</th>
                          <th style={{ textAlign: 'right' }}>Goal %</th>
                          <th style={{ textAlign: 'right' }}>PMU</th>
                          <th style={{ textAlign: 'center' }}>Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sweepResults.ranked_scenarios?.map((s) => {
                          const isTop = s.rank <= 3;
                          const isBad = sweepResults.concerning_scenarios?.some(
                            (c) => c.combo === s.combo,
                          );
                          return (
                            <tr
                              key={s.combo}
                              style={{
                                background: isTop
                                  ? 'rgba(0,229,160,0.05)'
                                  : isBad
                                    ? 'rgba(239,68,68,0.05)'
                                    : 'transparent',
                              }}
                            >
                              <td>
                                <span
                                  className="rank"
                                  style={{
                                    color: isTop
                                      ? 'var(--plasma)'
                                      : isBad
                                        ? 'var(--danger)'
                                        : 'var(--text-muted)',
                                  }}
                                >
                                  #{s.rank}
                                </span>
                              </td>
                              <td>
                                <span
                                  className="player-name"
                                  style={{ fontFamily: 'var(--font-mono)' }}
                                >
                                  {s.formation}
                                </span>
                              </td>
                              <td>
                                <span className="position" style={{ textTransform: 'capitalize' }}>
                                  {s.tactic}
                                </span>
                              </td>
                              <td
                                style={{
                                  textAlign: 'right',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 700,
                                  color: 'var(--flare)',
                                }}
                              >
                                {s.metrics.xg?.toFixed(3)}
                              </td>
                              <td
                                style={{
                                  textAlign: 'right',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 700,
                                  color: deltaColor(s.metrics.xg_delta),
                                }}
                              >
                                {s.metrics.xg_delta != null
                                  ? `${deltaSign(s.metrics.xg_delta)}${s.metrics.xg_delta.toFixed(
                                      3,
                                    )}`
                                  : '—'}
                              </td>
                              <td
                                style={{
                                  textAlign: 'right',
                                  fontFamily: 'var(--font-mono)',
                                  color: 'var(--plasma)',
                                }}
                              >
                                {((s.metrics.goal_probability || 0) * 100).toFixed(1)}%
                              </td>
                              <td
                                style={{
                                  textAlign: 'right',
                                  fontFamily: 'var(--font-mono)',
                                  color: 'var(--pulse)',
                                }}
                              >
                                {s.metrics.momentum_pmu?.toFixed(1)}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    fontFamily: 'var(--font-mono)',
                                    color: riskColor(s.risk?.level),
                                    background: `${riskColor(s.risk?.level)}18`,
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                  }}
                                >
                                  {s.risk?.level || '—'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      display: 'flex',
                      gap: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>
                      Ranked by:{' '}
                      <span style={{ color: 'var(--plasma)' }}>
                        {rankBy.toUpperCase().replace('_', ' ')}
                      </span>
                    </span>
                    <span>
                      Iters/combo:{' '}
                      <span style={{ color: 'var(--plasma)' }}>
                        {sweepResults.iterations_per_combo}
                      </span>
                    </span>
                    <span>
                      Request:{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {sweepResults.request_id}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right sidebar ── */}
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
              bestResult
                ? {
                    formation_id: FORMATIONS.indexOf(bestResult.formation),
                    tactic_id: TACTICS.indexOf(bestResult.tactic),
                    possession_pct: 52,
                    team_fatigue: 45,
                    momentum_pmu: bestResult.metrics?.momentum_pmu || 0,
                    opponent_formation_id: 1,
                    opponent_tactic_id: 0,
                    score_differential: 0,
                  }
                : null
            }
          />
          <QuickInsights
            simResults={
              sweepResults
                ? {
                    avgPMU_A: sweepResults.top_3_recommendations?.[0]?.metrics?.momentum_pmu,
                    goalProbability:
                      sweepResults.top_3_recommendations?.[0]?.metrics?.goal_probability,
                    xg: sweepResults.top_3_recommendations?.[0]?.metrics?.xg,
                    iterations: sweepResults.iterations_per_combo,
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
