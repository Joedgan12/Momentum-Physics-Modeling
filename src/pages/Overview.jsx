import React from 'react';
import Dashboard from '../components/Dashboard';
import QuickInsights from '../components/QuickInsights';
import AICoach from '../components/AICoach';

export default function Overview({
  onRunSimulation,
  simRunning,
  simResults,
  selectedFormation,
  onFormationChange,
  selectedTactic,
  onTacticChange,
  iterations,
  onIterationsChange,
  playbackSpeed,
  onPlaybackSpeedChange,
}) {
  return (
    <div className="page-container">
      <div className="dashboard-body">
        <div style={{ flex: 1 }}>
          <Dashboard
            onRunSimulation={onRunSimulation}
            simRunning={simRunning}
            simResults={simResults}
            selectedFormation={selectedFormation}
            onFormationChange={onFormationChange}
            selectedTactic={selectedTactic}
            onTacticChange={onTacticChange}
            iterations={iterations}
            onIterationsChange={onIterationsChange}
            playbackSpeed={playbackSpeed}
            onPlaybackSpeedChange={onPlaybackSpeedChange}
          />
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
