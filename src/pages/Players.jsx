import React from 'react';
import { Users } from 'lucide-react';
import AICoach from '../components/AICoach';
import QuickInsights from '../components/QuickInsights';

export default function Players({ simResults }) {
  const topPlayers = simResults?.playerMomentum?.slice(0, 11) || [];

  if (!simResults) {
    return (
      <div className="page-container">
        <div className="command-header">
          <div className="command-identity">
            <div className="cmd-label">
              <Users size={14} style={{ display: 'inline', marginRight: '6px' }} /> Analysis
            </div>
            <h1>Player Performance</h1>
            <p>Individual player momentum and performance metrics</p>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <h3>No Player Data</h3>
          <p>Run a simulation to analyze individual player momentum</p>
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
                <Users size={14} style={{ display: 'inline', marginRight: '6px' }} /> Analysis
              </div>
              <h1>Player Performance</h1>
              <p>Individual momentum metrics from {simResults.iterations || 500}+ iterations</p>
            </div>
          </div>

          <div className="panel">
            {topPlayers.length > 0 ? (
              <table className="player-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Position</th>
                    <th>Team</th>
                    <th style={{ textAlign: 'right' }}>PMU</th>
                  </tr>
                </thead>
                <tbody>
                  {topPlayers.map((player, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className="rank">#{idx + 1}</span>
                      </td>
                      <td>
                        <span className="player-name">{player.name || 'N/A'}</span>
                      </td>
                      <td>
                        <span className="position">{player.position || 'N/A'}</span>
                      </td>
                      <td>
                        <span className={player.team === 'A' ? 'team-a' : 'team-b'}>
                          {player.team === 'A' ? 'Team A' : 'Team B'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <code style={{ fontWeight: 700, color: 'var(--plasma)' }}>
                          {player.pmu ? player.pmu.toFixed(2) : 'N/A'}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👤</div>
                <h3>No Player Data</h3>
                <p>Run a simulation to analyze individual player momentum</p>
              </div>
            )}
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
