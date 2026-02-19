"""
momentum_sim/core/player.py
Full Player model — PMU computation, fatigue, decay, crowd adjustment
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class PlayerAttributes:
    speed: float = 8.0  # 0-10
    strength: float = 7.0
    technical_skill: float = 7.5
    decision_making: float = 7.0
    resilience: float = 0.75  # 0-1, momentum persistence
    experience_years: int = 5
    fitness_level: float = 0.85  # 0-1, affects fatigue


class Player:
    """
    Full player model.
    PMU_i,t = E_base + Σ EventImpact_i,t^k + CrowdImpact_i,t − Fatigue_i,t
    """

    def __init__(
        self,
        player_id: str,
        name: str,
        position: str,
        team_id: str,
        attributes: Optional[PlayerAttributes] = None,
    ):
        self.id = player_id
        self.name = name
        self.position = position  # GK | DEF | MID | FWD
        self.team_id = team_id
        self.attributes = attributes or PlayerAttributes()

        # PMU components
        self.pmu = 0.0
        self.fatigue = 0.0
        self.baseline_energy = self._compute_baseline_energy()

        # History
        self.pmu_history = []
        self.event_log = []

    def _compute_baseline_energy(self) -> float:
        """
        Compute baseline energy based on position and attributes
        Normalized scale: 0-30 PMU units
        """
        position_base = {
            "GK": 8,
            "DEF": 12,
            "MID": 15,
            "FWD": 18,
        }

        base = position_base.get(self.position, 12)
        # Skill adjustment
        skill_factor = (
            self.attributes.technical_skill + self.attributes.decision_making
        ) / 20

        return base * (1 + skill_factor * 0.3)

    def update_pmu(
        self, event_impact: float, crowd_impact: float, fatigue_change: float
    ):
        """
        Update PMU based on event, crowd, and fatigue
        """
        self.pmu = self.baseline_energy + event_impact + crowd_impact - self.fatigue
        self.pmu = max(0, min(100, self.pmu))  # Clamp 0-100

    def apply_fatigue(self, activity_level: float, recovery_rate: float = 0.01):
        """
        Fatigue_i,t = Fatigue_i,t-1 + DeltaFatigue_Activity - RecoveryRate

        Args:
            activity_level: 0-1 scale of player activity (speed, distance, acceleration)
            recovery_rate: natural recovery rate per timestep
        """
        delta_fatigue = (
            activity_level * (self.attributes.speed / 10) * 5
        )  # Max ~5 fatigue per high activity
        self.fatigue = max(0, self.fatigue + delta_fatigue - recovery_rate)

    def apply_decay(self, decay_rate: float, resilience_override: float = None):
        """
        Apply momentum decay with player-specific resilience
        PMU_t+1 = PMU_t * ResilienceFactor_i - Decay_event
        """
        resilience = resilience_override or self.attributes.resilience
        self.pmu = max(0, self.pmu * resilience - decay_rate)

    def record_event(self, event_type: str, impact: float):
        """Log an event for history tracking"""
        self.event_log.append(
            {"type": event_type, "impact": impact, "timestamp": len(self.pmu_history)}
        )

    def record_pmu(self):
        """Record current PMU to history"""
        self.pmu_history.append(self.pmu)

    def get_momentum_persistence(self) -> float:
        """
        Calculate momentum persistence (veteran vs young player effect)
        Higher experience = more momentum resilience
        """
        experience_factor = min(1.0, self.attributes.experience_level / 15)
        base_resilience = 0.45 + (experience_factor * 0.45)  # 0.45 to 0.90
        return base_resilience * self.attributes.resilience
