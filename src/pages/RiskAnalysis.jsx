import React from 'react';
import { AlertTriangle } from 'lucide-react';
import AICoach from '../components/AICoach';
import QuickInsights from '../components/QuickInsights';

export default function RiskAnalysis({ simResults }) {
  if (!simResults?.risk_assessment) {
    return (
      <div className="page-container">
        <div className="command-header">
          <div className="command-identity">
            <div className="cmd-label">
              <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px' }} /> Exposure
              Map
            </div>
            <h1>Risk Analysis</h1>
            <p>Structural weaknesses and exposure heatmaps</p>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-icon">⚠</div>
          <h3>No Risk Data</h3>
          <p>Run a simulation to analyze team vulnerabilities</p>
        </div>
      </div>
    );
  }

  const risk = simResults.risk_assessment || {};

  const riskColor = (value) => {
    if (value >= 60) return 'var(--danger)';
    if (value >= 40) return 'var(--flare)';
    if (value >= 20) return 'var(--plasma)';
    return 'var(--pulse)';
  };

  const riskLabel = (value) => {
    if (value >= 60) return 'CRITICAL';
    if (value >= 40) return 'HIGH';
    if (value >= 20) return 'MODERATE';
    return 'LOW';
  };

  return (
    <div className="page-container">
      <div className="dashboard-body">
        <div style={{ flex: 1 }}>
          <div className="command-header">
            <div className="command-identity">
              <div className="cmd-label">
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px' }} />{' '}
                Exposure Map
              </div>
              <h1>Risk Analysis</h1>
              <p>Detailed vulnerability and exposure assessment</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '900',
                  color: riskColor(risk.overall_risk_score || 0),
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '6px',
                }}
              >
                {risk.overall_risk_level || '—'}
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
                Risk Level
              </div>
            </div>
          </div>

          {/* Risk Categories */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              marginBottom: '18px',
            }}
          >
            {[
              { label: 'Defensive Risk', value: risk.defensive_risk },
              { label: 'Possession Risk', value: risk.possession_risk },
              { label: 'Transition Risk', value: risk.transition_risk },
              { label: 'Set Piece Risk', value: risk.set_piece_risk },
            ].map((item, idx) => (
              <div key={idx} className="stat-card">
                <div className="stat-card-label">{item.label}</div>
                <div className="stat-card-value" style={{ color: riskColor(item.value || 0) }}>
                  {item.value != null ? `${item.value.toFixed(0)}` : '—'}
                </div>
              </div>
            ))}
          </div>

          {/* Vulnerabilities */}
          {risk.main_vulnerabilities && risk.main_vulnerabilities.length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Main Vulnerabilities</div>
              </div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {risk.main_vulnerabilities.slice(0, 5).map((vuln, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--panel-radius)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      borderLeft: '3px solid var(--danger)',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        marginBottom: '3px',
                      }}
                    >
                      {vuln.type || 'Vulnerability'}
                    </div>
                    <div>{vuln.description || vuln}</div>
                  </div>
                ))}
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
