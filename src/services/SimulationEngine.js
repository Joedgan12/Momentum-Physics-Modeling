/**
 * SimulationEngine
 * Core physics-based momentum simulation for football analytics
 */

// Event impact base values (PMU units)
const EVENT_IMPACTS = {
  tackle: 5,
  interception: 3,
  pass: 2,
  shot: 4,
  goal: 15,
  goal_conceded: -10,
  foul: -3,
};

// Player resilience factors (0-1, momentum persistence)
const RESILIENCE = {
  veteran: 0.9,
  experienced: 0.75,
  young: 0.6,
  rookie: 0.45,
};

// Formation-specific modifiers
const FORMATION_COHERENCE = {
  '4-3-3': 0.87,
  '3-5-2': 0.82,
  '5-3-2': 0.85,
  '4-2-4': 0.78,
};

// Tactic modifiers
const TACTIC_MODIFIERS = {
  aggressive: { pmu: 1.2, offBall: 0.85, possession: 0.95 },
  balanced: { pmu: 1.0, offBall: 1.0, possession: 1.0 },
  defensive: { pmu: 0.75, offBall: 1.25, possession: 0.8 },
  possession: { pmu: 1.15, offBall: 0.8, possession: 1.2 },
};

export class SimulationEngine {
  constructor() {
    this.players = this.initializePlayers();
  }

  /**
   * Initialize 22 players with positions, roles, and attributes
   */
  initializePlayers() {
    const teamA = [
      { id: 'A1', name: 'Goalkeeper', pos: 'GK', role: 'Keeper', resilience: 'veteran' },
      { id: 'A2', name: 'Defender 1', pos: 'DEF', role: 'Defender', resilience: 'experienced' },
      { id: 'A3', name: 'Defender 2', pos: 'DEF', role: 'Defender', resilience: 'experienced' },
      { id: 'A4', name: 'Defender 3', pos: 'DEF', role: 'Defender', resilience: 'young' },
      { id: 'A5', name: 'Midfielder 1', pos: 'MID', role: 'Midfielder', resilience: 'experienced' },
      { id: 'A6', name: 'Midfielder 2', pos: 'MID', role: 'Midfielder', resilience: 'experienced' },
      { id: 'A7', name: 'Midfielder 3', pos: 'MID', role: 'Midfielder', resilience: 'young' },
      { id: 'A8', name: 'Forward 1', pos: 'FWD', role: 'Forward', resilience: 'veteran' },
      { id: 'A9', name: 'Forward 2', pos: 'FWD', role: 'Forward', resilience: 'young' },
      { id: 'A10', name: 'Forward 3', pos: 'FWD', role: 'Forward', resilience: 'experienced' },
      { id: 'A11', name: 'Defender 4', pos: 'DEF', role: 'Defender', resilience: 'young' },
    ];

    const teamB = [
      { id: 'B1', name: 'Goalkeeper', pos: 'GK', role: 'Keeper', resilience: 'veteran' },
      { id: 'B2', name: 'Defender 1', pos: 'DEF', role: 'Defender', resilience: 'experienced' },
      { id: 'B3', name: 'Defender 2', pos: 'DEF', role: 'Defender', resilience: 'veteran' },
      { id: 'B4', name: 'Defender 3', pos: 'DEF', role: 'Defender', resilience: 'young' },
      { id: 'B5', name: 'Midfielder 1', pos: 'MID', role: 'Midfielder', resilience: 'experienced' },
      { id: 'B6', name: 'Midfielder 2', pos: 'MID', role: 'Midfielder', resilience: 'young' },
      { id: 'B7', name: 'Midfielder 3', pos: 'MID', role: 'Midfielder', resilience: 'experienced' },
      { id: 'B8', name: 'Forward 1', pos: 'FWD', role: 'Forward', resilience: 'young' },
      { id: 'B9', name: 'Forward 2', pos: 'FWD', role: 'Forward', resilience: 'veteran' },
      { id: 'B10', name: 'Forward 3', pos: 'FWD', role: 'Forward', resilience: 'experienced' },
      { id: 'B11', name: 'Defender 4', pos: 'DEF', role: 'Defender', resilience: 'young' },
    ];

    return { teamA, teamB };
  }

  /**
   * Compute Player Momentum Units (PMU) for a single player
   * PMU = BaseEnergy + EventImpact + CrowdImpact - Fatigue
   */
  computePMU(player, eventHistory, crowdNoise = 75, timeElapsed = 45) {
    const resilience = RESILIENCE[player.resilience] || 0.7;

    // Base energy (position-dependent)
    let baseEnergy =
      player.pos === 'GK' ? 8 : player.pos === 'DEF' ? 12 : player.pos === 'MID' ? 15 : 18;

    // Event impacts (sum of recent events)
    let eventImpact = eventHistory.reduce((sum, evt) => {
      const impact = EVENT_IMPACTS[evt.type] || 1;
      return sum + impact;
    }, 0);

    // Crowd impact (±10% based on noise and experience)
    const crowdModifier = (crowdNoise / 100) * (1 - resilience * 0.3);
    let crowdImpact = crowdModifier * 3;

    // Fatigue (increases over time)
    const fatigueRate = (timeElapsed / 90) * (1 - resilience * 0.5);
    let fatigue = fatigueRate * 8;

    // PMU calculation with resilience factor
    let pmu = (baseEnergy + eventImpact + crowdImpact - fatigue) * resilience;

    return Math.max(0, Math.min(100, pmu)); // Clamp 0-100
  }

  /**
   * Calculate pressure propagation from one team to another
   */
  computePressure(teamA, teamB, formationCoherence, tacticMod) {
    const offBallFactor = 0.6 + formationCoherence * 0.4;
    const possessionFactor = 0.5 + formationCoherence * 0.5;

    return {
      possession: Math.random() * 0.4 * possessionFactor * tacticMod.possession,
      offBall: Math.random() * 0.5 * offBallFactor * tacticMod.offBall,
      transition: Math.random() * 0.35,
    };
  }

  /**
   * Run a single Monte Carlo simulation iteration
   */
  simulateIteration(config) {
    const formation = config.formation;
    const tactic = TACTIC_MODIFIERS[config.tactic];
    const coherence = FORMATION_COHERENCE[formation];

    // Simulate events throughout the match
    const events = [
      { type: 'pass', count: Math.floor(Math.random() * 15) + 10 },
      { type: 'tackle', count: Math.floor(Math.random() * 8) + 3 },
      { type: 'shot', count: Math.floor(Math.random() * 4) + 1 },
      { type: 'interception', count: Math.floor(Math.random() * 5) + 2 },
    ];

    // Calculate PMU for each player based on events
    const teamAPMUs = this.players.teamA.map((p) => {
      const playerEvents = events.flatMap((e) => Array(e.count).fill({ type: e.type }));
      return this.computePMU(p, playerEvents, 75, 45) * tactic.pmu;
    });

    const teamBPMUs = this.players.teamB.map((p) => {
      const playerEvents = events.flatMap((e) => Array(e.count).fill({ type: e.type }));
      return this.computePMU(p, playerEvents, 72, 45) * tactic.pmu;
    });

    // Calculate pressure streams
    const pressureA = this.computePressure(
      this.players.teamA,
      this.players.teamB,
      coherence,
      tactic,
    );
    const pressureB = this.computePressure(this.players.teamB, this.players.teamA, coherence, {
      possession: 1 / tactic.possession,
      offBall: 1 / tactic.offBall,
      transition: 1,
    });

    // Goal probability based on momentum and pressure
    const avgMomentumA = teamAPMUs.reduce((a, b) => a + b) / teamAPMUs.length;
    const avgMomentumB = teamBPMUs.reduce((a, b) => a + b) / teamBPMUs.length;

    const goalProb = Math.min(0.5, (avgMomentumA / 50 - avgMomentumB / 60) * 0.15);

    return {
      teamAPMUs,
      teamBPMUs,
      avgMomentumA,
      avgMomentumB,
      pressureA,
      pressureB,
      goalProb: Math.max(0, goalProb),
    };
  }

  /**
   * Run N simulations and aggregate results
   */
  runScenarioSimulation(config) {
    const iterations = config.iterations || 1000;
    const results = {
      iterations: 0,
      totalPMU: 0,
      peakPMU: 0,
      avgPMU: 0,
      goalProbability: 0,
      playerMomentum: [],
      teamAPressure: { possession: 0, offBall: 0, transition: 0 },
      teamBPressure: { possession: 0, offBall: 0, transition: 0 },
    };

    const playerPMUAccum = new Map();

    for (let i = 0; i < iterations; i++) {
      const iter = this.simulateIteration(config);

      results.totalPMU += iter.avgMomentumA + iter.avgMomentumB;
      results.peakPMU = Math.max(
        results.peakPMU,
        Math.max(...iter.teamAPMUs),
        Math.max(...iter.teamBPMUs),
      );
      results.goalProbability += iter.goalProb;

      results.teamAPressure.possession += iter.pressureA.possession;
      results.teamAPressure.offBall += iter.pressureA.offBall;
      results.teamAPressure.transition += iter.pressureA.transition;

      results.teamBPressure.possession += iter.pressureB.possession;
      results.teamBPressure.offBall += iter.pressureB.offBall;
      results.teamBPressure.transition += iter.pressureB.transition;

      // Accumulate player PMU
      this.players.teamA.forEach((p, idx) => {
        if (!playerPMUAccum.has(p.id)) playerPMUAccum.set(p.id, []);
        playerPMUAccum.get(p.id).push(iter.teamAPMUs[idx]);
      });

      results.iterations++;
    }

    // Average results
    results.avgPMU = results.totalPMU / (results.iterations * 2);
    results.goalProbability /= results.iterations;
    results.teamAPressure.possession /= results.iterations;
    results.teamAPressure.offBall /= results.iterations;
    results.teamAPressure.transition /= results.iterations;
    results.teamBPressure.possession /= results.iterations;
    results.teamBPressure.offBall /= results.iterations;
    results.teamBPressure.transition /= results.iterations;

    // Build player momentum summary
    const topPlayers = Array.from(playerPMUAccum.entries())
      .map(([id, pmuls]) => {
        const player = this.players.teamA.find((p) => p.id === id);
        return {
          name: player.name,
          position: player.pos,
          pmu: pmuls.reduce((a, b) => a + b) / pmuls.length,
        };
      })
      .sort((a, b) => b.pmu - a.pmu)
      .slice(0, 8);

    results.playerMomentum = topPlayers;

    return results;
  }
}
