import React, { useEffect, useRef, useState } from 'react';
import Pitch from './Pitch';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Zap, Target, TrendingUp, Activity, Play } from 'lucide-react';

/* ── Animated number counter ── */
function AnimatedNumber({ value, decimals = 1, suffix = '' }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const raf = useRef(null);

  useEffect(() => {
    const from = prev.current ?? 0;
    const to = value ?? 0;
    if (from === to) return;

    const dur = 700;
    const start = performance.now();

    const step = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * ease);
      if (t < 1) raf.current = requestAnimationFrame(step);
      else {
        setDisplay(to);
        prev.current = to;
      }
    };

    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  const raw =
    typeof display === 'number' ? display.toFixed(decimals) : (value?.toFixed?.(decimals) ?? '--');
  return (
    <>
      {raw}
      {suffix}
    </>
  );
}

/* ── Metric card ── */
function MetricCard({
  label,
  value,
  decimals = 1,
  suffix = '',
  accentClass = 'plasma',
  iconClass = 'plasma',
  icon: Icon,
  delta,
}) {
  return (
    <div className={`metric-card accent-${accentClass}`}>
      <div className="metric-header">
        <span>{label}</span>
        <div className={`metric-icon ${iconClass}`}>
          <Icon size={13} strokeWidth={2.5} />
        </div>
      </div>
      <div className="metric-value">
        {value != null ? (
          <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </div>
      {delta != null && (
        <div className={`metric-delta ${delta >= 0 ? 'positive' : 'negative'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}
        </div>
      )}
    </div>
  );
}

/* ── Custom recharts tooltip ── */
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-low)',
        borderRadius: 7,
        padding: '7px 11px',
        fontSize: 11,
        color: 'var(--text-primary)',
      }}
    >
      <div
        style={{
          color: 'var(--text-muted)',
          marginBottom: 4,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
        }}
      >
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </div>
      ))}
    </div>
  );
}

/* ────────────────────── Main component ── */
export default function Dashboard({
  onRunSimulation,
  simRunning,
  simResults,
  selectedFormation,
  onFormationChange,
  selectedTactic,
  onTacticChange,
  iterations,
  onIterationsChange,
}) {
  /* Build sparkline data from momentum history */
  const sparkData =
    simResults?.momentumHistory?.map((m, i) => ({
      t: i,
      a: m.teamA ?? m,
      b: m.teamB ?? 0,
    })) ?? Array.from({ length: 12 }, (_, i) => ({ t: i, a: 0, b: 0 }));

  return (
    <div className="dashboard-center">
      {/* ── Command Header ── */}
      <div className="command-header">
        <div className="command-identity">
          <div className="cmd-label">Tactical Command Environment</div>
          <h1>Elite Momentum Analytics</h1>
          <p>
            Configure formation &amp; tactic, set iteration depth, then fire the simulation engine.
            Spatial outputs update automatically.
          </p>
        </div>

        <div className="command-controls">
          {/* Formation */}
          <select
            className="ctrl-select"
            value={selectedFormation}
            onChange={(e) => onFormationChange(e.target.value)}
          >
            {[
              '4-3-3',
              '4-4-2',
              '3-5-2',
              '5-3-2',
              '4-2-4',
              '3-4-3',
              '4-2-3-1',
              '4-1-4-1',
              '4-3-2-1',
            ].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>

          {/* Tactic */}
          <select
            className="ctrl-select"
            value={selectedTactic}
            onChange={(e) => onTacticChange(e.target.value)}
          >
            {['aggressive', 'balanced', 'defensive', 'possession'].map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>

          <div className="ctrl-divider" />

          {/* Iterations */}
          <div className="iter-control">
            <span className="iter-label">N</span>
            <input
              type="range"
              className="iter-slider"
              min={20}
              max={2000}
              step={10}
              value={iterations}
              onChange={(e) => onIterationsChange(parseInt(e.target.value))}
            />
            <input
              type="number"
              className="iter-number"
              min={20}
              max={2000}
              value={iterations}
              onChange={(e) =>
                onIterationsChange(Math.max(20, Math.min(2000, parseInt(e.target.value) || 20)))
              }
            />
            <div className="iter-preset-group">
              {[50, 500, 1500].map((n, i) => (
                <button
                  key={n}
                  className={`iter-preset${iterations === n ? ' active' : ''}`}
                  onClick={() => onIterationsChange(n)}
                  title={['Quick', 'Balanced', 'Thorough'][i]}
                >
                  {['Q', 'B', 'T'][i]}
                </button>
              ))}
            </div>
          </div>

          <div className="ctrl-divider" />

          {/* Run */}
          <button className="btn-run" onClick={onRunSimulation} disabled={simRunning}>
            {simRunning ? (
              <>
                <span className="spinner" />
                Computing
              </>
            ) : (
              <>
                <Play size={12} strokeWidth={3} />
                Run Sim
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Metrics Row ── */}
      <div className="metrics-row">
        <MetricCard
          label="Team A Momentum"
          value={simResults?.avgPMU_A}
          accentClass="plasma"
          iconClass="plasma"
          icon={Zap}
        />
        <MetricCard
          label="Team B Momentum"
          value={simResults?.avgPMU_B}
          accentClass="pulse"
          iconClass="pulse"
          icon={Zap}
        />
        <MetricCard
          label="Goal Probability"
          value={simResults ? simResults.goalProbability * 100 : null}
          suffix="%"
          accentClass="flare"
          iconClass="flare"
          icon={Target}
        />
        <MetricCard
          label="Expected Goals"
          value={simResults?.xg}
          decimals={3}
          accentClass="violet"
          iconClass="violet"
          icon={TrendingUp}
        />
      </div>

      {/* ── Spatial Centre: Pitch + Chart ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Pitch — the dominant visual */}
        <div style={{ position: 'relative' }}>
          {simRunning && (
            <div className="sim-loading-overlay">
              <div className="sim-loading-ring" />
              <div className="sim-loading-text">Monte Carlo engine running…</div>
            </div>
          )}
          <Pitch
            players={simResults?.allPlayers}
            teamAPressure={simResults?.teamAPressure}
            teamBPressure={simResults?.teamBPressure}
          />
        </div>

        {/* Momentum timeline */}
        <div className="match-analysis-card">
          <div className="card-header">
            <div>
              <h3>Momentum Timeline</h3>
              <p>Per-iteration PMU trajectory</p>
            </div>
            <span className="card-badge plasma">LIVE</span>
          </div>
          <div className="match-analysis-body" style={{ padding: '14px 18px' }}>
            {!simResults ? (
              <div className="sim-empty">
                <div className="sim-empty-icon">
                  <Activity size={20} />
                </div>
                <p>Run simulation to populate timeline</p>
              </div>
            ) : (
              <>
                {/* Summary tiles */}
                <div className="sim-summary-grid" style={{ marginBottom: 14 }}>
                  <div className="sim-summary-card">
                    <div className="label">Avg PMU</div>
                    <div className="value">
                      <AnimatedNumber value={simResults.avgPMU} />
                    </div>
                    <div className="sub">all players</div>
                  </div>
                  <div className="sim-summary-card">
                    <div className="label">Peak PMU</div>
                    <div className="value">
                      <AnimatedNumber value={simResults.peakPMU} />
                    </div>
                    <div className="sub">max single</div>
                  </div>
                  <div className="sim-summary-card">
                    <div className="label">Iterations</div>
                    <div className="value" style={{ fontSize: 16 }}>
                      {simResults.iterations}
                    </div>
                    <div className="sub">monte carlo</div>
                  </div>
                </div>

                {/* Sparkline chart */}
                <div style={{ height: 110 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--team-a)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--team-a)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--team-b)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--team-b)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
                      <XAxis dataKey="t" hide />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip content={<DarkTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="a"
                        name="Team A"
                        stroke="var(--team-a)"
                        strokeWidth={1.5}
                        fill="url(#gA)"
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="b"
                        name="Team B"
                        stroke="var(--team-b)"
                        strokeWidth={1.5}
                        fill="url(#gB)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Formation + Tactic selection + Player PMU ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: 14 }}>
        {/* Formation picker */}
        <div className="scenario-panel">
          <h4>Formation</h4>
          {[
            '4-3-3',
            '4-4-2',
            '3-5-2',
            '5-3-2',
            '4-2-4',
            '3-4-3',
            '4-2-3-1',
            '4-1-4-1',
            '4-3-2-1',
          ].map((f) => (
            <label
              key={f}
              className={`scenario-option${selectedFormation === f ? ' selected' : ''}`}
            >
              <div className="scenario-dot" />
              <input
                type="radio"
                name="formation"
                value={f}
                checked={selectedFormation === f}
                onChange={(e) => onFormationChange(e.target.value)}
                style={{ display: 'none' }}
              />
              {f}
            </label>
          ))}
        </div>

        {/* Tactic picker */}
        <div className="scenario-panel">
          <h4>Tactic</h4>
          {['aggressive', 'balanced', 'defensive', 'possession'].map((t) => (
            <label key={t} className={`scenario-option${selectedTactic === t ? ' selected' : ''}`}>
              <div className="scenario-dot" />
              <input
                type="radio"
                name="tactic"
                value={t}
                checked={selectedTactic === t}
                onChange={(e) => onTacticChange(e.target.value)}
                style={{ display: 'none' }}
              />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </label>
          ))}
        </div>

        {/* Player PMU list */}
        <div className="match-analysis-card">
          <div className="card-header">
            <div>
              <h3>Player Momentum</h3>
              <p>Ranked by PMU score</p>
            </div>
          </div>
          <div className="match-analysis-body" style={{ padding: '14px 18px' }}>
            {!simResults ? (
              <div className="sim-empty" style={{ height: 120 }}>
                <p>Awaiting simulation…</p>
              </div>
            ) : (
              <>
                {/* Team pressure bars */}
                <div className="momentum-bar-section" style={{ marginBottom: 12 }}>
                  <div className="momentum-col">
                    <h4 className="team-a-color">Team A</h4>
                    {[
                      { label: 'Possession', prob: simResults.teamAPressure.possession },
                      { label: 'Off-Ball', prob: simResults.teamAPressure.offBall },
                      { label: 'Transition', prob: simResults.teamAPressure.transition },
                    ].map((p, i) => (
                      <div key={i} className="prob-row">
                        <div className="prob-label">{p.label}</div>
                        <div className="prob-bar-wrap">
                          <div
                            className="prob-bar-fill"
                            style={{ width: `${p.prob * 100}%`, background: 'var(--team-a)' }}
                          />
                        </div>
                        <div className="prob-val">{(p.prob * 100).toFixed(0)}%</div>
                      </div>
                    ))}
                  </div>
                  <div className="momentum-col">
                    <h4 className="team-b-color">Team B</h4>
                    {[
                      { label: 'Possession', prob: simResults.teamBPressure.possession },
                      { label: 'Off-Ball', prob: simResults.teamBPressure.offBall },
                      { label: 'Transition', prob: simResults.teamBPressure.transition },
                    ].map((p, i) => (
                      <div key={i} className="prob-row">
                        <div className="prob-label">{p.label}</div>
                        <div className="prob-bar-wrap">
                          <div
                            className="prob-bar-fill"
                            style={{ width: `${p.prob * 100}%`, background: 'var(--team-b)' }}
                          />
                        </div>
                        <div className="prob-val">{(p.prob * 100).toFixed(0)}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual bars — top 8 */}
                <div className="momentum-chart-section">
                  <h4>Top Performers</h4>
                  <div className="player-pmu-list">
                    {simResults.playerMomentum.slice(0, 8).map((p, i) => (
                      <div key={i} className="player-pmu-row">
                        <div className="player-pmu-name">{p.name}</div>
                        <div className="player-pmu-bar-wrap">
                          <div
                            className="player-pmu-bar"
                            style={{ width: `${(p.pmu / 100) * 100}%` }}
                          />
                        </div>
                        <div className="player-pmu-val">{p.pmu.toFixed(1)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
