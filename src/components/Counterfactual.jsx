import React, { useState, useCallback } from 'react';
import { Award, AlertTriangle } from 'lucide-react';

export default function Counterfactual({ iterations, onIterationsChange }) {
  const [sweepResults, setSweepResults] = useState(null);
  const [sweepRunning, setSweepRunning] = useState(false);
  const [sweepError, setSweepError] = useState(null);
  const [rankBy, setRankBy] = useState('xg');

  const handleRunSweep = useCallback(async () => {
    setSweepRunning(true);
    setSweepError(null);
    try {
      const response = await fetch('/api/sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formation_b: '4-4-2',
          tactic_b: 'balanced',
          scenario: 'Tactical Sweep',
          iterations: Math.min(iterations, 200), // Cap for speed
          start_minute: 0,
          end_minute: 90,
          crowd_noise: 80.0,
          rank_by: rankBy,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status}`);
      }

      const json = await response.json();
      if (!json.ok) throw new Error(json.error || 'Sweep failed');

      setSweepResults(json.data);
    } catch (err) {
      console.error('Sweep error:', err);
      setSweepError(err.message);
    } finally {
      setSweepRunning(false);
    }
  }, [iterations, rankBy]);

  const formatDelta = (value, isRisk = false) => {
    const absVal = Math.abs(value);
    const color = value > 0 ? '#10B981' : value < 0 ? '#EF4444' : '#6B7280';
    const icon = value > 0 ? '↑' : value < 0 ? '↓' : '→';
    return (
      <span style={{ color }}>
        {icon} {isRisk ? value.toFixed(1) : absVal.toFixed(3)}
      </span>
    );
  };

  return (
    <div className="dashboard-center">
      {/* Controls */}
      <div className="hero-banner">
        <div className="hero-text">
          <h1>Tactical Counterfactual Sweep</h1>
          <p>
            Systematically test all formation × tactic combinations vs. a fixed opponent. Identify
            best tactical adjustments.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
            <button className="btn-run" onClick={handleRunSweep} disabled={sweepRunning}>
              {sweepRunning ? (
                <>
                  <span className="spinner"></span>
                  Running Sweep...
                </>
              ) : (
                'Run Counterfactual Sweep'
              )}
            </button>

            {/* Rank By */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                paddingLeft: 12,
                borderLeft: '1px solid #e5e7eb',
              }}
            >
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Rank By</div>
              <select
                value={rankBy}
                onChange={(e) => setRankBy(e.target.value)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  fontWeight: 500,
                }}
              >
                <option value="xg">Expected Goals (xG)</option>
                <option value="goal_prob">Goal Probability</option>
                <option value="momentum">Momentum Advantage</option>
                <option value="risk">Risk Reduction</option>
              </select>
            </div>

            {/* Iterations */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                paddingLeft: 12,
                borderLeft: '1px solid #e5e7eb',
              }}
            >
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Iterations</div>
              <select
                value={iterations <= 50 ? 50 : iterations <= 200 ? 200 : 500}
                onChange={(e) => onIterationsChange(parseInt(e.target.value))}
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  fontWeight: 500,
                }}
              >
                <option value={50}>50 (Quick)</option>
                <option value={200}>200 (Standard)</option>
                <option value={500}>500 (Thorough)</option>
              </select>
            </div>
          </div>

          {sweepError && (
            <div
              style={{
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: 8,
                padding: 12,
                color: '#991B1B',
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              ❌ {sweepError}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {!sweepResults ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#f9fafb',
            borderRadius: 12,
            marginTop: 20,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 16, color: '#6b7280' }}>
            Run a sweep to see ranked tactical options
          </div>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="stats-row" style={{ marginTop: 20 }}>
            <div className="stat-card">
              <div className="stat-card-header">
                <span>Baseline (4-3-3 Balanced)</span>
                <div className="stat-icon" style={{ background: 'rgba(102,126,234,0.1)' }}>
                  ⚙️
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="stat-value">{sweepResults.baseline.xg.toFixed(3)}</span>
                <span className="stat-delta">xG</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span>Top Recommendation</span>
                <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>
                  🏆
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="stat-value">
                  {sweepResults.top_3_recommendations[0]?.formation}
                </span>
                <span className="stat-delta positive">
                  {sweepResults.top_3_recommendations[0]?.tactic}
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span>Total Tested</span>
                <div className="stat-icon" style={{ background: 'rgba(249,158,11,0.1)' }}>
                  📋
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="stat-value">{sweepResults.total_combinations}</span>
                <span className="stat-delta">combos</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span>Elapsed Time</span>
                <div className="stat-icon" style={{ background: 'rgba(240,147,251,0.1)' }}>
                  ⏱️
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="stat-value">{sweepResults.elapsed_seconds.toFixed(1)}</span>
                <span className="stat-delta">seconds</span>
              </div>
            </div>
          </div>

          {/* Top 3 Recommendations */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ color: '#1f2937', marginBottom: 12, fontSize: 18, fontWeight: 600 }}>
              🏆 Top 3 Recommendations
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 12,
              }}
            >
              {sweepResults.top_3_recommendations.map((scenario, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '2px solid #10B981',
                    borderRadius: 12,
                    padding: 16,
                    background: '#F0FDF4',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#1f2937' }}>
                        #{scenario.rank}
                      </div>
                      <div style={{ fontSize: 14, color: '#6B7280' }}>
                        {scenario.formation} +{' '}
                        <span style={{ fontWeight: 600, color: '#667EEA' }}>{scenario.tactic}</span>
                      </div>
                    </div>
                    <Award size={32} color="#10B981" />
                  </div>

                  <div
                    style={{ background: '#fff', borderRadius: 8, padding: 12, marginBottom: 12 }}
                  >
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}
                    >
                      <span style={{ fontSize: 12, color: '#6b7280' }}>xG</span>
                      <span style={{ fontWeight: 600, color: '#1f2937' }}>
                        {scenario.metrics.xg.toFixed(3)}
                      </span>
                    </div>
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}
                    >
                      <span style={{ fontSize: 12, color: '#6b7280' }}>Goal Prob</span>
                      <span style={{ fontWeight: 600, color: '#1f2937' }}>
                        {(scenario.metrics.goal_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>Momentum</span>
                      <span style={{ fontWeight: 600, color: '#1f2937' }}>
                        {scenario.metrics.momentum_pmu.toFixed(1)} PMU
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: '#6b7280',
                      background: '#fff',
                      borderRadius: 8,
                      padding: 8,
                    }}
                  >
                    <div style={{ marginBottom: 4 }}>
                      <strong>Primary Action:</strong>{' '}
                      {scenario.recommendations?.[0]?.action || 'No immediate action'}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {scenario.recommendations?.[0]?.rationale || ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full Ranked Table */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ color: '#1f2937', marginBottom: 12, fontSize: 18, fontWeight: 600 }}>
              📊 Full Ranking (All {sweepResults.total_combinations} Combinations)
            </h3>
            <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#667EEA', color: '#fff' }}>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Rank</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Formation</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Tactic</th>
                    <th style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>xG</th>
                    <th style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>xG Δ</th>
                    <th style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>Goal Prob</th>
                    <th style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>Momentum</th>
                    <th style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>
                      Risk Level
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sweepResults.ranked_scenarios.map((scenario) => (
                    <tr
                      key={scenario.combo}
                      style={{
                        background:
                          scenario.rank <= 3
                            ? '#F0FDF4'
                            : scenario.rank > 13
                            ? '#FEE2E2'
                            : '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      <td style={{ padding: 12, fontWeight: 600, color: '#667EEA' }}>
                        #{scenario.rank}
                      </td>
                      <td style={{ padding: 12, fontWeight: 500 }}>{scenario.formation}</td>
                      <td style={{ padding: 12, color: '#6b7280', textTransform: 'capitalize' }}>
                        {scenario.tactic}
                      </td>
                      <td
                        style={{ padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 600 }}
                      >
                        {scenario.metrics.xg.toFixed(3)}
                      </td>
                      <td style={{ padding: 12, textAlign: 'center', fontSize: 13 }}>
                        {formatDelta(scenario.metrics.xg_delta)}
                      </td>
                      <td
                        style={{ padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 600 }}
                      >
                        {(scenario.metrics.goal_probability * 100).toFixed(1)}%
                      </td>
                      <td
                        style={{ padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 600 }}
                      >
                        {scenario.metrics.momentum_pmu.toFixed(1)}
                      </td>
                      <td
                        style={{
                          padding: 12,
                          textAlign: 'center',
                          fontSize: 12,
                          fontWeight: 600,
                          color:
                            scenario.risk.level === 'LOW'
                              ? '#10B981'
                              : scenario.risk.level === 'MODERATE'
                              ? '#F59E0B'
                              : scenario.risk.level === 'HIGH'
                              ? '#EF4444'
                              : '#DC2626',
                        }}
                      >
                        {scenario.risk.level}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Concerning Scenarios */}
          {sweepResults.concerning_scenarios && sweepResults.concerning_scenarios.length > 0 && (
            <div
              style={{
                marginTop: 24,
                background: '#FEF2F2',
                border: '2px solid #FCA5A5',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <h3
                style={{
                  color: '#991B1B',
                  marginBottom: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertTriangle size={20} />
                ⚠️ Avoid These Combinations
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: 12,
                }}
              >
                {sweepResults.concerning_scenarios.map((scenario) => (
                  <div
                    key={scenario.combo}
                    style={{
                      background: '#fff',
                      border: '1px solid #FCA5A5',
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{ fontSize: 14, fontWeight: 600, color: '#991B1B', marginBottom: 8 }}
                    >
                      {scenario.formation} + {scenario.tactic}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                      <strong>xG:</strong> {scenario.metrics.xg.toFixed(3)} (
                      {formatDelta(scenario.metrics.xg_delta)})
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      <strong>Risk:</strong> {scenario.risk.level}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: '#f9fafb',
              borderRadius: 8,
              fontSize: 12,
              color: '#6b7280',
              textAlign: 'center',
            }}
          >
            Ranked by: <strong>{rankBy.toUpperCase().replace('_', ' ')}</strong> • Iterations per
            combo: <strong>{sweepResults.iterations_per_combo}</strong> • Request ID:{' '}
            <strong>{sweepResults.request_id}</strong>
          </div>
        </>
      )}
    </div>
  );
}
