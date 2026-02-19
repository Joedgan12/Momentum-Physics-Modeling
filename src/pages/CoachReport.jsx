import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Zap } from 'lucide-react';
import AICoach from '../components/AICoach';
import QuickInsights from '../components/QuickInsights';

export default function CoachReport({ simResults }) {
  const [exporting, setExporting] = useState(false);
  const [rolloutResults, setRolloutResults] = useState(null);
  const [rolloutLoading, setRolloutLoading] = useState(false);
  const [rolloutError, setRolloutError] = useState(null);

  // Fetch rollouts when simResults change
  useEffect(() => {
    if (simResults && simResults.formation && simResults.tactic) {
      fetchRollouts();
    }
  }, [simResults]);

  const fetchRollouts = async () => {
    setRolloutLoading(true);
    setRolloutError(null);
    try {
      const response = await fetch('http://localhost:5000/api/rollouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `session_${Date.now()}`,
          formation: simResults.formation || '4-3-3',
          tactic: simResults.tactic || 'balanced',
          crowdNoise: simResults.crowdNoise || 80.0,
          iterations: 1000,
          forecastMinutes: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`Rollout failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.ok) {
        setRolloutResults(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Rollout fetch error:', err);
      setRolloutError(err.message);
    } finally {
      setRolloutLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (!simResults) return;
    setExporting(true);
    try {
      const response = await fetch('/api/export-coach-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: format,
          sim_results: simResults,
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      const disposition = response.headers.get('content-disposition');
      let filename = `Coach_Report.${format}`;
      if (disposition) {
        const matches = disposition.match(/filename="?([^"]+)"?/);
        if (matches) filename = matches[1];
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export error:', err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  if (!simResults) {
    return (
      <div className="page-container">
        <div className="command-header">
          <div className="command-identity">
            <div className="cmd-label">
              <Award size={14} style={{ display: 'inline', marginRight: '6px' }} /> Executive Brief
            </div>
            <h1>Coach Report</h1>
            <p>Executive summary of simulation analysis</p>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No Report Data</h3>
          <p>Run a simulation to generate a coach report</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="dashboard-body">
        <div style={{ flex: 1 }}>
          <div className="command-header">
            <div className="command-identity">
              <div className="cmd-label">
                <Award size={14} style={{ display: 'inline', marginRight: '6px' }} /> Executive
                Brief
              </div>
              <h1>Coach Report</h1>
              <p>Summary of {simResults.iterations || 500}+ simulation iterations</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '20px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '800',
                  color: 'var(--plasma)',
                  marginBottom: '6px',
                }}
              >
                {simResults.elapsed_seconds != null
                  ? `${simResults.elapsed_seconds.toFixed(2)}s`
                  : '—'}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Elapsed
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              marginBottom: '18px',
            }}
          >
            {rolloutLoading && (
              <div style={{ gridColumn: '1 / -1', color: 'var(--text-muted)', fontSize: 12 }}>
                Fetching rollouts…
              </div>
            )}
            {[
              {
                label: 'Avg PMU (A)',
                value: simResults.avgPMU_A?.toFixed(2),
                color: 'var(--team-a)',
              },
              {
                label: 'Avg PMU (B)',
                value: simResults.avgPMU_B?.toFixed(2),
                color: 'var(--team-b)',
              },
              {
                label: 'Goal Probability',
                value: simResults.goalProbability
                  ? `${(simResults.goalProbability * 100).toFixed(1)}%`
                  : '—',
              },
              {
                label: 'Team A Win %',
                value: simResults.outcomeDistribution?.teamA_wins
                  ? `${(simResults.outcomeDistribution.teamA_wins * 100).toFixed(1)}%`
                  : '—',
                color: 'var(--team-a)',
              },
            ].map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div className="stat-card-label">{stat.label}</div>
                <div className="stat-card-value" style={{ color: stat.color || 'var(--plasma)' }}>
                  {stat.value || '—'}
                </div>
              </div>
            ))}
          </div>

          {/* Outcome Distribution */}
          <div className="panel" style={{ marginBottom: '18px' }}>
            <div className="panel-header">
              <div className="panel-title">Outcome Probabilities</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                {
                  label: 'Team A Wins',
                  value: simResults.outcomeDistribution?.teamA_wins,
                  color: 'var(--team-a)',
                },
                {
                  label: 'Draws',
                  value: simResults.outcomeDistribution?.draws,
                  color: 'var(--violet)',
                },
                {
                  label: 'Team B Wins',
                  value: simResults.outcomeDistribution?.teamB_wins,
                  color: 'var(--team-b)',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--panel-radius)',
                    background: 'var(--surface-0)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: '800',
                      color: item.color,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {item.value != null ? `${(item.value * 100).toFixed(1)}%` : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monte Carlo Rollouts */}
          {rolloutResults && (
            <div
              className="panel"
              style={{ marginBottom: '18px', borderColor: 'var(--success)', borderWidth: '1px' }}
            >
              <div className="panel-header">
                <div
                  className="panel-title"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <TrendingUp size={16} style={{ color: 'var(--success)' }} />
                  Monte Carlo Rollouts
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Next {rolloutResults.forecastMinutes}min forecast
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--panel-radius)',
                    background: 'var(--surface-0)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                    }}
                  >
                    Team A Momentum
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '800',
                      color: 'var(--team-a)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {rolloutResults.simulationResults.avgPMU_A?.toFixed(1) || '—'}
                  </div>
                </div>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--panel-radius)',
                    background: 'var(--surface-0)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                    }}
                  >
                    Team B Momentum
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '800',
                      color: 'var(--team-b)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {rolloutResults.simulationResults.avgPMU_B?.toFixed(1) || '—'}
                  </div>
                </div>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--panel-radius)',
                    background: 'var(--surface-0)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                    }}
                  >
                    Goal Probability
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '800',
                      color: 'var(--plasma)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {(rolloutResults.simulationResults.goalProbability * 100)?.toFixed(1)}%
                  </div>
                </div>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--panel-radius)',
                    background: 'var(--surface-0)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                    }}
                  >
                    Confidence
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '800',
                      color: 'var(--success)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {(rolloutResults.confidence * 100)?.toFixed(0)}%
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: '12px',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Simulated {rolloutResults.iterations.toLocaleString()} iterations from current match
                state
              </div>
            </div>
          )}

          {rolloutError && (
            <div
              className="panel"
              style={{
                marginBottom: '18px',
                borderColor: 'var(--warning)',
                borderWidth: '1px',
                background: 'var(--surface-error-light)',
              }}
            >
              <div className="panel-header">
                <div
                  className="panel-title"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Zap size={16} style={{ color: 'var(--warning)' }} />
                  Rollout Error
                </div>
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {rolloutError}
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Export Report</div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '12px',
              }}
            >
              {[
                { format: 'csv', label: 'CSV Export', icon: '📊' },
                { format: 'pdf', label: 'PDF Report', icon: '📄' },
                { format: 'json', label: 'JSON Data', icon: '{}' },
              ].map((option) => (
                <button
                  key={option.format}
                  onClick={() => handleExport(option.format)}
                  disabled={exporting}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--surface-0)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--panel-radius)',
                    cursor: exporting ? 'not-allowed' : 'pointer',
                    fontWeight: '700',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    transition: 'all var(--dur-mid) var(--ease-snap)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: exporting ? 0.5 : 1,
                  }}
                >
                  <span>{option.icon}</span>
                  {exporting ? 'Exporting…' : option.label}
                </button>
              ))}
            </div>
            <div
              style={{
                marginTop: '12px',
                fontSize: '10px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Files will be downloaded to your default download directory
            </div>
          </div>
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
