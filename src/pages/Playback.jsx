import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Camera, FileJson } from 'lucide-react';
import '../styles/Playback.css';

export default function Playback({ simResults }) {
  const [playbackData, setPlaybackData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showMomentum, setShowMomentum] = useState(true);
  const [showPressure, setShowPressure] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [matchEvents, setMatchEvents] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (simResults && simResults.request_id) {
      fetchPlaybackData();
      fetchMatchEvents();
    }
  }, [simResults]);

  useEffect(() => {
    if (!isPlaying || !playbackData) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        const next = prev + 1;
        if (next >= playbackData.playback_data.total_frames) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackData, playbackSpeed]);

  const fetchMatchEvents = async () => {
    try {
      const response = await fetch('/api/match-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formation: '4-3-3',
          formation_b: '4-4-2',
          tactic: 'balanced',
          tactic_b: 'balanced',
          scenario: 'Playback',
          start_minute: 0,
          end_minute: 90,
          crowd_noise: 80.0,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch match events');
      const json = await response.json();
      if (json.ok) setMatchEvents(json.data.match_events);
    } catch (err) {
      console.error('Match events error:', err);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!snapshotTitle.trim()) {
      alert('Please enter a snapshot title');
      return;
    }

    if (!playbackData?.playback_data?.frames?.[currentFrame]) {
      alert('No playback data available');
      return;
    }

    const currentFrameData = playbackData.playback_data.frames[currentFrame];
    const simId = simResults.request_id || 'default';

    try {
      const response = await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulation_id: simId,
          timestamp: currentFrameData.timestamp,
          minute: currentFrameData.minute,
          title: snapshotTitle,
          playback_frame: currentFrameData,
          match_events: matchEvents.filter((e) => e.minute === currentFrameData.minute),
        }),
      });

      if (!response.ok) throw new Error('Snapshot creation failed');
      const json = await response.json();

      if (json.ok) {
        setSnapshots([
          ...snapshots,
          {
            id: json.data.snapshot_id,
            title: snapshotTitle,
            minute: currentFrameData.minute,
          },
        ]);
        setSnapshotTitle('');
        alert(`Snapshot saved: ${snapshotTitle}`);
      }
    } catch (err) {
      console.error('Snapshot error:', err);
      alert('Failed to create snapshot');
    }
  };

  const handleUnityExport = async () => {
    if (!playbackData || !matchEvents) {
      alert('Playback data not loaded');
      return;
    }

    setExporting(true);
    try {
      const response = await fetch('/api/unity-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'json',
          playback_data: playbackData,
          match_events: matchEvents,
        }),
      });

      if (!response.ok) throw new Error('Export failed');
      const json = await response.json();

      if (json.ok) {
        // Download as JSON
        const unityData = json.data.unity_export;
        const dataStr = JSON.stringify(unityData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `unity_export_${new Date().getTime()}.json`;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        alert('Unity export successful!');
      }
    } catch (err) {
      console.error('Unity export error:', err);
      alert('Unity export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const fetchPlaybackData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/playback-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sim_results: simResults,
          time_step: 10,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status}`);
      }

      const json = await response.json();
      if (!json.ok) throw new Error(json.error || 'Failed to fetch playback data');

      setPlaybackData(json.data);
      setCurrentFrame(0);
    } catch (err) {
      console.error('Playback data error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentFrameEvents = matchEvents.filter(
    (e) => e.minute === (playbackData?.playback_data?.frames[currentFrame]?.minute || 0),
  );

  if (!simResults) {
    return (
      <div className="playback-page">
        <div className="command-header">
          <div className="command-identity">
            <div className="cmd-label">Temporal Analysis</div>
            <h1>3D Match Playback</h1>
            <p>Run a simulation first to generate playback data</p>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-icon">⚽</div>
          <h3>No Simulation Data</h3>
          <p>No simulation data available. Go to Overview and run a simulation.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="playback-page">
        <div className="command-header">
          <div className="command-identity">
            <div className="cmd-label">Temporal Analysis</div>
            <h1>3D Match Playback</h1>
          </div>
        </div>
        <div
          className="panel"
          style={{ borderColor: 'var(--danger)', background: 'var(--risk-dim)' }}
        >
          <div
            style={{
              color: 'var(--danger)',
              fontWeight: '700',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ⚠ Error loading playback data: {error}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="playback-page">
        <div className="command-header">
          <div className="command-identity">
            <div className="cmd-label">Temporal Analysis</div>
            <h1>3D Match Playback</h1>
          </div>
        </div>
        <div className="empty-state">
          <div
            className="empty-icon"
            style={{ fontSize: '32px', opacity: 0.6, animation: 'spin 1s linear infinite' }}
          >
            ⚽
          </div>
          <h3>Generating Playback</h3>
          <p>Building frame-by-frame match data...</p>
        </div>
      </div>
    );
  }

  if (!playbackData || !playbackData.playback_data) {
    return (
      <div className="playback-page">
        <div className="command-header">
          <div className="command-identity">
            <div className="cmd-label">Temporal Analysis</div>
            <h1>3D Match Playback</h1>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-icon">⚽</div>
          <h3>No Playback Data</h3>
          <p>No playback data was generated</p>
        </div>
      </div>
    );
  }

  const currentFrameData = playbackData?.playback_data?.frames[currentFrame];
  const analytics = playbackData?.analytics || {
    team_a_xg: 0,
    team_b_xg: 0,
    momentum_delta: 0,
    expected_winner: 'Unknown',
  };

  return (
    <div className="playback-page">
      <div className="command-header">
        <div className="command-identity">
          <div className="cmd-label">Temporal Analysis</div>
          <h1>3D Match Playback</h1>
          <p>Visualize player positions, momentum, and pressure zones throughout the match</p>
        </div>
      </div>

      <div className="playback-container">
        {/* 3D Field Visualization */}
        <div className="field-wrapper">
          <svg className="field-svg" viewBox="0 0 105 68" preserveAspectRatio="xMidYMid meet">
            {/* Field background */}
            <defs>
              <linearGradient id="fieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2d5016" />
                <stop offset="100%" stopColor="#1f3701" />
              </linearGradient>
            </defs>
            <rect width="105" height="68" fill="url(#fieldGradient)" />

            {/* Field lines */}
            <rect
              x="1"
              y="1"
              width="103"
              height="66"
              fill="none"
              stroke="#fff"
              strokeWidth="0.15"
            />
            <circle cx="52.5" cy="34" r="9.15" fill="none" stroke="#fff" strokeWidth="0.15" />
            <circle cx="52.5" cy="34" r="0.5" fill="#fff" />
            <line x1="52.5" y1="1" x2="52.5" y2="67" stroke="#fff" strokeWidth="0.15" />
            <rect
              x="5"
              y="13.84"
              width="16.5"
              height="40.32"
              fill="none"
              stroke="#fff"
              strokeWidth="0.15"
            />
            <path d="M 9 34 Q 11 34 11 34" fill="none" stroke="#fff" strokeWidth="0.15" />
            <rect
              x="83.5"
              y="13.84"
              width="16.5"
              height="40.32"
              fill="none"
              stroke="#fff"
              strokeWidth="0.15"
            />
            <path d="M 96 34 Q 94 34 94 34" fill="none" stroke="#fff" strokeWidth="0.15" />

            {/* Pressure zones (if enabled and data exists) */}
            {showPressure &&
              currentFrameData?.pressure_zones?.map((zone, idx) => (
                <g key={`pressure-${idx}`}>
                  <circle
                    cx={zone.x}
                    cy={zone.y}
                    r={zone.radius / 7}
                    fill={zone.team === 'team_a' ? '#667EEA' : '#F093FB'}
                    opacity={zone.intensity / 300}
                  />
                </g>
              ))}

            {/* Team A players */}
            {currentFrameData?.players?.team_a?.map((player) => (
              <g
                key={`player-${player.id}`}
                onClick={() => setSelectedPlayer(player)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={player.x}
                  cy={player.y}
                  r={0.8}
                  fill="#667EEA"
                  stroke={selectedPlayer?.id === player.id ? '#fff' : '#4F46E5'}
                  strokeWidth={selectedPlayer?.id === player.id ? '0.2' : '0.1'}
                  opacity={0.85}
                />
                <text
                  x={player.x}
                  y={player.y}
                  textAnchor="middle"
                  dy="0.3"
                  fontSize="0.5"
                  fill="#fff"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {player.id.replace('A', '')}
                </text>
              </g>
            ))}

            {/* Team B players */}
            {currentFrameData?.players?.team_b?.map((player) => (
              <g
                key={`player-${player.id}`}
                onClick={() => setSelectedPlayer(player)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={player.x}
                  cy={player.y}
                  r={0.8}
                  fill="#F093FB"
                  stroke={selectedPlayer?.id === player.id ? '#fff' : '#EC4899'}
                  strokeWidth={selectedPlayer?.id === player.id ? '0.2' : '0.1'}
                  opacity={0.85}
                />
                <text
                  x={player.x}
                  y={player.y}
                  textAnchor="middle"
                  dy="0.3"
                  fontSize="0.5"
                  fill="#fff"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {player.id.replace('B', '')}
                </text>
              </g>
            ))}

            {/* Ball */}
            <circle
              cx={currentFrameData?.ball?.x || 52.5}
              cy={currentFrameData?.ball?.y || 34}
              r={0.35}
              fill="#FCD34D"
              stroke="#F59E0B"
              strokeWidth="0.1"
            />
          </svg>

          {/* Field Legend */}
          <div className="field-legend">
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#667EEA' }}></div>
              <span>Team A</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#F093FB' }}></div>
              <span>Team B</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#FCD34D' }}></div>
              <span>Ball</span>
            </div>
          </div>
        </div>

        {/* Controls & Data */}
        <div className="playback-right">
          {/* Playback Controls */}
          <div className="controls-card">
            <h3>Playback Controls</h3>

            {/* Timeline */}
            <div className="timeline">
              <input
                type="range"
                min="0"
                max={(playbackData?.playback_data?.total_frames || 1) - 1}
                value={currentFrame}
                onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
                className="timeline-slider"
              />
              <div className="timeline-info">
                <span>{currentFrameData?.minute || 0}&apos;</span>
                <span>
                  {currentFrame} / {(playbackData?.playback_data?.total_frames || 1) - 1}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="button-grid">
              <button
                className="control-btn"
                onClick={() => setCurrentFrame(0)}
                title="Reset to start"
              >
                <SkipBack size={16} />
              </button>
              <button
                className="control-btn"
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                className="control-btn"
                onClick={() => setCurrentFrame(playbackData.playback_data.total_frames - 1)}
                title="Jump to end"
              >
                <SkipForward size={16} />
              </button>
            </div>

            {/* Recording & Export */}
            <div
              style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Snapshot title..."
                  value={snapshotTitle}
                  onChange={(e) => setSnapshotTitle(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateSnapshot()}
                />
                <button
                  onClick={handleCreateSnapshot}
                  style={{
                    padding: '6px 10px',
                    background: '#667eea',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                  title="Create snapshot of current frame"
                >
                  <Camera size={14} /> Save
                </button>
              </div>
              <button
                onClick={handleUnityExport}
                disabled={exporting}
                style={{
                  padding: '8px 12px',
                  background: 'var(--pulse)',
                  color: 'var(--void)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: exporting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  fontFamily: 'var(--font-mono)',
                  opacity: exporting ? 0.5 : 1,
                }}
              >
                <FileJson size={14} /> Unity Export
              </button>
            </div>

            {/* Speed Control */}
            <div className="speed-control">
              <label>Playback Speed</label>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>

            {/* Overlay Toggles */}
            <div className="toggles">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={showMomentum}
                  onChange={(e) => setShowMomentum(e.target.checked)}
                />
                <span>Show Momentum Labels</span>
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={showPressure}
                  onChange={(e) => setShowPressure(e.target.checked)}
                />
                <span>Show Pressure Zones</span>
              </label>
            </div>
          </div>

          {/* Match Analytics */}
          <div className="analytics-card card-hero gradient-primary">
            <h3>Match Analytics</h3>
            <div className="analytics-grid">
              <div className="metric-box">
                <div className="metric-label">Team A xG</div>
                <div className="metric-value">{(analytics?.team_a_xg ?? 0).toFixed(3)}</div>
              </div>
              <div className="metric-box">
                <div className="metric-label">Team B xG</div>
                <div className="metric-value">{(analytics?.team_b_xg ?? 0).toFixed(3)}</div>
              </div>
              <div className="metric-box">
                <div className="metric-label">Momentum Δ</div>
                <div
                  className="metric-value"
                  style={{
                    color:
                      (analytics?.momentum_delta ?? 0) > 0
                        ? 'var(--plasma)'
                        : (analytics?.momentum_delta ?? 0) < 0
                          ? 'var(--danger)'
                          : 'var(--text-muted)',
                  }}
                >
                  {(analytics?.momentum_delta ?? 0) > 0 ? '+' : ''}
                  {(analytics?.momentum_delta ?? 0).toFixed(2)}
                </div>
              </div>
              <div className="metric-box">
                <div className="metric-label">Expected Winner</div>
                <div className="metric-value" style={{ fontSize: '13px' }}>
                  {analytics?.expected_winner || 'Unknown'}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Player Info */}
          {selectedPlayer && (
            <div className="player-info card-hero">
              <h3>Player Details</h3>
              <div className="player-stats">
                <div className="stat">
                  <span className="label">ID</span>
                  <span className="value">{selectedPlayer.id}</span>
                </div>
                <div className="stat">
                  <span className="label">Position</span>
                  <span className="value" style={{ textTransform: 'capitalize' }}>
                    {selectedPlayer.action}
                  </span>
                </div>
                <div className="stat">
                  <span className="label">PMU</span>
                  <span className="value">{(selectedPlayer?.pmu ?? 0).toFixed(2)}</span>
                </div>
                <div className="stat">
                  <span className="label">Coordinates</span>
                  <span className="value">
                    {(selectedPlayer?.x ?? 0).toFixed(1)}, {(selectedPlayer?.y ?? 0).toFixed(1)}
                  </span>
                </div>
              </div>
              <button
                className="btn-secondary"
                onClick={() => setSelectedPlayer(null)}
                style={{ width: '100%', marginTop: '12px' }}
              >
                Deselect
              </button>
            </div>
          )}

          {/* Frame Events */}
          {currentFrameEvents.length > 0 && (
            <div
              className="notes-card"
              style={{ background: 'rgba(245,158,11,0.08)', borderLeftColor: 'var(--flare)' }}
            >
              <h4 style={{ color: 'var(--flare)', margin: '0 0 8px 0' }}>
                Events at {currentFrameData?.minute || 0}&apos;
              </h4>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  maxHeight: '120px',
                  overflowY: 'auto',
                }}
              >
                {currentFrameEvents.slice(0, 5).map((evt, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: '4px',
                      paddingBottom: '4px',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                      }}
                    >
                      {evt.player_id} — {evt.event_type}
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}>
                      {evt.action} (impact: {evt.impact})
                    </div>
                  </div>
                ))}
                {currentFrameEvents.length > 5 && (
                  <div
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    +{currentFrameEvents.length - 5} more events
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Snapshots */}
          <div className="analytics-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <h3 style={{ margin: 0 }}>Snapshots ({snapshots.length})</h3>
              <button
                onClick={() => setShowSnapshots(!showSnapshots)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: 'var(--plasma)',
                  fontWeight: '700',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {showSnapshots ? 'Hide' : 'Show'}
              </button>
            </div>
            {showSnapshots && snapshots.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    style={{
                      background: 'var(--plasma-dim)',
                      border: '1px solid var(--border-accent)',
                      borderRadius: '6px',
                      padding: '8px',
                      fontSize: '11px',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: '700',
                        color: 'var(--plasma)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {snap.title}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '2px' }}>
                      @ {snap.minute}&apos;
                    </div>
                  </div>
                ))}
              </div>
            )}
            {snapshots.length === 0 && (
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  padding: '12px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                No snapshots yet. Use the camera button to save key moments.
              </div>
            )}
          </div>

          {/* Integration Notes */}
          <div className="notes-card">
            <h4>Unity Integration</h4>
            <p
              style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.6' }}
            >
              Click &quot;Unity Export&quot; to download playback data compatible with Unity 3D.
              Import as JSON to visualize player positions, momentum heatmaps, and overlay tactical
              analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
