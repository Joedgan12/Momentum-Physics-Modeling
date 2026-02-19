import React from 'react'
import { TrendingUp, Clock, BarChart2 } from 'lucide-react'

export default function QuickInsights({ simResults }) {
  const topPerformers = simResults?.playerMomentum?.slice(0, 5) ?? []

  const formGuides = simResults?.goalProbability != null
    ? simResults.goalProbability > 0.05
      ? ['W', 'W', 'D', 'W', 'D']
      : ['D', 'D', 'W', 'D', 'L']
    : ['—', '—', '—', '—', '—']

  return (
    <div className="quick-insights">

      {/* Top Performers */}
      <div className="qi-section">
        <div className="qi-section-header">
          <span className="qi-section-title">Top Performers</span>
          <TrendingUp size={13} className="qi-section-icon" />
        </div>

        {topPerformers.length > 0 ? (
          topPerformers.map((p, i) => (
            <div key={i} className="performer-item">
              <div className={`performer-rank r${i + 1}`}>{i + 1}</div>
              <div className="performer-info">
                <div className="performer-name">{p.name}</div>
                <div className="performer-pos">{p.position} · {p.team === 'A' ? 'Team A' : 'Team B'}</div>
              </div>
              <div className="performer-score">{p.pmu.toFixed(1)}</div>
            </div>
          ))
        ) : (
          <div style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
            Run simulation to populate
          </div>
        )}
      </div>

      {/* Form Pattern */}
      <div className="qi-section">
        <div className="qi-section-header">
          <span className="qi-section-title">Form Pattern</span>
          <Clock size={13} className="qi-section-icon" />
        </div>
        <div className="form-badges">
          {formGuides.map((f, i) => (
            <div key={i} className={`form-badge ${f === '—' ? 'neutral' : f}`}>{f}</div>
          ))}
        </div>
      </div>

      {/* Simulation Summary */}
      <div className="qi-section">
        <div className="qi-section-header">
          <span className="qi-section-title">Simulation Summary</span>
          <BarChart2 size={13} className="qi-section-icon" />
        </div>

        {simResults ? (
          <>
            <div className="qi-stat-row">
              <span className="qi-stat-key">Iterations</span>
              <span className="qi-stat-val">{simResults.iterations ?? '—'}</span>
            </div>
            <div className="qi-stat-row">
              <span className="qi-stat-key">Avg PMU</span>
              <span className="qi-stat-val">{simResults.avgPMU != null ? simResults.avgPMU.toFixed(1) : '—'}</span>
            </div>
            <div className="qi-stat-row">
              <span className="qi-stat-key">Peak PMU</span>
              <span className="qi-stat-val">{simResults.peakPMU != null ? simResults.peakPMU.toFixed(1) : '—'}</span>
            </div>
            <div className="qi-stat-row">
              <span className="qi-stat-key">Win % (A)</span>
              <span className="qi-stat-val" style={{ color: 'var(--team-a)' }}>
                {simResults.outcomeDistribution?.teamA_wins != null
                  ? `${(simResults.outcomeDistribution.teamA_wins * 100).toFixed(0)}%`
                  : '—'}
              </span>
            </div>
            <div className="qi-stat-row">
              <span className="qi-stat-key">Win % (B)</span>
              <span className="qi-stat-val" style={{ color: 'var(--team-b)' }}>
                {simResults.outcomeDistribution?.teamB_wins != null
                  ? `${(simResults.outcomeDistribution.teamB_wins * 100).toFixed(0)}%`
                  : '—'}
              </span>
            </div>
            <div className="qi-stat-row">
              <span className="qi-stat-key">Goal Prob.</span>
              <span className="qi-stat-val" style={{ color: 'var(--flare)' }}>
                {simResults.goalProbability != null
                  ? `${(simResults.goalProbability * 100).toFixed(1)}%`
                  : '—'}
              </span>
            </div>

            <div style={{ marginTop: 8, fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'right', letterSpacing: '0.06em' }}>
              UPDATED · NOW
            </div>
          </>
        ) : (
          <div style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
            Awaiting simulation
          </div>
        )}
      </div>

    </div>
  )
}
