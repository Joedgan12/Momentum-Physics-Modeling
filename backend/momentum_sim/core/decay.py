"""
momentum_sim/core/decay.py
Event decay curves and fatigue modeling
"""


import numpy as np

from .event import EventType


class DecayModel:
    """
    Momentum decay after events
    PMU_t+1 = PMU_t * ResilienceFactor_i - Decay_event

    Implements both exponential and linear decay with event-specific parameters
    """

    # Decay rates (PMU units per second)
    DECAY_RATES = {
        EventType.TACKLE: 0.15,  # Defensive action fades quick
        EventType.GOAL_CONCEDED: 0.25,  # Psychological shock (strong decay)
        EventType.PASS: 0.05,  # Possession momentum persists
        EventType.GOAL: 0.20,  # High momentum boost but fades
        EventType.DEFAULT: 0.08,  # Default moderate decay
    }

    # Exponential decay rate for goals conceded
    EXPONENTIAL_LAMBDA = 0.03  # For PMU(t) = PMU_0 * e^(-λt)

    @staticmethod
    def get_decay_rate(event_type: EventType) -> float:
        """Get base decay rate for event type"""
        return DecayModel.DECAY_RATES.get(
            event_type, DecayModel.DECAY_RATES[EventType.DEFAULT]
        )

    @staticmethod
    def exponential_decay(
        initial_pmu: float, time_elapsed: float, lambda_param: float = None
    ) -> float:
        """
        Exponential decay: PMU(t) = PMU_0 * e^(-λt)

        Typically used for psychological shock (goal conceded)

        Args:
            initial_pmu: Starting PMU value
            time_elapsed: Seconds since event
            lambda_param: Decay constant (default: EXPONENTIAL_LAMBDA)
        """
        lambda_param = lambda_param or DecayModel.EXPONENTIAL_LAMBDA
        return initial_pmu * np.exp(-lambda_param * time_elapsed)

    @staticmethod
    def linear_decay(
        initial_pmu: float, time_elapsed: float, decay_rate: float
    ) -> float:
        """
        Linear decay: PMU(t) = PMU_0 - (decay_rate * t)

        Args:
            initial_pmu: Starting PMU value
            time_elapsed: Seconds since event
            decay_rate: Units per second
        """
        return max(0, initial_pmu - (decay_rate * time_elapsed))

    @staticmethod
    def composite_decay(
        initial_pmu: float,
        time_elapsed: float,
        event_type: EventType,
        resilience_factor: float,
        use_exponential: bool = False,
    ) -> float:
        """
        Combined decay with resilience modifier

        PMU_t+1 = PMU_t * ResilienceFactor * DecayFunction(t)

        Higher resilience = slower decay (veteran players)
        """
        decay_rate = DecayModel.get_decay_rate(event_type)

        if use_exponential and event_type == EventType.GOAL_CONCEDED:
            base_decay = DecayModel.exponential_decay(initial_pmu, time_elapsed)
        else:
            base_decay = DecayModel.linear_decay(initial_pmu, time_elapsed, decay_rate)

        # Resilience factor (veteran: 0.90, young: 0.60)
        # Higher resilience = slower momentum loss
        return base_decay * (0.5 + 0.5 * resilience_factor)


class FatigueModel:
    """
    Player fatigue accumulation and recovery

    Fatigue_i,t = Fatigue_i,t-1 + ΔFatigueActivity - RecoveryRate
    ΔFatigue_Activity = f(Speed, Distance, Acceleration, SprintEvents)
    """

    # Fatigue contribution weights
    SPEED_WEIGHT = 0.002  # Per m/s
    DISTANCE_WEIGHT = 0.0001  # Per meter
    ACCEL_WEIGHT = 0.01  # Per m/s²
    SPRINT_WEIGHT = 0.5  # Per sprint event

    # Recovery rates
    BASE_RECOVERY = 0.01  # Per second at rest
    TACTICAL_RECOVERY = 0.02  # Stoppages, set pieces
    SUBSTITUTION_RECOVERY = 0.5  # Large recovery on substitution

    @staticmethod
    def compute_activity_fatigue(
        speed: float,
        distance: float = None,
        acceleration: float = None,
        sprint_events: int = 0,
    ) -> float:
        """
        Calculate fatigue contribution from activity

        Args:
            speed: Current speed (m/s)
            distance: Distance covered in period (meters)
            acceleration: Current acceleration (m/s²)
            sprint_events: Count of sprint events

        Returns:
            fatigue_delta: Fatigue units to add
        """
        fatigue_delta = 0

        # Speed contribution (high speed = more fatigue)
        fatigue_delta += speed * FatigueModel.SPEED_WEIGHT

        # Distance contribution
        if distance:
            fatigue_delta += distance * FatigueModel.DISTANCE_WEIGHT

        # Acceleration contribution (explosive effort)
        if acceleration:
            fatigue_delta += abs(acceleration) * FatigueModel.ACCEL_WEIGHT

        # Sprint events (major fatigue drivers)
        fatigue_delta += sprint_events * FatigueModel.SPRINT_WEIGHT

        return fatigue_delta

    @staticmethod
    def update_fatigue(
        current_fatigue: float,
        activity_fatigue: float,
        recovery_rate: float = None,
        is_substitute_on: bool = False,
    ) -> float:
        """
        Update fatigue with recovery

        Args:
            current_fatigue: Previous fatigue level
            activity_fatigue: Fatigue added from activity
            recovery_rate: Custom recovery rate
            is_substitute_on: Whether player just came on

        Returns:
            updated_fatigue: New fatigue level (0-100)
        """
        recovery = recovery_rate or FatigueModel.BASE_RECOVERY

        if is_substitute_on:
            # Large recovery boost for fresh player
            recovery = FatigueModel.SUBSTITUTION_RECOVERY

        new_fatigue = max(0, current_fatigue + activity_fatigue - recovery)

        return min(100, new_fatigue)  # Clamp 0-100

    @staticmethod
    def fatigue_to_pmu_penalty(fatigue: float) -> float:
        """
        Convert fatigue (0-100) to PMU penalty

        Linearly reduces PMU as fatigue increases
        At fatigue=100, player loses ~30 PMU
        """
        return -0.3 * fatigue

    @staticmethod
    def estimate_performance_decline(fatigue: float) -> float:
        """
        Estimate decline in player performance quality due to fatigue

        Used to adjust success rates (pass accuracy, tackle success)
        """
        # Fatigue is 0-100
        # At 50% fatigue, 10% performance decline
        # At 100% fatigue, 50% performance decline
        decline_rate = 0.005  # 0.5% per fatigue point
        return min(0.5, fatigue * decline_rate)
