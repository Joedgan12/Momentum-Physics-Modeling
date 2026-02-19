import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Brain, Zap, AlertCircle, Cpu, TrendingUp, Gauge, Activity } from 'lucide-react';
import io from 'socket.io-client';

export default function AICoach({ matchState = null, onTacticRecommended = null }) {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trainingStatus, setTrainingStatus] = useState('initializing');
  const [trainingProgress, setTrainingProgress] = useState(null);
  const socketRef = useRef(null);

  /* ── WebSocket ── */
  useEffect(() => {
    socketRef.current = io('http://localhost:5000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current.on('training_started', () => setTrainingStatus('training'));
    socketRef.current.on('training_progress', (d) =>
      setTrainingProgress({ ...d, status: 'in_progress' }),
    );
    socketRef.current.on('training_completed', (d) => {
      setTrainingStatus('trained');
      setTrainingProgress({ status: 'completed', ...d });
    });
    socketRef.current.on('training_fallback', (d) => {
      setTrainingStatus('trained');
      setTrainingProgress({ status: 'fallback', ...d });
    });
    socketRef.current.on('training_error', (d) => {
      setTrainingStatus('error');
      setError(d.error);
      setTrainingProgress(null);
    });

    return () => socketRef.current?.disconnect();
  }, []);

  /* ── Poll ML status on mount and periodically ── */
  useEffect(() => {
    const checkStatus = () => {
      fetch('/api/ml/status')
        .then((r) => r.json())
        .then((j) => {
          if (j.ok) {
            const trained = j.data.policy_trained;
            setTrainingStatus(trained ? 'trained' : 'untrained');
          }
        })
        .catch(() => {});
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleTrain = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/ml/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'Training failed');
      socketRef.current?.emit('subscribe_ml_training');
    } catch (e) {
      setError(e.message);
      setTrainingStatus('error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRecommend = useCallback(async () => {
    if (!matchState) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/ml/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_state: {
            formation_id: matchState.formation_id || 0,
            tactic_id: matchState.tactic_id || 0,
            possession_pct: matchState.possession_pct || 50,
            team_fatigue: matchState.team_fatigue || 50,
            momentum_pmu: matchState.momentum_pmu || 0,
            opponent_formation_id: matchState.opponent_formation_id || 1,
            opponent_tactic_id: matchState.opponent_tactic_id || 0,
            score_differential: matchState.score_differential || 0,
          },
        }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'No recommendation');
      setRecommendation(j.data.recommendation);
      onTacticRecommended?.(j.data.recommendation);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [matchState, onTacticRecommended]);

  /* Progress % */
  const progress =
    trainingProgress?.status === 'in_progress' && trainingProgress.total_episodes
      ? (trainingProgress.episode / trainingProgress.total_episodes) * 100
      : trainingStatus === 'trained'
      ? 100
      : 0;

  const statusLabel =
    {
      initializing: 'Initializing…',
      untrained: 'Not Trained',
      training: 'Training…',
      trained: 'Ready',
      error: 'Error',
    }[trainingStatus] ?? 'Unknown';

  return (
    <div className="ai-coach-panel">
      {/* Header */}
      <div className="ai-coach-header">
        <div className="ai-coach-header-left">
          <div className="ai-brain-icon">
            <Brain size={14} strokeWidth={2} />
          </div>
          <div>
            <div className="ai-coach-title">AI Tactical Coach</div>
            <div className="ai-coach-sub">
              {trainingStatus === 'trained' && recommendation?.model_mode === 'neural_network'
                ? 'Neural Policy v1'
                : 'Advanced Heuristic Engine'}
            </div>
          </div>
        </div>
        <span className={`ai-status-badge ${trainingStatus}`}>{statusLabel}</span>
      </div>

      {/* Body */}
      <div className="ai-coach-body">
        {/* Training progress bar */}
        {trainingStatus === 'training' && (
          <>
            <div className="ai-progress-bar-wrap">
              <div className="ai-progress-bar" style={{ width: `${progress}%` }} />
            </div>
            {trainingProgress?.episode != null && (
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: 8,
                }}
              >
                Episode {trainingProgress.episode} / {trainingProgress.total_episodes}
                {trainingProgress.avg_loss != null &&
                  ` · Loss ${trainingProgress.avg_loss.toFixed(4)}`}
              </div>
            )}
          </>
        )}

        {/* Train button */}
        {(trainingStatus === 'untrained' || trainingStatus === 'error') && (
          <button
            className="ai-train-btn"
            onClick={handleTrain}
            disabled={loading || trainingStatus === 'training'}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Starting…
              </>
            ) : (
              <>
                <Cpu size={12} />
                Train Policy
              </>
            )}
          </button>
        )}

        {/* Recommend button */}
        {(trainingStatus === 'trained' || trainingStatus === 'initializing') && (
          <button
            className="ai-recommend-btn"
            onClick={handleRecommend}
            disabled={loading || !matchState || trainingStatus === 'initializing'}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Analysing…
              </>
            ) : (
              <>
                <Zap size={12} />
                {trainingStatus === 'initializing' ? 'Initializing…' : 'Get Recommendation'}
              </>
            )}
          </button>
        )}

        {/* Recommendation card */}
        {recommendation && (
          <div className="ai-recommendation-card">
            <div className="ai-rec-header">
              <div className="ai-rec-formation">{recommendation.formation}</div>
              <div className="ai-rec-tactic">{recommendation.tactic.replace(/_/g, ' ')}</div>
            </div>

            {/* Confidence bar */}
            {recommendation.confidence != null && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span
                    style={{
                      fontSize: 9,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    Confidence
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--plasma)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {(recommendation.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="ai-progress-bar-wrap" style={{ margin: 0 }}>
                  <div
                    className="ai-progress-bar"
                    style={{ width: `${recommendation.confidence * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Advanced Analysis - Tactical Metrics */}
            {recommendation.advanced_analysis && (
              <div
                style={{
                  marginBottom: 10,
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 6,
                  }}
                >
                  Tactical Analysis
                </div>

                {/* Possession Meter */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <Gauge size={11} color="var(--text-secondary)" />
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Possession</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginLeft: 'auto',
                      }}
                    >
                      {recommendation.advanced_analysis.possession.value.toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>
                    {recommendation.advanced_analysis.possession.assessment}
                  </div>
                </div>

                {/* Fatigue Alert */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <Activity
                      size={11}
                      color={
                        recommendation.advanced_analysis.fatigue.risk_level === 'critical'
                          ? 'var(--warning-color)'
                          : 'var(--text-secondary)'
                      }
                    />
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Fatigue</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color:
                          recommendation.advanced_analysis.fatigue.risk_level === 'critical'
                            ? 'var(--warning-color)'
                            : 'var(--text-primary)',
                        marginLeft: 'auto',
                      }}
                    >
                      {recommendation.advanced_analysis.fatigue.value.toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>
                    {recommendation.advanced_analysis.fatigue.assessment}
                  </div>
                </div>

                {/* Momentum Indicator */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <TrendingUp
                      size={11}
                      color={
                        recommendation.advanced_analysis.momentum.direction === 'positive'
                          ? 'var(--plasma)'
                          : 'var(--text-secondary)'
                      }
                    />
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Momentum</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color:
                          recommendation.advanced_analysis.momentum.direction === 'positive'
                            ? 'var(--plasma)'
                            : 'var(--text-secondary)',
                        marginLeft: 'auto',
                      }}
                    >
                      {recommendation.advanced_analysis.momentum.value > 0 ? '+' : ''}
                      {recommendation.advanced_analysis.momentum.value.toFixed(1)}
                    </span>
                  </div>
                  <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>
                    {recommendation.advanced_analysis.momentum.assessment}
                  </div>
                </div>

                {/* Tactical Priorities */}
                {recommendation.advanced_analysis.tactical_priorities &&
                  recommendation.advanced_analysis.tactical_priorities.length > 0 && (
                    <div
                      style={{
                        marginTop: 6,
                        padding: '6px 8px',
                        background: 'rgba(102, 51, 153, 0.1)',
                        borderRadius: '4px',
                        borderLeft: '2px solid var(--violet)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: 'var(--violet)',
                          marginBottom: 3,
                        }}
                      >
                        PRIORITIES
                      </div>
                      {recommendation.advanced_analysis.tactical_priorities
                        .slice(0, 2)
                        .map((p, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: 8,
                              color: 'var(--text-muted)',
                              marginBottom: i === 0 ? 2 : 0,
                            }}
                          >
                            • {p}
                          </div>
                        ))}
                    </div>
                  )}
              </div>
            )}

            {/* Inspired coaches */}
            {recommendation.inspired_coaches?.length > 0 && (
              <div
                style={{
                  marginTop: 8,
                  marginBottom: 8,
                  paddingTop: 8,
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 5,
                  }}
                >
                  Inspired By
                </div>
                {recommendation.inspired_coaches.slice(0, 2).map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 0',
                      borderBottom: i < 1 ? '1px solid var(--border-subtle)' : 'none',
                      fontSize: 9,
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {c.name}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--violet)',
                        fontWeight: 700,
                      }}
                    >
                      {(c.alignment_score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {recommendation.reasoning && (
              <div className="ai-rec-rationale">{recommendation.reasoning}</div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="ai-error">
            <AlertCircle size={12} />
            {error}
          </div>
        )}

        {/* Footer hint */}
        <div
          style={{
            marginTop: 10,
            fontSize: 10,
            color: 'var(--text-muted)',
            textAlign: 'center',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 8,
          }}
        >
          {trainingStatus === 'initializing'
            ? 'Initializing tactical engine…'
            : trainingStatus === 'trained'
            ? !matchState
              ? 'Run a simulation to enable recommendations'
              : 'Policy network active · ready for analysis'
            : 'Train the policy network to unlock AI recommendations'}
        </div>
      </div>
    </div>
  );
}
