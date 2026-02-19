import React from 'react';
import { Lightbulb, CheckCircle } from 'lucide-react';
import AICoach from '../components/AICoach';
import QuickInsights from '../components/QuickInsights';

export default function Recommendations({ simResults }) {
  if (!simResults?.recommendations) {
    return (
      <div className="page-container">
        <div className="command-header">
          <div className="command-identity">
            <div className="cmd-label">
              <Lightbulb size={14} style={{ display: 'inline', marginRight: '6px' }} /> Insights
            </div>
            <h1>Tactical Recommendations</h1>
            <p>AI-powered insights and action items</p>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-icon">💡</div>
          <h3>No Recommendations</h3>
          <p>Run a simulation to see AI-powered tactical insights</p>
        </div>
      </div>
    );
  }

  const recs = simResults.recommendations || [];

  return (
    <div className="page-container">
      <div className="dashboard-body">
        <div style={{ flex: 1 }}>
          <div className="command-header">
            <div className="command-identity">
              <div className="cmd-label">
                <Lightbulb size={14} style={{ display: 'inline', marginRight: '6px' }} /> Insights
              </div>
              <h1>Tactical Recommendations</h1>
              <p>Actionable insights from {simResults.iterations || 500}+ Monte Carlo iterations</p>
            </div>
          </div>

          {/* Recommendations List */}
          <div style={{ display: 'grid', gap: '12px' }}>
            {recs.length > 0 ? (
              recs.map((rec, idx) => (
                <div
                  key={idx}
                  className="panel"
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor:
                      rec.priority === 'HIGH'
                        ? 'var(--danger)'
                        : rec.priority === 'MEDIUM'
                        ? 'var(--flare)'
                        : 'var(--plasma)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div
                      style={{
                        marginTop: '2px',
                        color:
                          rec.priority === 'HIGH'
                            ? 'var(--danger)'
                            : rec.priority === 'MEDIUM'
                            ? 'var(--flare)'
                            : 'var(--plasma)',
                      }}
                    >
                      <CheckCircle size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '6px',
                        }}
                      >
                        <div className="section-title" style={{ fontSize: '12px', margin: 0 }}>
                          {rec.action || `Recommendation ${idx + 1}`}
                        </div>
                        <div
                          style={{
                            fontSize: '9px',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            color:
                              rec.priority === 'HIGH'
                                ? 'var(--danger)'
                                : rec.priority === 'MEDIUM'
                                ? 'var(--flare)'
                                : 'var(--plasma)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {rec.priority || 'LOW'}
                        </div>
                      </div>
                      <p
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.5',
                        }}
                      >
                        {rec.rationale || rec.description || 'See impact details below'}
                      </p>
                      {rec.impact_score != null && (
                        <div
                          style={{
                            fontSize: '10px',
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          Impact Score:{' '}
                          <span style={{ color: 'var(--plasma)', fontWeight: '700' }}>
                            {(rec.impact_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">—</div>
                <h3>No Recommendations</h3>
                <p>Simulation did not generate specific recommendations</p>
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
