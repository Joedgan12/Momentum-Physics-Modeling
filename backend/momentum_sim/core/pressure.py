"""
momentum_sim/core/pressure.py
Pressure and influence propagation on the pitch
"""

import numpy as np
from typing import Dict, List, Tuple
from .team import Team


class PressureModel:
    """
    Model pressure propagation from defending team to attacking team
    
    PressureImpact_j = PMU_i * FormationCoherence * exp(-Distance_ij / DecayRadius) * ConeFactor
    
    Factors:
    - Distance-based exponential decay (~5-10m decay radius)
    - Formation coherence (tight defense = more pressure)
    - Directional cone (pressure only in front of player)
    - Line-of-sight blocking
    """
    
    DEFAULT_DECAY_RADIUS = 6.0  # Meters - typical effective pressure zone
    MIN_PRESSURE_DISTANCE = 0.5  # Minimum distance for pressure application
    
    @staticmethod
    def distance_decay(distance: float, decay_radius: float = None) -> float:
        """
        Exponential distance decay
        exp(-distance / decay_radius)
        
        At distance = decay_radius, pressure is ~36% of max
        """
        decay_radius = decay_radius or PressureModel.DEFAULT_DECAY_RADIUS
        distance = max(PressureModel.MIN_PRESSURE_DISTANCE, distance)
        return np.exp(-distance / decay_radius)
    
    @staticmethod
    def cone_factor(
        pressuring_direction: Tuple[float, float],
        target_position: Tuple[float, float],
        pressurer_position: Tuple[float, float],
        cone_angle_degrees: float = 120
    ) -> float:
        """
        Directional cone factor
        Player can only pressure in front of them
        
        Cone is 120 degrees by default (60 degrees left and right of facing direction)
        Returns 1.0 if target is in cone, decays to 0 outside
        """
        # Vector from pressurer to target
        to_target = np.array(target_position) - np.array(pressurer_position)
        to_target_norm = np.linalg.norm(to_target)
        
        if to_target_norm < 0.1:
            return 0.0  # No pressure if on same spot
        
        to_target = to_target / to_target_norm
        
        # Facing direction (normalized)
        facing = np.array(pressuring_direction)
        facing = facing / (np.linalg.norm(facing) + 1e-6)
        
        # Cosine of angle between facing and to_target
        cos_angle = np.dot(facing, to_target)
        
        # Convert cone angle to radians
        cone_rad = np.radians(cone_angle_degrees / 2)
        cone_cos = np.cos(cone_rad)
        
        # Linear interpolation: 1.0 at center, 0.0 at cone edge
        if cos_angle >= cone_cos:
            factor = (cos_angle - cone_cos) / (1.0 - cone_cos)
            return max(0, factor)
        else:
            return 0.0
    
    @staticmethod
    def line_of_sight_block(
        target_position: Tuple[float, float],
        blocking_positions: List[Tuple[float, float]],
        blocking_threshold: float = 1.5  # Meters
    ) -> float:
        """
        Reduce pressure if blocking players obstruct direct line
        
        Returns reduction factor (0.0 = fully blocked, 1.0 = clear line)
        """
        if not blocking_positions:
            return 1.0
        
        # Simple approximation: count blockers within 1.5m of line
        blocked_count = 0
        for blocker_pos in blocking_positions:
            # Distance from blocker to target
            dist_to_blocker = np.linalg.norm(
                np.array(target_position) - np.array(blocker_pos)
            )
            if dist_to_blocker < blocking_threshold:
                blocked_count += 1
        
        # Each blocker reduces pressure by 20%
        return max(0.0, 1.0 - (blocked_count * 0.2))
    
    @staticmethod
    def compute_pressure_impact(
        pressuring_player_pmu: float,
        target_position: Tuple[float, float],
        pressurer_position: Tuple[float, float],
        formation_coherence: float,
        pressuring_direction: Tuple[float, float],
        blocking_positions: List[Tuple[float, float]] = None,
        decay_radius: float = None
    ) -> float:
        """
        Full pressure impact calculation
        
        PressureImpact = PMU_i * FormationCoherence * exp(-Distance/DecayRadius) * ConeFactor * LineOfSight
        
        Returns:
            pressure_impact: PMU reduction on target (-50 to 0 range)
        """
        distance = np.linalg.norm(
            np.array(target_position) - np.array(pressurer_position)
        )
        
        distance_factor = PressureModel.distance_decay(distance, decay_radius)
        cone_factor = PressureModel.cone_factor(
            pressuring_direction, target_position, pressurer_position
        )
        los_factor = PressureModel.line_of_sight_block(
            target_position, blocking_positions or []
        )
        
        base_impact = pressuring_player_pmu * formation_coherence
        total_impact = base_impact * distance_factor * cone_factor * los_factor
        
        return max(0, min(50, total_impact))


class OffBallMomentum:
    """
    Model off-ball pressure (counter-pressing, marking)
    Applied when team doesn't have possession
    """
    
    @staticmethod
    def compute_pressing_intensity(
        team_pmu_deficit: float,
        match_minute: int,
        game_state: str
    ) -> float:
        """
        Intensity of pressing based on tactical situation
        
        - Losing teams press harder
        - Late in match: increased pressing
        - Early match: moderate pressing
        """
        # Game state factor
        if game_state == 'losing':
            state_mult = 1.3
        elif game_state == 'leading':
            state_mult = 0.7
        else:
            state_mult = 1.0
        
        # Time factor (increases in second half and late game)
        time_factor = 0.6 + (match_minute / 90) * 0.7
        
        # PMU deficit (larger deficit = more pressing)
        deficit_factor = 1.0 + (team_pmu_deficit / 100) * 0.3
        
        intensity = state_mult * time_factor * deficit_factor
        return max(0.3, min(1.5, intensity))
    
    @staticmethod
    def aggregate_team_pressure(
        defending_team: Team,
        attacking_team_positions: List[Tuple[float, float]],
        match_minute: int,
        game_state: str
    ) -> Dict[str, float]:
        """
        Aggregate total pressure on attacking team
        
        Returns:
            pressure_by_zone: {'defensive_third': 0.45, 'middle_third': 0.30, ...}
        """
        intensity = OffBallMomentum.compute_pressing_intensity(
            0, match_minute, game_state
        )
        
        # Simplified: pressure is proportional to team momentum
        team_momentum = defending_team.aggregate_momentum(possession=False)
        
        return {
            'defensive_third': (team_momentum / 100) * intensity * 0.8,
            'middle_third': (team_momentum / 100) * intensity * 0.5,
            'attacking_third': (team_momentum / 100) * intensity * 0.3,
        }


class PossessionMomentum:
    """
    Model momentum flow when team controls ball
    Additive with off-ball pressure
    """
    
    @staticmethod
    def compute_possession_flow(
        team: Team,
        ball_position: Tuple[float, float],
        pass_accuracy: float
    ) -> float:
        """
        Momentum from maintaining possession
        
        Args:
            team: Attacking team
            ball_position: Current ball position
            pass_accuracy: Global pass accuracy (0-1)
        
        Returns:
            momentum_flow: Momentum units flowing forward
        """
        base_momentum = team.aggregate_momentum(possession=True)
        
        # Possession only generates momentum if on opponent half
        ball_x = ball_position[0]
        if ball_x < 52.5:  # Opponent half (assuming 105m pitch)
            threatening_factor = (ball_x - 52.5) / 52.5  # 0 to ~1
        else:
            threatening_factor = 1.0
        
        # Passing accuracy affects momentum preservation
        accuracy_factor = 0.5 + pass_accuracy * 0.5  # 0.5 to 1.0
        
        flow = base_momentum * threatening_factor * accuracy_factor
        return max(0, min(50, flow))
