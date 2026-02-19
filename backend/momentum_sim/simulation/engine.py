"""
momentum_sim/simulation/engine.py

THE CORE SIMULATION ENGINE
==========================
Self-contained implementation of the full physics-based momentum model:

  PMU_i,t = E_base + Σ EventImpact_i,t^k + CrowdImpact_i,t − Fatigue_i,t

Includes:
  • PlayerState      — per-player runtime state
  • EventProcessor   — contextual event impact with all modifiers
  • FatigueModel     — speed/distance/sprint accumulation + recovery
  • DecayModel       — exponential + linear momentum decay
  • PressureEngine   — distance decay, cone factor, line-of-sight
  • CrowdEngine      — biometric + noise → PMU adjustment
  • FormationEngine  — coherence metric from spatial variance
  • AgentDecision    — stochastic heuristic player decisions
  • MonteCarloEngine — N-iteration scenario simulation
"""

from __future__ import annotations

import math
import random
import statistics
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

import numpy as np

# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────

PITCH_LENGTH = 105.0
PITCH_WIDTH  =  68.0

BASE_ENERGY = {"GK": 8.0, "DEF": 12.0, "MID": 15.0, "FWD": 18.0}

EVENT_BASE_IMPACTS: Dict[str, float] = {
    "pass":              2.0,
    "key_pass":          3.5,
    "through_ball":      4.0,
    "cross":             2.5,
    "tackle":            5.0,
    "tackle_won":        6.0,
    "interception":      3.0,
    "clearance":         2.0,
    "shot":              4.0,
    "shot_on_target":    5.5,
    "goal":             15.0,
    "goal_conceded":   -10.0,
    "save":              5.0,
    "foul":             -3.0,
    "yellow_card":      -4.0,
    "red_card":        -12.0,
    "turnover":         -2.5,
    "dribble":           3.0,
    "dribble_success":   4.5,
    "press":             1.5,
}

POSITION_MODS: Dict[str, Dict[str, float]] = {
    "GK":  {"save": 1.5, "tackle": 0.9, "pass": 0.8},
    "DEF": {"tackle": 1.3, "tackle_won": 1.4, "clearance": 1.4, "interception": 1.3, "goal": 1.8},
    "MID": {"pass": 1.2, "key_pass": 1.3, "through_ball": 1.4, "goal": 1.5},
    "FWD": {"shot": 1.3, "shot_on_target": 1.4, "goal": 1.2, "dribble_success": 1.3},
}

GAME_STATE_MODS = {"leading": 0.9, "tied": 1.0, "losing": 1.2}
ZONE_MODS       = {"defensive_third": 0.8, "middle_third": 1.0, "attacking_third": 1.5}

RESILIENCE_MAP = {
    "veteran":     0.90,
    "experienced": 0.75,
    "young":       0.60,
    "rookie":      0.45,
}

FORMATION_COHERENCE = {
    "4-3-3": 0.87, "3-5-2": 0.82, "5-3-2": 0.85,
    "4-2-4": 0.78, "4-4-2": 0.84, "3-4-3": 0.80,
    "4-2-3-1": 0.86, "4-1-4-1": 0.83, "4-3-2-1": 0.82,
}


def compute_formation_coherence(formation: str) -> float:
    """
    Compute a coherence score (0.70–0.92) for any formation string.

    Uses a physics-based heuristic:
      - Balanced line distributions score higher
      - 3 lines is optimal; 2 or 4+ incur a small penalty
      - High variance between line sizes reduces score
    """
    # Return cached value if preset
    if formation in FORMATION_COHERENCE:
        return FORMATION_COHERENCE[formation]

    try:
        parts = [int(x) for x in formation.split('-')]
        n = len(parts)
        mean = sum(parts) / n
        variance = sum((p - mean) ** 2 for p in parts) / n

        # Penalise deviation from 3 lines, and high spread
        layer_penalty   = 0.015 * abs(n - 3)
        variance_penalty = variance * 0.018

        score = 0.88 - layer_penalty - variance_penalty
        return round(max(0.70, min(0.92, score)), 2)
    except Exception:
        return 0.82

TACTIC_MODS: Dict[str, Dict[str, float]] = {
    "aggressive": {"pmu": 1.20, "off_ball": 0.85, "possession": 0.95, "press": 1.35},
    "balanced":   {"pmu": 1.00, "off_ball": 1.00, "possession": 1.00, "press": 1.00},
    "defensive":  {"pmu": 0.75, "off_ball": 1.25, "possession": 0.80, "press": 0.70},
    "possession": {"pmu": 1.15, "off_ball": 0.80, "possession": 1.20, "press": 0.90},
}

DECAY_RATES = {
    "goal": 0.20, "goal_conceded": 0.25, "tackle": 0.15,
    "shot": 0.12, "pass": 0.05, "foul": 0.08, "default": 0.08,
}

GOAL_CONCEDED_LAMBDA = 0.03     # PMU(t) = PMU₀ · e^(−λt)
PRESSURE_DECAY_RADIUS = 6.0     # metres
PRESSURE_CONE_DEG     = 120.0

# ─────────────────────────────────────────────────────────────────────────────
# MATCH SQUAD (22 players with realistic names and attributes)
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_SQUAD: List[Dict] = [
    # Team A
    {"id":"A1", "name":"M. Salah",         "team":"A","pos":"FWD","tier":"veteran",    "skill":9.2,"speed":9.1,"exp":10},
    {"id":"A2", "name":"K. De Bruyne",      "team":"A","pos":"MID","tier":"veteran",    "skill":9.0,"speed":8.4,"exp":12},
    {"id":"A3", "name":"V. van Dijk",       "team":"A","pos":"DEF","tier":"veteran",    "skill":8.8,"speed":7.6,"exp":11},
    {"id":"A4", "name":"T. Alexander-Arnold","team":"A","pos":"DEF","tier":"experienced","skill":8.5,"speed":8.7,"exp":7},
    {"id":"A5", "name":"H. Kane",           "team":"A","pos":"FWD","tier":"veteran",    "skill":8.9,"speed":7.8,"exp":10},
    {"id":"A6", "name":"B. Saka",           "team":"A","pos":"FWD","tier":"young",      "skill":8.4,"speed":8.8,"exp":4},
    {"id":"A7", "name":"R. James",          "team":"A","pos":"DEF","tier":"experienced","skill":8.2,"speed":8.5,"exp":6},
    {"id":"A8", "name":"D. Rice",           "team":"A","pos":"MID","tier":"experienced","skill":8.3,"speed":8.1,"exp":7},
    {"id":"A9", "name":"P. Foden",          "team":"A","pos":"MID","tier":"experienced","skill":8.7,"speed":8.6,"exp":7},
    {"id":"A10","name":"L. Dunk",           "team":"A","pos":"DEF","tier":"veteran",    "skill":7.9,"speed":7.2,"exp":10},
    {"id":"A11","name":"A. Ramsdale",       "team":"A","pos":"GK", "tier":"experienced","skill":8.0,"speed":6.5,"exp":6},
    # Team B
    {"id":"B1", "name":"E. Haaland",        "team":"B","pos":"FWD","tier":"young",      "skill":9.3,"speed":9.5,"exp":4},
    {"id":"B2", "name":"B. Fernandes",      "team":"B","pos":"MID","tier":"veteran",    "skill":8.6,"speed":8.2,"exp":10},
    {"id":"B3", "name":"R. Dias",           "team":"B","pos":"DEF","tier":"veteran",    "skill":8.7,"speed":7.9,"exp":9},
    {"id":"B4", "name":"T. Koulibaly",      "team":"B","pos":"DEF","tier":"veteran",    "skill":8.5,"speed":7.8,"exp":11},
    {"id":"B5", "name":"J. Bellingham",     "team":"B","pos":"MID","tier":"experienced","skill":8.9,"speed":8.7,"exp":5},
    {"id":"B6", "name":"V. Osimhen",        "team":"B","pos":"FWD","tier":"experienced","skill":8.6,"speed":9.2,"exp":5},
    {"id":"B7", "name":"F. de Jong",        "team":"B","pos":"MID","tier":"experienced","skill":8.5,"speed":8.3,"exp":6},
    {"id":"B8", "name":"T. Hernandez",      "team":"B","pos":"DEF","tier":"experienced","skill":8.1,"speed":9.0,"exp":6},
    {"id":"B9", "name":"K. Havertz",        "team":"B","pos":"FWD","tier":"experienced","skill":8.2,"speed":8.4,"exp":5},
    {"id":"B10","name":"E. Camavinga",      "team":"B","pos":"MID","tier":"young",      "skill":8.3,"speed":8.6,"exp":3},
    {"id":"B11","name":"E. Mendy",          "team":"B","pos":"GK", "tier":"veteran",    "skill":8.4,"speed":6.8,"exp":9},
]


# ─────────────────────────────────────────────────────────────────────────────
# PLAYER STATE
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class PlayerState:
    """Mutable snapshot of one player's momentum state during a simulation."""
    id: str
    name: str
    position: str
    team: str
    resilience_tier: str
    skill: float
    speed: float

    # PMU components
    baseline_energy: float = 0.0
    event_impact: float    = 0.0
    crowd_impact: float    = 0.0
    fatigue: float         = 0.0
    pmu: float             = 0.0

    # Pitch state
    x: float = 52.5
    y: float = 34.0

    # History (last N seconds)
    pmu_history: List[float] = field(default_factory=list)
    event_log: List[Dict]    = field(default_factory=list)

    @property
    def resilience(self) -> float:
        return RESILIENCE_MAP.get(self.resilience_tier, 0.70)

    def recalc_pmu(self):
        fatigue_penalty = self.fatigue * 0.30   # −30 PMU at max fatigue
        raw = self.baseline_energy + self.event_impact + self.crowd_impact - fatigue_penalty
        self.pmu = float(np.clip(raw, 0.0, 100.0))

    def snapshot(self):
        self.pmu_history.append(round(self.pmu, 2))

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "position": self.position,
            "team": self.team,
            "pmu": round(self.pmu, 2),
            "fatigue": round(self.fatigue, 2),
            "resilience_tier": self.resilience_tier,
            "resilience_factor": round(self.resilience, 2),
            "event_impact": round(self.event_impact, 2),
            "crowd_impact": round(self.crowd_impact, 2),
            "baseline_energy": round(self.baseline_energy, 2),
            "pmu_history": self.pmu_history[-60:],
        }


def build_player(row: Dict) -> PlayerState:
    """Instantiate a PlayerState from the squad template row."""
    tier = row.get("tier", "experienced")
    pos  = row["pos"]
    skill_val = row.get("skill", 8.0)
    decision  = skill_val * 0.9  # proxy for decision-making

    base = BASE_ENERGY.get(pos, 12.0) * (1.0 + ((skill_val + decision) / 20.0) * 0.3)

    return PlayerState(
        id=row["id"],
        name=row["name"],
        position=pos,
        team=row["team"],
        resilience_tier=tier,
        skill=skill_val,
        speed=row.get("speed", 8.0),
        baseline_energy=round(base, 2),
        pmu=round(base, 2),
        x=random.uniform(20, 85),
        y=random.uniform(5, 63),
    )


# ─────────────────────────────────────────────────────────────────────────────
# EVENT PROCESSOR
# ─────────────────────────────────────────────────────────────────────────────

class EventProcessor:
    """
    Compute contextualised event impact.

    EventImpact_eff = BaseImpact × PositionFactor × GameStateFactor
                      × ZoneFactor × MinuteModifier × SuccessFactor
    """

    @staticmethod
    def zone_from_x(x: float, team: str = "A") -> str:
        """Map x-coordinate to pitch zone relative to the team's attack direction."""
        if team == "A":
            if x < PITCH_LENGTH / 3:
                return "defensive_third"
            elif x < 2 * PITCH_LENGTH / 3:
                return "middle_third"
            else:
                return "attacking_third"
        else:
            if x > 2 * PITCH_LENGTH / 3:
                return "defensive_third"
            elif x > PITCH_LENGTH / 3:
                return "middle_third"
            else:
                return "attacking_third"

    @staticmethod
    def minute_modifier(minute: int) -> float:
        """
        Time-dependent modifier that rises towards the end of the match.
        5th min ≈ 0.70 · · · 45th min ≈ 1.00 · · · 90th min ≈ 1.30
        """
        t = minute / 90.0
        mod = 0.65 + 0.65 * math.sin(math.pi * t - math.pi / 2)
        return round(max(0.55, min(1.35, mod)), 3)

    @staticmethod
    def compute(
        event_type: str,
        player: PlayerState,
        game_state: str = "tied",
        minute: int = 45,
        success: bool = True,
    ) -> float:
        """Full contextualised impact value (may be negative)."""
        base = EVENT_BASE_IMPACTS.get(event_type, 0.0)

        if not success:
            base *= 0.30   # failed event = 30 % impact

        pos_mods = POSITION_MODS.get(player.position, {})
        pos_factor   = pos_mods.get(event_type, pos_mods.get("default", 1.0))
        state_factor = GAME_STATE_MODS.get(game_state, 1.0)
        zone_factor  = ZONE_MODS.get(EventProcessor.zone_from_x(player.x, player.team), 1.0)
        min_factor   = EventProcessor.minute_modifier(minute)

        impact = base * pos_factor * state_factor * zone_factor * min_factor
        return round(float(np.clip(impact, -25.0, 25.0)), 3)


# ─────────────────────────────────────────────────────────────────────────────
# FATIGUE MODEL
# ─────────────────────────────────────────────────────────────────────────────

class FatigueModel:
    """
    Fatigue_i,t = Fatigue_i,t-1 + ΔFatigue_Activity − RecoveryRate
    ΔFatigue_Activity = f(speed, distance, acceleration, sprints)
    """

    @staticmethod
    def update(
        player: PlayerState,
        speed: float         = 0.0,
        distance: float      = 0.0,
        acceleration: float  = 0.0,
        sprint_events: int   = 0,
        is_stoppage: bool    = False,
    ):
        fitness = 0.85   # default fitness
        factor  = 2.0 - fitness   # low fitness → higher fatigue

        delta = (
            speed       * 0.002
            + distance  * 0.0001
            + abs(acceleration) * 0.010
            + sprint_events * 0.50
        ) * factor

        recovery = 0.020 if is_stoppage else 0.010
        player.fatigue = float(np.clip(player.fatigue + delta - recovery, 0.0, 100.0))
        player.recalc_pmu()


# ─────────────────────────────────────────────────────────────────────────────
# DECAY MODEL
# ─────────────────────────────────────────────────────────────────────────────

class DecayModel:
    """
    PMU_t+1 = PMU_t · ResilienceFactor − Decay_event

    Exponential variant for goal_conceded psychological shock:
      PMU(t) = PMU₀ · e^(−λt)
    """

    @staticmethod
    def apply(player: PlayerState, event_type: str = "default", dt: float = 1.0):
        rate = DECAY_RATES.get(event_type, DECAY_RATES["default"])

        if event_type == "goal_conceded":
            # Exponential shock
            decay_amount = abs(player.event_impact) * (1.0 - math.exp(-GOAL_CONCEDED_LAMBDA * dt))
        else:
            decay_amount = rate * dt

        player.event_impact = max(0.0, player.event_impact * player.resilience - decay_amount)
        player.recalc_pmu()


# ─────────────────────────────────────────────────────────────────────────────
# PRESSURE ENGINE
# ─────────────────────────────────────────────────────────────────────────────

class PressureEngine:
    """
    PressureImpact_j = PMU_i · FormationCoherence
                       · exp(−Distance_ij / DecayRadius)
                       · ConeFactor
    """

    @staticmethod
    def distance_decay(dist: float, radius: float = PRESSURE_DECAY_RADIUS) -> float:
        """exp(−d / r) → 1.0 at d=0, ~0.37 at d=radius"""
        return math.exp(-max(0.1, dist) / radius)

    @staticmethod
    def cone_factor(px: float, py: float,
                    fx: float, fy: float,
                    tx: float, ty: float,
                    cone_deg: float = PRESSURE_CONE_DEG) -> float:
        """
        Cosine-based cone check.
        (px,py) = pressurer position, (fx,fy) = facing direction, (tx,ty) = target.
        """
        dx, dy = tx - px, ty - py
        dist = math.hypot(dx, dy)
        if dist < 0.1:
            return 0.0
        ndx, ndy = dx / dist, dy / dist
        fn = math.hypot(fx, fy)
        if fn < 1e-9:
            return 0.5
        nfx, nfy = fx / fn, fy / fn
        cos_a = ndx * nfx + ndy * nfy
        cos_half = math.cos(math.radians(cone_deg / 2))
        if cos_a < cos_half:
            return 0.0
        return max(0.0, (cos_a - cos_half) / (1.0 - cos_half + 1e-9))

    @staticmethod
    def compute_impact(
        pressurer: PlayerState,
        target: PlayerState,
        formation_coherence: float,
    ) -> float:
        dist = math.hypot(pressurer.x - target.x, pressurer.y - target.y)
        d_factor = PressureEngine.distance_decay(dist)
        c_factor = PressureEngine.cone_factor(
            pressurer.x, pressurer.y,
            target.x - pressurer.x, target.y - pressurer.y,  # facing toward target
            target.x, target.y,
        )
        impact = pressurer.pmu * formation_coherence * d_factor * c_factor
        return round(float(np.clip(impact, 0.0, 50.0)), 3)


# ─────────────────────────────────────────────────────────────────────────────
# CROWD ENGINE
# ─────────────────────────────────────────────────────────────────────────────

class CrowdEngine:
    """
    CrowdImpact = f(HR, HRV, NoiseLevel, PlayerExperience)
    PMU_adjusted = PMU · (1 + α · CrowdImpact)

    α calibrated via COVID empty-stadium natural experiments.
    """

    @staticmethod
    def compute(
        player: PlayerState,
        noise_db: float      = 75.0,
        is_home: bool        = True,
        heart_rate: float    = 100.0,
        hrv: float           = 70.0,
        match_minute: int    = 45,
    ) -> float:
        alpha = 0.08 if is_home else -0.12
        noise_norm = (noise_db - 75.0) / 20.0          # normalised around 0

        # Experience modifier: veteran less affected
        exp_mods = {1: 1.2, 5: 1.0, 10: 0.7, 15: 0.5}
        tier_exp = {"veteran": 12, "experienced": 7, "young": 3, "rookie": 1}
        exp_years = tier_exp.get(player.resilience_tier, 5)
        keys = sorted(exp_mods.keys())
        exp_mod = 1.0
        for i, k in enumerate(keys):
            if exp_years <= k:
                if i == 0:
                    exp_mod = exp_mods[k]
                else:
                    lo, hi = keys[i-1], k
                    frac = (exp_years - lo) / (hi - lo)
                    exp_mod = exp_mods[lo] * (1 - frac) + exp_mods[hi] * frac
                break
        else:
            exp_mod = exp_mods[keys[-1]]

        # HR stress factor
        if heart_rate < 80:
            hr_stress = 0.3
        elif heart_rate < 100:
            hr_stress = 0.7
        elif heart_rate < 120:
            hr_stress = 1.0
        else:
            hr_stress = 1.3 + (heart_rate - 120) / 50.0

        # HRV: low HRV = more stress
        hrv_stress = 1.0 - min(0.5, hrv / 200.0)

        stress = (hr_stress * 0.6 + hrv_stress * 0.4)
        impact = alpha * noise_norm * exp_mod * stress
        return round(float(np.clip(impact, -8.0, 8.0)), 3)

    @staticmethod
    def apply(player: PlayerState, crowd_val: float):
        player.crowd_impact = crowd_val
        player.recalc_pmu()


# ─────────────────────────────────────────────────────────────────────────────
# FORMATION ENGINE
# ─────────────────────────────────────────────────────────────────────────────

class FormationEngine:
    """
    FormationCoherence = 1 − (σ(DefenderPositions) / MaxDeviation) · PassLaneDensity
    """

    @staticmethod
    def coherence(
        players: List[PlayerState],
        formation: str = "4-3-3",
    ) -> float:
        """Blend lookup coherence with live spatial variance."""
        lookup = compute_formation_coherence(formation)

        defenders = [p for p in players if p.position in ("DEF", "GK")]
        if len(defenders) < 2:
            return lookup

        xs = [p.x for p in defenders]
        ys = [p.y for p in defenders]
        std_x = statistics.stdev(xs) if len(xs) > 1 else 0.0
        std_y = statistics.stdev(ys) if len(ys) > 1 else 0.0
        avg_std = (std_x + std_y) / 2.0
        MAX_STD = 25.0
        live_coh = max(0.0, 1.0 - (avg_std / MAX_STD))

        # Blend 70 % lookup + 30 % live spatial
        blended = 0.70 * lookup + 0.30 * live_coh
        return round(float(np.clip(blended, 0.0, 1.0)), 4)


# ─────────────────────────────────────────────────────────────────────────────
# AGENT DECISIONS (stochastic heuristics)
# ─────────────────────────────────────────────────────────────────────────────

class AgentDecision:
    """
    Heuristic + stochastic player decisions for scenario simulation.
    Player behaviour adapts based on game state, PMU, fatigue.
    """

    # Success probabilities per action type, adjusted by skill
    BASE_SUCCESS_RATES = {
        "pass": 0.82, "key_pass": 0.60, "shot": 0.35,
        "tackle": 0.55, "dribble": 0.50, "press": 0.70, "clearance": 0.85,
    }

    @staticmethod
    def _skill_factor(player: PlayerState) -> float:
        return 0.7 + (player.skill / 10.0) * 0.3  # 0.77 to 1.0

    @staticmethod
    def _fatigue_penalty(player: PlayerState) -> float:
        """At 100 fatigue, 20% success rate penalty."""
        return player.fatigue / 500.0

    @staticmethod
    def decide_action(
        player: PlayerState,
        game_state: str,
        has_possession: bool,
        ball_x: float,
        minute: int,
    ) -> str:
        """
        Stochastic decision based on:
        - Field position (ball distance, zone)
        - Game state (leading/tied/losing)
        - Player position and PMU
        - Fatigue level
        """
        dist_to_goal = abs(ball_x - PITCH_LENGTH)

        if has_possession:
            # Attacking decisions
            if player.position == "FWD":
                if dist_to_goal < 18 and random.random() < 0.60:
                    return "shot"
                if dist_to_goal < 30 and random.random() < 0.40:
                    return "dribble"
                return "pass"

            elif player.position == "MID":
                if dist_to_goal < 25 and random.random() < 0.25:
                    return "shot"
                if random.random() < 0.55:
                    return "key_pass" if dist_to_goal < 40 else "pass"
                return "pass"

            elif player.position == "DEF":
                if random.random() < 0.80:
                    return "pass"
                return "clearance"

            else:  # GK
                return "pass"

        else:
            # Defensive decisions
            if game_state == "losing" and player.pmu > 30:
                if random.random() < 0.60:
                    return "press"
            if player.position in ("DEF",):
                return "tackle" if random.random() < 0.55 else "clearance"
            if player.position == "MID":
                return "tackle" if random.random() < 0.45 else "press"
            return "press"

    @staticmethod
    def attempt_action(
        action: str,
        player: PlayerState,
    ) -> Tuple[bool, str]:
        """
        Execute action with skill-adjusted success probability.
        Returns (success: bool, resolved_event_type: str)
        """
        base = AgentDecision.BASE_SUCCESS_RATES.get(action, 0.60)
        prob = base * AgentDecision._skill_factor(player) - AgentDecision._fatigue_penalty(player)
        prob = max(0.05, min(0.97, prob))

        success = random.random() < prob

        # Map action → event type for impact calculation
        event_map_success = {
            "pass":       "pass",
            "key_pass":   "key_pass",
            "shot":       "shot_on_target" if random.random() < 0.40 else "shot",
            "tackle":     "tackle_won" if random.random() < 0.55 else "tackle",
            "dribble":    "dribble_success",
            "press":      "press",
            "clearance":  "clearance",
        }
        event_map_fail = {
            "pass": "turnover",
            "key_pass": "turnover",
            "shot": "shot",
            "tackle": "foul" if random.random() < 0.30 else "tackle",
            "dribble": "turnover",
            "press": "press",
            "clearance": "clearance",
        }

        resolved = event_map_success.get(action, action) if success else event_map_fail.get(action, action)

        # Goal: if shot_on_target, small chance of goal
        if resolved == "shot_on_target" and random.random() < 0.25:
            resolved = "goal"

        return success, resolved


# ─────────────────────────────────────────────────────────────────────────────
# MATCH STATE
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class MatchState:
    minute: int              = 45
    game_state_a: str        = "tied"   # from Team A's perspective
    game_state_b: str        = "tied"
    score_a: int             = 0
    score_b: int             = 0
    possession_team: str     = "A"
    ball_x: float            = 52.5
    ball_y: float            = 34.0
    crowd_noise_db: float    = 80.0
    weather_factor: float    = 1.0

    def update_game_states(self):
        if self.score_a > self.score_b:
            self.game_state_a = "leading"
            self.game_state_b = "losing"
        elif self.score_b > self.score_a:
            self.game_state_a = "losing"
            self.game_state_b = "leading"
        else:
            self.game_state_a = "tied"
            self.game_state_b = "tied"

    def switch_possession(self):
        self.possession_team = "B" if self.possession_team == "A" else "A"

    def goal_scored(self, team: str):
        if team == "A":
            self.score_a += 1
        else:
            self.score_b += 1
        self.update_game_states()
        self.switch_possession()


# ─────────────────────────────────────────────────────────────────────────────
# SINGLE-MATCH SIMULATION STEP
# ─────────────────────────────────────────────────────────────────────────────

class MatchSimulator:
    """Runs one match scenario for a given number of time steps (1 step ≈ 1 match minute)."""

    def __init__(
        self,
        squad: List[Dict]      = None,
        formation_a: str       = "4-3-3",
        formation_b: str       = "4-4-2",
        tactic_a: str          = "balanced",
        tactic_b: str          = "balanced",
        start_minute: int      = 0,
        end_minute: int        = 90,
        crowd_noise_db: float  = 80.0,
        scenario: str          = "Baseline",
    ):
        self.squad_def     = squad or DEFAULT_SQUAD
        self.formation_a   = formation_a
        self.formation_b   = formation_b
        self.tactic_a      = tactic_a
        self.tactic_b      = tactic_b
        self.start_minute  = start_minute
        self.end_minute    = end_minute
        self.crowd_noise   = crowd_noise_db
        self.scenario      = scenario

        self.players_a: List[PlayerState] = []
        self.players_b: List[PlayerState] = []
        self.match_state = MatchState(
            minute=start_minute,
            crowd_noise_db=crowd_noise_db,
        )

        self._build_squads()

    def _build_squads(self):
        for row in self.squad_def:
            p = build_player(row)
            if row["team"] == "A":
                self.players_a.append(p)
            else:
                self.players_b.append(p)

    def _all_players(self) -> List[PlayerState]:
        return self.players_a + self.players_b

    # ── One time-step (≈ 1 minute) ───────────────────────────────────────────

    def _run_step(self, minute: int):
        tmod_a = TACTIC_MODS.get(self.tactic_a, TACTIC_MODS["balanced"])
        tmod_b = TACTIC_MODS.get(self.tactic_b, TACTIC_MODS["balanced"])
        coh_a = FormationEngine.coherence(self.players_a, self.formation_a)
        coh_b = FormationEngine.coherence(self.players_b, self.formation_b)

        for player in self._all_players():
            gs = self.match_state.game_state_a if player.team == "A" else self.match_state.game_state_b
            tmod = tmod_a if player.team == "A" else tmod_b
            coh  = coh_a   if player.team == "A" else coh_b

            has_poss = (self.match_state.possession_team == player.team)

            # Agent picks an action
            action = AgentDecision.decide_action(
                player, gs, has_poss, self.match_state.ball_x, minute
            )
            success, evt_type = AgentDecision.attempt_action(action, player)

            # Compute contextual impact
            impact = EventProcessor.compute(evt_type, player, gs, minute, success)
            impact *= tmod["pmu"]   # tactic multiplier

            # Apply impact
            player.apply_event_impact = lambda imp=impact, p=player: (
                setattr(p, "event_impact", p.event_impact + imp) or p.recalc_pmu()
            )
            player.event_impact += impact
            player.recalc_pmu()

            # Log event
            player.event_log.append({
                "minute": minute,
                "action": action,
                "event": evt_type,
                "impact": round(impact, 2),
                "success": success,
            })

            # Goal handling
            if evt_type == "goal":
                self.match_state.goal_scored(player.team)
                # Apply goal_conceded penalty to all opponents
                opponents = self.players_b if player.team == "A" else self.players_a
                for opp in opponents:
                    concede_impact = EVENT_BASE_IMPACTS["goal_conceded"]
                    conc_mod = EventProcessor.minute_modifier(minute)
                    opp.event_impact += concede_impact * conc_mod * tmod_b["pmu"]
                    opp.recalc_pmu()
                    opp.event_log.append({
                        "minute": minute, "event": "goal_conceded",
                        "impact": round(concede_impact * conc_mod, 2), "success": False,
                    })

            # Fatigue accumulation (proportional to speed/position)
            sprint = 1 if action in ("press", "dribble", "tackle") else 0
            FatigueModel.update(
                player,
                speed=player.speed * random.uniform(0.3, 0.9),
                distance=random.uniform(50, 200),
                sprint_events=sprint,
                is_stoppage=(random.random() < 0.10),
            )

            # Decay existing momentum
            DecayModel.apply(player, evt_type, dt=1.0)

            # Crowd effect
            crowd_val = CrowdEngine.compute(
                player,
                noise_db=self.crowd_noise,
                is_home=(player.team == "A"),
                match_minute=minute,
                heart_rate=80 + player.fatigue * 0.4,
                hrv=80 - player.fatigue * 0.3,
            )
            CrowdEngine.apply(player, crowd_val)

            # Pressure from opponents
            opponents = self.players_b if player.team == "A" else self.players_a
            total_pressure = 0.0
            for opp in opponents:
                pressure = PressureEngine.compute_impact(opp, player, coh)
                total_pressure += pressure
            # Apply opponent pressure as negative PMU adjustment
            if total_pressure > 0:
                player.event_impact -= total_pressure * 0.05   # 5% of pressure converts to PMU loss
                player.recalc_pmu()

            player.snapshot()

        # Randomly switch possession
        if random.random() < 0.35:
            self.match_state.switch_possession()
            # Move ball
            self.match_state.ball_x = random.uniform(20, 85)
            self.match_state.ball_y = random.uniform(5, 63)

        self.match_state.minute = minute

    # ── Run full simulation ───────────────────────────────────────────────────

    def run(self) -> Dict:
        for minute in range(self.start_minute, self.end_minute + 1):
            self._run_step(minute)

        return self._collate_results()

    def _collate_results(self) -> Dict:
        all_p = self._all_players()

        def team_stats(players: List[PlayerState]) -> Dict:
            pmuls = [p.pmu for p in players]
            return {
                "avg_pmu": round(statistics.mean(pmuls), 2),
                "peak_pmu": round(max(pmuls), 2),
                "min_pmu": round(min(pmuls), 2),
                "total_pmu": round(sum(pmuls), 2),
                "avg_fatigue": round(statistics.mean([p.fatigue for p in players]), 2),
            }

        team_a_stats = team_stats(self.players_a)
        team_b_stats = team_stats(self.players_b)

        avg_a = team_a_stats["avg_pmu"]
        avg_b = team_b_stats["avg_pmu"]

        coh_a = FormationEngine.coherence(self.players_a, self.formation_a)
        coh_b = FormationEngine.coherence(self.players_b, self.formation_b)

        tmod_a = TACTIC_MODS.get(self.tactic_a, TACTIC_MODS["balanced"])
        tmod_b = TACTIC_MODS.get(self.tactic_b, TACTIC_MODS["balanced"])

        possession_a = coh_a * tmod_a["possession"] * random.uniform(0.4, 0.7)
        off_ball_a   = coh_a * tmod_a["off_ball"]   * random.uniform(0.3, 0.6)
        transition_a = random.uniform(0.2, 0.5)

        possession_b = coh_b * tmod_b["possession"] * random.uniform(0.3, 0.6)
        off_ball_b   = coh_b * tmod_b["off_ball"]   * random.uniform(0.3, 0.6)
        transition_b = random.uniform(0.2, 0.5)

        # Goal probability for the next 30-second window
        raw_goal_prob = max(0.0, ((avg_a / 55) - (avg_b / 65)) * 0.15)
        goal_prob = round(min(0.55, max(0.0, raw_goal_prob + random.gauss(0, 0.02))), 4)

        # xG estimate
        xg = round(goal_prob * 3.0 * random.uniform(0.8, 1.2), 3)

        sorted_players = sorted(all_p, key=lambda p: p.pmu, reverse=True)

        return {
            "score": {"A": self.match_state.score_a, "B": self.match_state.score_b},
            "game_state": {
                "team_a": self.match_state.game_state_a,
                "team_b": self.match_state.game_state_b,
            },
            "team_a": team_a_stats,
            "team_b": team_b_stats,
            "formation_coherence": {"A": round(coh_a, 4), "B": round(coh_b, 4)},
            "teamAPressure": {
                "possession": round(possession_a, 4),
                "offBall":    round(off_ball_a, 4),
                "transition": round(transition_a, 4),
            },
            "teamBPressure": {
                "possession": round(possession_b, 4),
                "offBall":    round(off_ball_b, 4),
                "transition": round(transition_b, 4),
            },
            "goalProbability": goal_prob,
            "xg": xg,
            "playerMomentum": [
                {"name": p.name, "pmu": round(p.pmu, 2), "position": p.position,
                 "team": p.team, "fatigue": round(p.fatigue, 2)}
                for p in sorted_players[:10]
            ],
            "allPlayers": [p.to_dict() for p in all_p],
        }


# ─────────────────────────────────────────────────────────────────────────────
# MONTE CARLO ENGINE
# ─────────────────────────────────────────────────────────────────────────────

class MonteCarloEngine:
    """
    Run N independent MatchSimulator iterations and aggregate results.

    Outputs:
      • Probability distributions for xG, goal likelihood, momentum evolution
      • Per-player mean/std PMU across iterations
      • Team-level pressure statistics
    """

    def __init__(self, config: Dict):
        self.config     = config
        self.iterations = config.get("iterations", 500)

    def run(self) -> Dict:
        results = []
        for _ in range(self.iterations):
            sim = MatchSimulator(
                formation_a  = self.config.get("formation", "4-3-3"),
                formation_b  = self.config.get("formation_b", "4-4-2"),
                tactic_a     = self.config.get("tactic", "balanced").lower(),
                tactic_b     = self.config.get("tactic_b", "balanced").lower(),
                start_minute = self.config.get("start_minute", 0),
                end_minute   = self.config.get("end_minute", 90),
                crowd_noise_db = self.config.get("crowd_noise", 80.0),
                scenario     = self.config.get("scenario", "Baseline"),
            )
            r = sim.run()
            results.append(r)

        return self._aggregate(results)

    def _aggregate(self, results: List[Dict]) -> Dict:
        N = len(results)

        # Scalar averages
        avg_pmu_a   = sum(r["team_a"]["avg_pmu"]   for r in results) / N
        avg_pmu_b   = sum(r["team_b"]["avg_pmu"]   for r in results) / N
        peak_pmu    = max(r["team_a"]["peak_pmu"]  for r in results)
        avg_goal_p  = sum(r["goalProbability"]      for r in results) / N
        avg_xg      = sum(r["xg"]                  for r in results) / N
        avg_fat_a   = sum(r["team_a"]["avg_fatigue"] for r in results) / N
        avg_fat_b   = sum(r["team_b"]["avg_fatigue"] for r in results) / N

        # Score distribution
        goals_a = [r["score"]["A"] for r in results]
        goals_b = [r["score"]["B"] for r in results]
        wins_a  = sum(1 for r in results if r["score"]["A"] > r["score"]["B"])
        wins_b  = sum(1 for r in results if r["score"]["B"] > r["score"]["A"])
        draws   = N - wins_a - wins_b

        # Pressure averages
        def avg_pres(key, team):
            return round(sum(r[team][key] for r in results) / N, 4)

        # Player momentum aggregation across iterations
        player_pmu_acc: Dict[str, List[float]] = {}
        player_meta: Dict[str, Dict] = {}
        for r in results:
            for p in r.get("allPlayers", []):
                pid = p["id"]
                if pid not in player_pmu_acc:
                    player_pmu_acc[pid] = []
                    player_meta[pid] = {"name": p["name"], "position": p["position"],
                                        "team": p["team"], "resilience_tier": p.get("resilience_tier", "")}
                player_pmu_acc[pid].append(p["pmu"])

        player_momentum = []
        for pid, pmuls in player_pmu_acc.items():
            meta = player_meta[pid]
            mean_pmu = statistics.mean(pmuls)
            std_pmu  = statistics.stdev(pmuls) if len(pmuls) > 1 else 0.0
            consistency = max(0.0, 1.0 - std_pmu / (mean_pmu + 1e-6))
            player_momentum.append({
                "id": pid,
                "name": meta["name"],
                "position": meta["position"],
                "team": meta["team"],
                "pmu": round(mean_pmu, 2),
                "std": round(std_pmu, 2),
                "consistency": round(consistency, 2),
                "resilience_tier": meta["resilience_tier"],
            })

        player_momentum.sort(key=lambda p: p["pmu"], reverse=True)

        # Goal probability distribution (histogram-like bins)
        goal_probs = [r["goalProbability"] for r in results]
        gp_bins = {
            "0-10%":  sum(1 for g in goal_probs if g < 0.10) / N,
            "10-25%": sum(1 for g in goal_probs if 0.10 <= g < 0.25) / N,
            "25-40%": sum(1 for g in goal_probs if 0.25 <= g < 0.40) / N,
            "40%+":   sum(1 for g in goal_probs if g >= 0.40) / N,
        }

        return {
            "iterations": N,
            "avgPMU": round((avg_pmu_a + avg_pmu_b) / 2, 2),
            "avgPMU_A": round(avg_pmu_a, 2),
            "avgPMU_B": round(avg_pmu_b, 2),
            "peakPMU": round(peak_pmu, 2),
            "goalProbability": round(avg_goal_p, 4),
            "xg": round(avg_xg, 3),
            "avgFatigue_A": round(avg_fat_a, 2),
            "avgFatigue_B": round(avg_fat_b, 2),
            "outcomeDistribution": {
                "teamA_wins": round(wins_a / N, 4),
                "teamB_wins": round(wins_b / N, 4),
                "draws": round(draws / N, 4),
            },
            "scoreDistribution": {
                "avg_goals_a": round(statistics.mean(goals_a), 2),
                "avg_goals_b": round(statistics.mean(goals_b), 2),
                "std_goals_a": round(statistics.stdev(goals_a) if len(goals_a) > 1 else 0.0, 2),
                "std_goals_b": round(statistics.stdev(goals_b) if len(goals_b) > 1 else 0.0, 2),
            },
            "goalProbDistribution": gp_bins,
            "teamAPressure": {
                "possession": round(sum(r["teamAPressure"]["possession"] for r in results) / N, 4),
                "offBall":    round(sum(r["teamAPressure"]["offBall"]    for r in results) / N, 4),
                "transition": round(sum(r["teamAPressure"]["transition"] for r in results) / N, 4),
            },
            "teamBPressure": {
                "possession": round(sum(r["teamBPressure"]["possession"] for r in results) / N, 4),
                "offBall":    round(sum(r["teamBPressure"]["offBall"]    for r in results) / N, 4),
                "transition": round(sum(r["teamBPressure"]["transition"] for r in results) / N, 4),
            },
            "playerMomentum": player_momentum[:10],
            "allPlayerStats": player_momentum,
            "formationCoherence": {
                "A": round(sum(r["formation_coherence"]["A"] for r in results) / N, 4),
                "B": round(sum(r["formation_coherence"]["B"] for r in results) / N, 4),
            },
            "config": self.config,
        }
