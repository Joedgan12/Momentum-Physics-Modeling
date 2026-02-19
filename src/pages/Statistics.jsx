import React from 'react';
import { TrendingUp } from 'lucide-react';
import AICoach from '../components/AICoach';
import QuickInsights from '../components/QuickInsights';

export default function Statistics({ simResults }) {
  if (!simResults) {
    return (
      <div className="page-container">
        <div className="dashboard-body">
          <div style={{ flex: 1 }}>
            <div className="command-header">
              <div className="command-identity">
                <div className="cmd-label">
                  <TrendingUp size={14} style={{ display: 'inline', marginRight: '6px' }} /> Deep
                  Dive
                </div>
                <h1>Statistics & Analytics</h1>
                <p>Comprehensive simulation statistics and insights</p>
              </div>
            </div>
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No Data Available</h3>
              <p>Run a simulation to view detailed statistics and analytics</p>
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
            <AICoach matchState={null} />
            <QuickInsights simResults={null} />
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Avg PMU (A)', value: simResults.avgPMU_A?.toFixed(2) || '—', color: 'var(--team-a)' },
    { label: 'Avg PMU (B)', value: simResults.avgPMU_B?.toFixed(2) || '—', color: 'var(--team-b)' },
    { label: 'Peak PMU', value: simResults.peakPMU?.toFixed(2) || '—' },
    {
      label: 'Goal Prob',
      value: (simResults.goalProbability * 100).toFixed(1) + '%' || '—',
      color: 'var(--flare)',
    },
    { label: 'Iterations', value: simResults.iterations || '—' },
    { label: 'xG', value: simResults.xg?.toFixed(3) || '—' },
  ];

  return (
    <div className="page-container">
      <div className="dashboard-body">
        <div style={{ flex: 1 }}>
          <div className="command-header">
            <div className="command-identity">
              <div className="cmd-label">
                <TrendingUp size={14} style={{ display: 'inline', marginRight: '6px' }} /> Deep Dive
              </div>
              <h1>Statistics & Analytics</h1>
              <p>Comprehensive analysis from {simResults.iterations || 500}+ iterations</p>
            </div>
          </div>

          {/* Key Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              marginBottom: '18px',
            }}
          >
            {stats.map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div className="stat-card-label">{stat.label}</div>
                <div className="stat-card-value" style={{ color: stat.color || 'var(--plasma)' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Outcome Distribution */}
          <div className="panel" style={{ marginBottom: '18px' }}>
            <div className="panel-header">
              <div className="panel-title">Outcome Distribution</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  borderRadius: 'var(--panel-radius)',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderLeft: '3px solid var(--team-a)',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Team A Wins
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: 'var(--team-a)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {simResults.outcomeDistribution?.teamA_wins != null
                    ? `${(simResults.outcomeDistribution.teamA_wins * 100).toFixed(1)}%`
                    : '—'}
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  borderRadius: 'var(--panel-radius)',
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderLeft: '3px solid var(--violet)',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Draws
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: 'var(--violet)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {simResults.outcomeDistribution?.draws != null
                    ? `${(simResults.outcomeDistribution.draws * 100).toFixed(1)}%`
                    : '—'}
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  borderRadius: 'var(--panel-radius)',
                  background: 'rgba(244, 114, 182, 0.1)',
                  borderLeft: '3px solid var(--team-b)',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Team B Wins
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: 'var(--team-b)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {simResults.outcomeDistribution?.teamB_wins != null
                    ? `${(simResults.outcomeDistribution.teamB_wins * 100).toFixed(1)}%`
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Summary</div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                fontSize: '12px',
                lineHeight: '1.8',
              }}
            >
              <div>
                <div
                  style={{
                    marginBottom: '10px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Avg Possession:</span>
                  <span
                    style={{
                      float: 'right',
                      fontWeight: '700',
                      color: 'var(--plasma)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {simResults.avgPossession != null
                      ? `${simResults.avgPossession.toFixed(1)}%`
                      : '—'}
                  </span>
                </div>
                <div
                  style={{
                    marginBottom: '10px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Avg Team Fatigue:</span>
                  <span
                    style={{
                      float: 'right',
                      fontWeight: '700',
                      color: 'var(--plasma)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {simResults.avgTeamFatigue != null
                      ? `${simResults.avgTeamFatigue.toFixed(1)}`
                      : '—'}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Crowd Noise:</span>
                  <span
                    style={{
                      float: 'right',
                      fontWeight: '700',
                      color: 'var(--plasma)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {simResults.crowd_noise_level != null
                      ? `${simResults.crowd_noise_level.toFixed(0)} dB`
                      : '—'}
                  </span>
                </div>
              </div>
              <div>
                <div
                  style={{
                    marginBottom: '10px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Match Duration:</span>
                  <span
                    style={{
                      float: 'right',
                      fontWeight: '700',
                      color: 'var(--plasma)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    90 min
                  </span>
                </div>
                <div
                  style={{
                    marginBottom: '10px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Elapsed Time:</span>
                  <span
                    style={{
                      float: 'right',
                      fontWeight: '700',
                      color: 'var(--plasma)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {simResults.elapsed_seconds != null
                      ? `${simResults.elapsed_seconds.toFixed(2)}s`
                      : '—'}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Iterations:</span>
                  <span
                    style={{
                      float: 'right',
                      fontWeight: '700',
                      color: 'var(--plasma)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {simResults.iterations || '—'}
                  </span>
                </div>
              </div>
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
