"""
momentum_sim/core/psychological_pressure.py

Psychological Pressure Decay Model
==================================

Models psychological state evolution:
  - Composure decay after missed chances
  - Confidence shifts from successes/failures
  - Pressure-induced decision decay
  - Clutch probability scaling

ComposureState_i,t = (1 - Decay_t) * ComposureState_i,t-1 + RecencyBias_feedback

Key insight: Psychological momentum is orthogonal to physical momentum.
A striker with fresh legs but broken composure plays differently than 
a tired player with unwavering confidence.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
import math


@dataclass
class PsychologicalProfile:
    """Player psychological attributes that drive decision quality."""
    mental_toughness: float = 0.7  # 0-1, resilience to pressure
    clutch_factor: float = 0.8  # 0-1, performance amplifier in critical moments
    confidence_volatility: float = 0.6  # 0-1, how quickly confidence swings
    experience_years: int = 5
    consistency: float = 0.75  # 0-1, resistance to variance
    recovery_speed: float = 0.5  # 0-1, how quickly confidence rebounds


@dataclass
class ComposureState:
    """Real-time composure tracking."""
    composure_score: float = 1.0  # 0-2 scale, 1.0 = baseline
    confidence: float = 1.0  # 0-2 scale, affects decision quality
    
    # Event history (recent context)
    last_5_actions: List[str] = field(default_factory=list)  # ['success', 'miss', 'tackle_won']
    consecutive_failures: int = 0
    consecutive_successes: int = 0
    
    # Pressure metrics
    pressure_buildup: float = 0.0  # 0-1, accumulates with failed chances
    moments_since_last_touch: int = 0
    moments_since_last_success: int = 0


class PsychologicalPressureModel:
    """
    Model psychological state evolution and decision-making decay.
    
    Composure changes are driven by:
    1. Recent performance (success/failure)
    2. Situational pressure (game state, crowd noise, phase of match)
    3. Role expectations (striker vs defender)
    4. Recovery between stimuli
    """
    
    # Composure adjustment per event
    SUCCESS_COMPOSURE_BOOST = 0.15
    CRITICAL_SUCCESS_BOOST = 0.25  # Goal, key pass, tackle won in crucial moment
    
    MINOR_FAILURE_DECAY = -0.08  # Missed pass
    MISSED_CHANCE_DECAY = -0.20  # Shot misses target
    CRITICAL_FAILURE_DECAY = -0.30  # Penalty miss, easy chance missed
    
    # Pressure accumulation
    PRESSURE_INCREMENT_PER_MISSED_CHANCE = 0.12
    PRESSURE_INCREMENT_PER_FAILED_TACKLE = 0.08
    PRESSURE_INCREMENT_PER_TURNOVER = 0.05
    
    # Decay (recovery)
    COMPOSURE_NATURAL_DECAY_RATE = 0.02  # ~1.8% per 10-second window
    CONFIDENCE_RECOVERY_RATE = 0.03  # Gradual recovery between events
    PRESSURE_DISSIPATION_RATE = 0.04  # Pressure eases over time without failures
    
    # Time-based factors
    SECONDS_PER_CRITICAL_MOMENT = 30  # Definition of "critical moment" window
    RECOVERY_WINDOW_SECONDS = 180  # Time for composure to stabilize

    @staticmethod
    def apply_event_impact(
        state: ComposureState,
        profile: PsychologicalProfile,
        event_type: str,
        is_critical_moment: bool = False,
        game_state_multiplier: float = 1.0,  # 1.2 for losing, 0.8 for winning
    ) -> ComposureState:
        """
        Update composure based on event outcome.
        
        Args:
            state: Current composure state
            profile: Player psychological profile
            event_type: 'pass', 'pass_incomplete', 'shot', 'shot_miss', 'shot_goal', 
                        'tackle_won', 'tackle_lost', 'interception', etc.
            is_critical_moment: True if in clutch scenario (close match, late game, etc.)
            game_state_multiplier: Pressure multiplier based on match context
        
        Returns:
            Updated ComposureState
        """
        
        # Determine impact based on event
        impact = PsychologicalPressureModel._get_event_impact(
            event_type, is_critical_moment, profile
        )
        
        # Apply game state context
        impact *= game_state_multiplier
        
        # Update composure
        state.composure_score = max(0.0, min(2.0, state.composure_score + impact))
        state.confidence = max(0.0, min(2.0, state.confidence + impact * 0.8))
        
        # Track event sequence
        state.last_5_actions.append(event_type)
        if len(state.last_5_actions) > 5:
            state.last_5_actions.pop(0)
        
        # Update success/failure streaks
        if 'success' in event_type or event_type in ['pass', 'tackle_won', 'goal', 'save', 'interception']:
            state.consecutive_successes += 1
            state.consecutive_failures = 0
        elif 'fail' in event_type or 'miss' in event_type or event_type == 'turnover':
            state.consecutive_failures += 1
            state.consecutive_successes = 0
            state.pressure_buildup = min(1.0, state.pressure_buildup + 
                                        PsychologicalPressureModel.PRESSURE_INCREMENT_PER_MISSED_CHANCE)
        
        # Reset touch counters
        state.moments_since_last_touch = 0
        if impact > 0:
            state.moments_since_last_success = 0
        
        return state

    @staticmethod
    def _get_event_impact(
        event_type: str,
        is_critical: bool,
        profile: PsychologicalProfile,
    ) -> float:
        """Determine composure impact of event."""
        
        impact_map = {
            # Successes
            'pass': 0.05,
            'pass_success': 0.08,
            'key_pass': 0.15,
            'through_ball': 0.18,
            'tackle_won': 0.12,
            'interception': 0.10,
            'save': 0.15,
            'goal': 0.40,
            'dribble_success': 0.12,
            
            # Failures
            'pass_incomplete': -0.10,
            'pass_failure': -0.15,
            'turnover': -0.12,
            'shot_miss': PsychologicalPressureModel.MISSED_CHANCE_DECAY,
            'shot_off_target': -0.12,
            'tackle_lost': -0.10,
            'clearance_fail': -0.08,
            
            # Critical
            'penalty_miss': PsychologicalPressureModel.CRITICAL_FAILURE_DECAY,
            'penalty_goal': 0.35,
        }
        
        base_impact = impact_map.get(event_type, -0.05)
        
        # Critical moment amplification
        if is_critical:
            base_impact *= (1.0 + profile.clutch_factor)
        
        # Apply personality modulation
        if base_impact > 0:
            # Positive events: mental toughness amplifies
            base_impact *= (0.5 + profile.mental_toughness)
        else:
            # Negative events: mental toughness dampens
            base_impact *= (1.5 - profile.mental_toughness)
        
        return round(base_impact, 3)

    @staticmethod
    def apply_time_decay(
        state: ComposureState,
        profile: PsychologicalProfile,
        time_seconds: int = 10,  # Per simulation step
    ) -> ComposureState:
        """
        Apply natural psychological decay and recovery over time.
        
        Args:
            state: Current composure state
            profile: Player profile (mental_toughness affects recovery)
            time_seconds: Time elapsed in seconds
        
        Returns:
            Updated ComposureState with decay applied
        """
        
        # Composure gradually returns toward baseline (1.0)
        composure_delta = (1.0 - state.composure_score) * PsychologicalPressureModel.COMPOSURE_NATURAL_DECAY_RATE
        state.composure_score += composure_delta * (1.0 + profile.mental_toughness)
        
        # Pressure dissipates naturally
        pressure_delta = -PsychologicalPressureModel.PRESSURE_DISSIPATION_RATE * profile.consistency
        state.pressure_buildup = max(0.0, state.pressure_buildup + pressure_delta)
        
        # Track time since events
        state.moments_since_last_touch += time_seconds
        state.moments_since_last_success += time_seconds
        
        # Very long timeout resets streaks (loss of rhythm)
        if state.moments_since_last_touch > 180:  # 3 minutes
            state.consecutive_successes = max(0, state.consecutive_successes - 1)
            state.consecutive_failures = max(0, state.consecutive_failures - 1)
        
        return state

    @staticmethod
    def get_decision_quality_modifier(state: ComposureState, profile: PsychologicalProfile) -> float:
        """
        Map composure state to decision-making quality multiplier.
        
        Affects pass completion, shot accuracy, positioning decisions.
        
        Returns:
            Multiplier 0.5-1.5 where 1.0 = baseline quality
        """
        
        # Base on current composure
        quality = state.composure_score * state.confidence
        quality = max(0.5, min(1.5, quality))
        
        # Pressure degrades decision quality
        pressure_penalty = state.pressure_buildup * 0.3
        quality *= (1.0 - pressure_penalty)
        
        # Streak effects
        if state.consecutive_successes >= 3:
            quality *= 1.1  # Rhythm bonus
        elif state.consecutive_failures >= 3:
            quality *= 0.85  # Slump penalty
        
        return round(max(0.5, quality), 3)

    @staticmethod
    def get_shot_accuracy_modifier(state: ComposureState, profile: PsychologicalProfile) -> float:
        """
        Specific modifier for shot accuracy.
        
        Composure directly impacts where striker places the ball.
        """
        base = state.composure_score
        
        # Pressure buildup severely impacts shots
        pressure_impact = state.pressure_buildup * 0.25
        
        # Experience helps maintain accuracy under pressure
        experience_bonus = 1.0 + (profile.experience_years / 20)
        
        modifier = base * (1.0 - pressure_impact) * experience_bonus
        return round(max(0.4, min(1.8, modifier)), 3)

    @staticmethod
    def get_stamina_modifier(state: ComposureState, profile: PsychologicalProfile) -> float:
        """
        Psychological state affects stamina drain.
        
        High pressure + low composure → mental fatigue → faster stamina drain
        """
        
        mental_fatigue = state.pressure_buildup * 0.15
        confidence_boost = (state.confidence - 1.0) * 0.1  # High confidence = slightly lower fatigue
        
        drain_multiplier = 1.0 + mental_fatigue - confidence_boost
        return round(max(0.7, min(1.4, drain_multiplier)), 3)

    @staticmethod
    def get_clutch_probability(
        state: ComposureState,
        profile: PsychologicalProfile,
        time_remaining_seconds: int,
        score_differential: int,  # Negative = losing, 0 = tied, Positive = winning
    ) -> float:
        """
        Probability of peak performance in clutch scenarios.
        
        Args:
            state: Current psychological state
            profile: Player psychological traits
            time_remaining_seconds: Seconds left in match
            score_differential: Goal difference (perspective of this player's team)
        
        Returns:
            Probability 0-1 that player performs above baseline
        """
        
        # Time pressure factor (increases as time runs out)
        time_pressure = 1.0 - (time_remaining_seconds / 5400)  # 90 min = 5400 sec
        
        # Score pressure factor
        if score_differential < 0:  # Losing
            score_pressure = 1.0
        elif score_differential == 0:  # Tied
            score_pressure = 0.8
        else:  # Winning
            score_pressure = 0.5
        
        # Player-specific clutch capability
        clutch_base = profile.clutch_factor
        
        # Current state impact
        composure_impact = (state.composure_score - 1.0) * 0.3
        confidence_impact = (state.confidence - 1.0) * 0.2
        
        # Combined
        probability = clutch_base * score_pressure * (1.0 + composure_impact + confidence_impact)
        probability += time_pressure * 0.2
        
        return round(max(0.0, min(1.0, probability)), 3)
