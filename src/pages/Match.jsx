import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import AICoach from '../components/AICoach';
import QuickInsights from '../components/QuickInsights';

export default function Match({ simResults, selectedFormation, selectedTactic }) {
  if (!simResults) {
    return (
      <div className="page-container">
        <div className="command-header">
          <div className="command-identity">
            <div className="cmd-label">Match Breakdown</div>
            <h1>Match Analysis</h1>
            <p>Run a simulation to view detailed match analysis</p>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-icon">⚽</div>
          <h3>No Simulation Data</h3>
          <p>Go to Overview and click "Run Simulation" to analyze a match</p>
        </div>
      </div>
    );
  }

  const outcomeData = simResults.outcomeDistribution
    ? [
        { name: 'Team A Wins', value: Math.round(simResults.outcomeDistribution.teamA_wins * 100) },
        { name: 'Draws', value: Math.round(simResults.outcomeDistribution.draws * 100) },
        { name: 'Team B Wins', value: Math.round(simResults.outcomeDistribution.teamB_wins * 100) },
      ]
    : [];

  const momentumData = [
    { team: 'Team A', pmu: simResults.avgPMU_A || 20 },
    { team: 'Team B', pmu: simResults.avgPMU_B || 20 },
  ];

  const pressureData = [
    {
      type: 'Possession',
      'Team A': (simResults.teamAPressure?.possession || 0) * 100,
      'Team B': (simResults.teamBPressure?.possession || 0) * 100,
    },
    {
      type: 'Off-Ball',
      'Team A': (simResults.teamAPressure?.offBall || 0) * 100,
      'Team B': (simResults.teamBPressure?.offBall || 0) * 100,
    },
    {
      type: 'Transition',
      'Team A': (simResults.teamAPressure?.transition || 0) * 100,
      'Team B': (simResults.teamBPressure?.transition || 0) * 100,
    },
  ];

  const xgData = [
    { team: 'Team A', xg: simResults.xg_a || simResults.xg * 0.6 },
    { team: 'Team B', xg: simResults.xg_b || simResults.xg * 0.4 },
  ];

  const COLORS = ['var(--team-a)', 'var(--violet)', 'var(--team-b)'];

  return (
    <div className="page-container">
      <div className="dashboard-body">
        <div style={{ flex: 1 }}>
          <div className="command-header">
            <div className="command-identity">
              <div className="cmd-label">Match Breakdown</div>
              <h1>Match Analysis</h1>
              <p>
                {selectedFormation} vs 4-4-2 · {selectedTactic} vs balanced
              </p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              marginBottom: '18px',
            }}
          >
            <div className="stat-card">
              <div className="stat-card-label">Avg Momentum</div>
              <div className="stat-card-value">{(simResults.avgPMU || 20.5).toFixed(1)}</div>
              <div
                style={{
                  fontSize: '9px',
                  color: 'var(--plasma)',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '3px',
                }}
              >
                PMU
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Goal Probability</div>
              <div className="stat-card-value">
                {((simResults.goalProbability || 0.015) * 100).toFixed(1)}%
              </div>
              <div
                style={{
                  fontSize: '9px',
                  color: 'var(--plasma)',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '3px',
                }}
              >
                per 30s
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Expected Goals</div>
              <div className="stat-card-value">{(simResults.xg || 0.04).toFixed(3)}</div>
              <div
                style={{
                  fontSize: '9px',
                  color: 'var(--plasma)',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '3px',
                }}
              >
                xG
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Peak Momentum</div>
              <div className="stat-card-value">{(simResults.peakPMU || 45).toFixed(1)}</div>
              <div
                style={{
                  fontSize: '9px',
                  color: 'var(--plasma)',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '3px',
                }}
              >
                PMU
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '14px',
              marginBottom: '18px',
            }}
          >
            {/* Momentum Comparison */}
            <div className="panel">
              <div className="panel-title" style={{ marginBottom: '12px' }}>
                Team Momentum Comparison
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={momentumData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="team" stroke="var(--text-muted)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="var(--text-muted)" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Bar dataKey="pmu" fill="var(--plasma)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Expected Goals */}
            <div className="panel">
              <div className="panel-title" style={{ marginBottom: '12px' }}>
                Expected Goals (xG)
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={xgData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="team" stroke="var(--text-muted)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="var(--text-muted)" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Bar dataKey="xg" fill="var(--flare)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Outcome Distribution */}
            {outcomeData.length > 0 && (
              <div className="panel">
                <div className="panel-title" style={{ marginBottom: '12px' }}>
                  Match Outcome Distribution
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <Pie
                      data={outcomeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${value}%`}
                      outerRadius={70}
                      fill="var(--plasma)"
                      dataKey="value"
                    >
                      {outcomeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={['var(--team-a)', 'var(--violet)', 'var(--team-b)'][index]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `${value}%`}
                      contentStyle={{
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Pressure Streams (Full Width) */}
          <div className="panel" style={{ marginBottom: '18px' }}>
            <div className="panel-title" style={{ marginBottom: '12px' }}>
              Pressure Streams
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={pressureData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="type" stroke="var(--text-muted)" style={{ fontSize: '12px' }} />
                <YAxis
                  stroke="var(--text-muted)"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Pressure %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
                <Legend />
                <Bar dataKey="Team A" fill="var(--team-a)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Team B" fill="var(--team-b)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Performers */}
          {simResults.playerMomentum && simResults.playerMomentum.length > 0 && (
            <div className="panel" style={{ marginBottom: '18px' }}>
              <div className="panel-header">
                <div className="panel-title">Top Performers by Momentum</div>
              </div>
              <div>
                {simResults.playerMomentum.slice(0, 10).map((player, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 0',
                      borderBottom: i < 9 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        fontWeight: '800',
                        color: 'var(--plasma)',
                        fontFamily: 'var(--font-mono)',
                        textAlign: 'right',
                      }}
                    >
                      #{i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                        }}
                      >
                        {player.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {player.position}
                      </div>
                    </div>
                    <div
                      style={{
                        width: '100px',
                        height: '20px',
                        background: 'var(--surface-0)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${(player.pmu / 50) * 100}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--plasma), var(--pulse))',
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '700',
                        color: 'var(--plasma)',
                        width: '40px',
                        textAlign: 'right',
                      }}
                    >
                      {player.pmu.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
              padding: '14px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <span>Iterations: {simResults.iterations || 500}</span>
            <span style={{ margin: '0 8px' }}>•</span>
            <span>
              Execution:{' '}
              {simResults.elapsed_seconds ? simResults.elapsed_seconds.toFixed(2) + 's' : '--'}
            </span>
            <span style={{ margin: '0 8px' }}>•</span>
            <span>Request ID: {simResults.request_id || '--'}</span>
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
