import React from 'react';
import { Zap, TrendingUp, Activity } from 'lucide-react';
import AICoach from '../components/AICoach';
import QuickInsights from '../components/QuickInsights';

export default function Tactics({ selectedTactic, onTacticChange, simResults }) {
  const tacticDescriptions = {
    aggressive: {
      title: 'Aggressive Tactic',
      description: 'High-risk, high-reward approach focusing on offensive pressure',
      pmuMultiplier: '×1.20',
      characteristics: [
        'Higher goal probability',
        'Increased momentum swing',
        'More fouls and cards',
        'Better for comebacks',
      ],
      weaknesses: ['Vulnerable to counters', 'Higher fatigue rate', 'More defensive mistakes'],
    },
    balanced: {
      title: 'Balanced Tactic',
      description: 'Equilibrium between offense and defense',
      pmuMultiplier: '×1.00',
      characteristics: [
        'Steady momentum',
        'Predictable gameplay',
        'Lower variance',
        'Most reliable',
      ],
      weaknesses: [
        'Less likely to win big',
        'Harder to break down defenses',
        'Fewer surprise outcomes',
      ],
    },
    defensive: {
      title: 'Defensive Tactic',
      description: 'Conservative approach prioritizing defense and stability',
      pmuMultiplier: '×0.75',
      characteristics: [
        'Lower goal probability',
        'Stable momentum',
        'Efficient energy use',
        'Higher draw rate',
      ],
      weaknesses: ['Limited offensive threat', 'Slower game pace', 'Vulnerable to strong attacks'],
    },
    possession: {
      title: 'Possession Tactic',
      description: 'Ball control focus with methodical play',
      pmuMultiplier: '×0.95',
      characteristics: [
        'High pass completion',
        'Controlled momentum',
        'Lower risk plays',
        'Grinding wins',
      ],
      weaknesses: ['Slower game pace', 'Vulnerability to high press', 'Less exciting'],
    },
  };

  const tactics = ['aggressive', 'balanced', 'defensive', 'possession'];
  const current = tacticDescriptions[selectedTactic] || tacticDescriptions.balanced;

  return (
    <div className="page-container">
      <div className="dashboard-body">
        <div style={{ flex: 1 }}>
          <div className="command-header">
            <div className="command-identity">
              <div className="cmd-label">
                <Zap size={14} style={{ display: 'inline', marginRight: '6px' }} /> Game Plan
              </div>
              <h1>{current.title}</h1>
              <p>{current.description}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '900',
                  color: 'var(--flare)',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '6px',
                }}
              >
                {current.pmuMultiplier}
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
                PMU Mult.
              </div>
            </div>
          </div>

          {/* Tactic Selector Grid */}
          <div style={{ marginBottom: '18px' }}>
            <div className="section-title" style={{ marginBottom: '12px' }}>
              Select Tactic
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '10px',
              }}
            >
              {tactics.map((tactic) => (
                <button
                  key={tactic}
                  onClick={() => onTacticChange(tactic)}
                  style={{
                    padding: '12px',
                    background: selectedTactic === tactic ? 'var(--flare)' : 'var(--surface-1)',
                    color: selectedTactic === tactic ? 'var(--void)' : 'var(--text-primary)',
                    border: `1px solid ${
                      selectedTactic === tactic ? 'var(--flare)' : 'var(--border-subtle)'
                    }`,
                    borderRadius: 'var(--panel-radius)',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '12px',
                    textTransform: 'capitalize',
                    transition: 'all var(--dur-mid) var(--ease-snap)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {tactic}
                </button>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px',
              marginBottom: '18px',
            }}
          >
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
                {current.characteristics.map((char, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    {char}
                  </li>
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
                {current.weaknesses.map((weak, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    {weak}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Impact on Stats */}
          {simResults && (
            <div className="panel" style={{ marginTop: '18px' }}>
              <div className="panel-header">
                <div className="panel-title">Current Simulation Impact</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div className="stat-card">
                  <div className="stat-card-label">Avg Momentum</div>
                  <div className="stat-card-value">
                    {((simResults.avgPMU_A + simResults.avgPMU_B) / 2).toFixed(1)}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-label">Goal Probability</div>
                  <div className="stat-card-value">
                    {(simResults.goalProbability * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-label">xG</div>
                  <div className="stat-card-value">{simResults.xg?.toFixed(2) || '—'}</div>
                </div>
              </div>
            </div>
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
