/**
 * SimulationEngineWithTelemetry.js
 * Wraps SimulationEngine with telemetry event emission
 * for real-time data collection and Monte Carlo rollout training
 */

import { SimulationEngine } from './SimulationEngine';
import { getTelemetry } from './Telemetry';

export class SimulationEngineWithTelemetry extends SimulationEngine {
  constructor(telemetryOptions = {}) {
    super();
    this.telemetry = getTelemetry(telemetryOptions);
  }

  /**
   * Override simulateIteration to emit telemetry events
   */
  simulateIteration(config) {
    const result = super.simulateIteration(config);

    // Emit match context
    this.telemetry.trackMatchContext({
      formation: config.formation,
      tactic: config.tactic,
      score: { teamA: 0, teamB: 0 },
      possession: { teamA: 50, teamB: 50 },
      crowdNoise: config.crowdNoise || 75,
      minute: config.minute || 45,
    });

    // Emit team A player states
    this.players.teamA.forEach((player, idx) => {
      this.telemetry.trackPlayerState(player.id, {
        position: { x: 50 + Math.random() * 20, y: 34 + Math.random() * 20 },
        velocity: { vx: Math.random() * 2, vy: Math.random() * 2 },
        pmu: result.teamAPMUs[idx],
        fatigue: 0,
        pressure: 0,
      });
    });

    // Emit team B player states
    this.players.teamB.forEach((player, idx) => {
      this.telemetry.trackPlayerState(player.id, {
        position: { x: 50 + Math.random() * 20, y: 34 + Math.random() * 20 },
        velocity: { vx: Math.random() * 2, vy: Math.random() * 2 },
        pmu: result.teamBPMUs[idx],
        fatigue: 0,
        pressure: 0,
      });
    });

    // Emit ball state
    this.telemetry.trackBallState({
      position: { x: 52.5, y: 34.0 },
      velocity: { vx: 0, vy: 0 },
      possession: Math.random() > 0.5 ? 'A' : 'B',
      zone: 'middle_third',
    });

    return result;
  }

  /**
   * Fetch and run Monte Carlo rollouts for current state
   */
  async fetchRollouts(config = {}) {
    try {
      const sessionId = this.telemetry.sessionId;
      const response = await fetch('http://localhost:5000/api/rollouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          formation: config.formation || '4-3-3',
          tactic: config.tactic || 'balanced',
          crowdNoise: config.crowdNoise || 80.0,
          iterations: config.iterations || 1000,
          forecastMinutes: config.forecastMinutes || 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`Rollout failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.ok) {
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('[SimulationEngine] Rollout fetch error:', err);
      throw err;
    }
  }

  /**
   * Stop telemetry and clean up
   */
  async shutdown() {
    await this.telemetry.stop();
  }
}
