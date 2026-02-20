import React, { useEffect, useState, useRef } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ComposedChart,
} from 'recharts';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import './MomentumDashboard.css';

/**
 * Real-Time Momentum Intelligence Dashboard
 * 
 * What it shows:
 * 1. Live momentum curves (10-30 second granularity)
 * 2. Psychological pressure state for key players
 * 3. Inflection points and game-changing moments
 * 4. Player momentum personality profiles activated
 * 5. Clutch probability overlays
 * 6. Transition burst analysis
 */

function AnimatedGauge({ value, label, maxValue = 100, color = 'plasma' }) {
  const [displayValue, setDisplayValue] = useState(value);
  const targetRef = useRef(value);

  useEffect(() => {
    if (targetRef.current === value) return;

    targetRef.current = value;
    const start = displayValue;
    const duration = 600;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeValue = start + (value - start) * (1 - Math.pow(1 - progress, 3));
      setDisplayValue(easeValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  const percentage = (displayValue / maxValue) * 100;
  const bgColor = color === 'plasma' ? '#00d9ff' : color === 'danger' ? '#ff3366' : '#4fb3d9';

  return (
    <div className={`momentum-gauge gauge-${color}`}>
      <div className="gauge-label">{label}</div>
      <div className="gauge-container">
        <div className="gauge-arc">
          <svg viewBox="0 0 120 60" className="gauge-svg">
            <path
              d="M 10 50 A 40 40 0 0 1 110 50"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="4"
            />
            <path
              d="M 10 50 A 40 40 0 0 1 110 50"
              fill="none"
              stroke={bgColor}
              strokeWidth="4"
              strokeDasharray={`${(Math.PI * 40) * (percentage / 100)} ${Math.PI * 40}`}
              style={{
                transition: 'stroke-dasharray 0.3s ease',
              }}
            />
          </svg>
          <div className="gauge-value">
            {displayValue.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}

function MomentumCurveChart({ data, selectedTeam = 'both' }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-placeholder">
        <Activity size={32} />
        <p>Loading momentum data...</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey="minute"
          label={{ value: 'Match Minute', position: 'insideBottomRight', offset: -5 }}
          stroke="rgba(255,255,255,0.5)"
        />
        <YAxis
          domain={[0, 100]}
          label={{ value: 'Momentum Score', angle: -90, position: 'insideLeft' }}
          stroke="rgba(255,255,255,0.5)"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(10, 20, 40, 0.95)',
            border: '1px solid #00d9ff',
            borderRadius: '8px',
          }}
          formatter={(value) => value.toFixed(1)}
        />
        <Legend />

        {(selectedTeam === 'both' || selectedTeam === 'A') && (
          <Line
            type="monotone"
            dataKey="team_a_momentum"
            stroke="#00d9ff"
            dot={false}
            strokeWidth={2}
            name="Team A Momentum"
            isAnimationActive={false}
          />
        )}
        {(selectedTeam === 'both' || selectedTeam === 'B') && (
          <Line
            type="monotone"
            dataKey="team_b_momentum"
            stroke="#ff3366"
            dot={false}
            strokeWidth={2}
            name="Team B Momentum"
            isAnimationActive={false}
          />
        )}

        {/* Inflection points */}
        {data
          .filter((d) => d.is_inflection)
          .map((d, idx) => (
            <Scatter
              key={idx}
              dataKey={() => d.team_a_momentum}
              fill="#ffd700"
              shape={<AlertTriangle size={8} />}
            />
          ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function PlayerComposureCard({ player, composureState, psychoProfile }) {
  if (!player || !composureState || !psychoProfile) {
    return null;
  }

  const decisionQuality = (composureState.composure_score * composureState.confidence).toFixed(2);
  const clutchProb = (psychoProfile.clutch_factor * 100).toFixed(1);

  return (
    <div className="composure-card">
      <div className="card-header">
        <h4>{player.name}</h4>
        <span className="position-badge">{player.position}</span>
      </div>

      <div className="card-metrics">
        <div className="metric">
          <span className="metric-label">Composure</span>
          <div className="metric-bar">
            <div
              className="metric-fill"
              style={{
                width: `${(composureState.composure_score / 2) * 100}%`,
                backgroundColor: composureState.composure_score > 1 ? '#00ff00' : '#ff6b35',
              }}
            />
          </div>
          <span className="metric-value">{composureState.composure_score.toFixed(2)}</span>
        </div>

        <div className="metric">
          <span className="metric-label">Decision Quality</span>
          <div className="metric-bar">
            <div
              className="metric-fill"
              style={{
                width: `${decisionQuality * 33}%`, // 0-1.5 scale
                backgroundColor: decisionQuality > 1 ? '#00ff00' : '#ffaa00',
              }}
            />
          </div>
          <span className="metric-value">{decisionQuality}</span>
        </div>

        <div className="metric">
          <span className="metric-label">Pressure Buildup</span>
          <div className="metric-bar">
            <div
              className="metric-fill"
              style={{
                width: `${composureState.pressure_buildup * 100}%`,
                backgroundColor: composureState.pressure_buildup > 0.5 ? '#ff3366' : '#ffaa00',
              }}
            />
          </div>
          <span className="metric-value">{composureState.pressure_buildup.toFixed(2)}</span>
        </div>

        <div className="metric">
          <span className="metric-label">Clutch Probability</span>
          <div className="metric-bar">
            <div
              className="metric-fill"
              style={{
                width: `${clutchProb}%`,
                backgroundColor: clutchProb > 80 ? '#00ff00' : clutchProb > 50 ? '#ffaa00' : '#ff6b35',
              }}
            />
          </div>
          <span className="metric-value">{clutchProb}%</span>
        </div>
      </div>

      {composureState.consecutive_failures > 2 && (
        <div className="warning-banner">
          <AlertTriangle size={14} /> {composureState.consecutive_failures} consecutive failures - confidence low
        </div>
      )}

      {composureState.consecutive_successes > 2 && (
        <div className="success-banner">
          <CheckCircle size={14} /> {composureState.consecutive_successes} consecutive successes - rhythm building
        </div>
      )}
    </div>
  );
}

function InflectionPointsList({ events }) {
  const inflectionEvents = events
    .filter((e) => ['inflection', 'momentum_peak', 'momentum_trough'].includes(e.event_type))
    .slice(-10); // Last 10

  if (inflectionEvents.length === 0) {
    return <div className="empty-state">No significant moments yet</div>;
  }

  return (
    <div className="events-list">
      {inflectionEvents.map((event, idx) => (
        <div key={idx} className={`event-item event-${event.event_type}`}>
          <div className="event-time">
            {Math.floor(event.timestamp / 60)}':{(event.timestamp % 60).toString().padStart(2, '0')}
          </div>
          <div className="event-details">
            <span className="event-type">{event.event_type.replace('_', ' ').toUpperCase()}</span>
            <span className="event-player">{event.player_id}</span>
            {event.is_game_changing && <span className="badge-critical">GAME-CHANGING</span>}
          </div>
          <div className="event-magnitude" style={{ opacity: Math.min(1, event.magnitude / 100) }}>
            {event.magnitude.toFixed(0)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MomentumDashboard() {
  const [momentumData, setMomentumData] = useState([]);
  const [composureStates, setComposureStates] = useState({});
  const [psychoProfiles, setPsychoProfiles] = useState({});
  const [microMomentumEvents, setMicroMomentumEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeams, setSelectedTeams] = useState('both');
  const [matchState, setMatchState] = useState({
    minute: 0,
    teamAMomentum: 50,
    teamBMomentum: 50,
  });

  useEffect(() => {
    // Fetch momentum data from backend
    const fetchMomentumData = async () => {
      try {
        const response = await fetch('/api/momentum/dashboard');
        if (response.ok) {
          const data = await response.json();
          setMomentumData(data.timeline || []);
          setComposureStates(data.composure_states || {});
          setPsychoProfiles(data.psycho_profiles || {});
          setMicroMomentumEvents(data.events || []);
          setMatchState({
            minute: data.match_minute || 0,
            teamAMomentum: data.team_a_momentum || 50,
            teamBMomentum: data.team_b_momentum || 50,
          });
        }
      } catch (error) {
        console.error('Failed to fetch momentum data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMomentumData();
    const interval = setInterval(fetchMomentumData, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="momentum-dashboard loading">
        <div className="loading-spinner">
          <Activity size={48} />
          <p>Initializing Momentum Intelligence Engine...</p>
        </div>
      </div>
    );
  }

  const topPlayers = Object.entries(composureStates)
    .sort(([, a], [, b]) => b.composure_score - a.composure_score)
    .slice(0, 6);

  return (
    <div className="momentum-dashboard">
      <div className="dashboard-header">
        <h1>
          <Zap size={28} /> Momentum Intelligence Layer
        </h1>
        <p>Real-time psychological and physical momentum dynamics</p>
      </div>

      {/* Current Match State */}
      <div className="match-state-row">
        <AnimatedGauge value={matchState.teamAMomentum} label="Team A Momentum" color="plasma" />
        <div className="vs-divider">
          <div className="vs-text">LIVE</div>
          <div className="match-minute">{matchState.minute}'</div>
        </div>
        <AnimatedGauge value={matchState.teamBMomentum} label="Team B Momentum" color="danger" />
      </div>

      {/* Main Momentum Curve */}
      <div className="dashboard-card">
        <div className="card-title">
          <TrendingUp size={18} /> Momentum Curve (10-30 Second Granularity)
        </div>
        <div className="team-selector">
          <button
            className={selectedTeams === 'A' ? 'active' : ''}
            onClick={() => setSelectedTeams('A')}
          >
            Team A
          </button>
          <button
            className={selectedTeams === 'both' ? 'active' : ''}
            onClick={() => setSelectedTeams('both')}
          >
            Both
          </button>
          <button
            className={selectedTeams === 'B' ? 'active' : ''}
            onClick={() => setSelectedTeams('B')}
          >
            Team B
          </button>
        </div>
        <MomentumCurveChart data={momentumData} selectedTeam={selectedTeams} />
      </div>

      {/* Player Momentum Personality profiles */}
      <div className="dashboard-card">
        <div className="card-title">
          <Activity size={18} /> Player Momentum Personalities (Top Players)
        </div>
        <div className="composure-grid">
          {topPlayers.map(([playerId, state]) => (
            <PlayerComposureCard
              key={playerId}
              player={{ name: playerId, position: 'MID' }} // Fetch actual player info
              composureState={state}
              psychoProfile={psychoProfiles[playerId]}
            />
          ))}
        </div>
      </div>

      {/* Inflection Points & Game-Changing Moments */}
      <div className="dashboard-card">
        <div className="card-title">
          <AlertTriangle size={18} /> Inflection Points & Game-Changing Moments
        </div>
        <InflectionPointsList events={microMomentumEvents} />
      </div>

      {/* Stats Footer */}
      <div className="dashboard-stats">
        <div className="stat">
          <span className="stat-label">Total Inflection Points</span>
          <span className="stat-value">
            {microMomentumEvents.filter((e) => e.event_type === 'inflection').length}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Game-Changing Events</span>
          <span className="stat-value">
            {microMomentumEvents.filter((e) => e.is_game_changing).length}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Momentum Swings</span>
          <span className="stat-value">
            {microMomentumEvents.filter((e) => e.event_type === 'burst').length}
          </span>
        </div>
      </div>
    </div>
  );
}
