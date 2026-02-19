/**
 * Telemetry.js
 * Client-side event tracking and transmission for real-time coaching analytics
 *
 * Captures:
 *  - Player positions & velocities
 *  - Ball state (position, velocity)
 *  - Event types (pass, tackle, shot, etc.)
 *  - Tactical context (formation, tactic, possession)
 *  - Crowd state (noise level, sentiment)
 *
 * Batches events and transmits to /api/events endpoint
 */

export class TelemetryClient {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || 'http://localhost:5000/api';
    this.batchSize = options.batchSize || 50;
    this.flushInterval = options.flushInterval || 5000; // ms
    this.enabled = options.enabled !== false;

    this.eventQueue = [];
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.flushTimer = null;

    if (this.enabled) {
      this.startAutoFlush();
    }
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Record a discrete event (pass, shot, tackle, etc.)
   */
  trackEvent(event) {
    if (!this.enabled) return;

    const enriched = {
      ...event,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      elapsedMs: Date.now() - this.startTime,
    };

    this.eventQueue.push(enriched);

    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Record player state (position, velocity, momentum)
   */
  trackPlayerState(playerId, state) {
    this.trackEvent({
      type: 'player_state',
      playerId,
      position: state.position, // {x, y}
      velocity: state.velocity, // {vx, vy}
      pmu: state.pmu,
      fatigue: state.fatigue,
      pressure: state.pressure,
    });
  }

  /**
   * Record ball state
   */
  trackBallState(ballState) {
    this.trackEvent({
      type: 'ball_state',
      position: ballState.position, // {x, y}
      velocity: ballState.velocity, // {vx, vy}
      possession: ballState.possession,
      zone: ballState.zone, // 'defensive_third', 'middle_third', 'attacking_third'
    });
  }

  /**
   * Record discrete action (pass, shot, tackle, etc.)
   */
  trackAction(actionType, context) {
    this.trackEvent({
      type: 'action',
      actionType, // 'pass', 'shot', 'tackle', 'press', 'interception', etc.
      ...context, // {fromPlayerId, toPlayerId, zone, success, pressure, etc.}
    });
  }

  /**
   * Record match context (formation, tactic, score, crowd noise)
   */
  trackMatchContext(context) {
    this.trackEvent({
      type: 'match_context',
      formation: context.formation,
      tactic: context.tactic,
      score: context.score, // {teamA, teamB}
      possession: context.possession, // {teamA%, teamB%}
      crowdNoise: context.crowdNoise,
      minute: context.minute,
    });
  }

  /**
   * Record tactical decision point (for coaching recommendations)
   */
  trackDecisionPoint(decision) {
    this.trackEvent({
      type: 'decision_point',
      playerId: decision.playerId,
      decisionType: decision.decisionType, // 'pass_option', 'positioning', 'pressing', etc.
      options: decision.options,
      chosen: decision.chosen,
      confidence: decision.confidence,
    });
  }

  /**
   * Manually flush queued events to backend
   */
  async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(`${this.apiUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          events,
        }),
      });

      if (!response.ok) {
        console.error('[Telemetry] Failed to flush events:', response.statusText);
        // Re-queue on failure
        this.eventQueue.unshift(...events);
      } else {
        const data = await response.json();
        console.log(`[Telemetry] Flushed ${events.length} events`);
      }
    } catch (err) {
      console.error('[Telemetry] Flush error:', err);
      // Re-queue on network error
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Start periodic auto-flush
   */
  startAutoFlush() {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  /**
   * Stop auto-flush and flush remaining events
   */
  async stop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }

  /**
   * Get queue stats for debugging
   */
  getStats() {
    return {
      sessionId: this.sessionId,
      queueSize: this.eventQueue.length,
      enabled: this.enabled,
      elapsedMs: Date.now() - this.startTime,
    };
  }
}

// Export singleton instance for use across app
let telemetryInstance = null;

export function getTelemetry(options = {}) {
  if (!telemetryInstance) {
    telemetryInstance = new TelemetryClient(options);
  }
  return telemetryInstance;
}

export function resetTelemetry() {
  if (telemetryInstance) {
    telemetryInstance.stop();
  }
  telemetryInstance = null;
}
