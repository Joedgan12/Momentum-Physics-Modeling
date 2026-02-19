"""
momentum_sim/core/event.py
Event handling and contextual impact computation
"""

from dataclasses import dataclass
from typing import Optional, Dict
from enum import Enum
import numpy as np


class EventType(Enum):
    """Match event types"""
    PASS = "pass"
    TACKLE = "tackle"
    INTERCEPTION = "interception"
    SHOT = "shot"
    GOAL = "goal"
    GOAL_CONCEDED = "goal_conceded"
    FOUL = "foul"
    TURNOVER = "turnover"
    DRIBBLE = "dribble"
    CLEARANCE = "clearance"


@dataclass
class Event:
    """
    Represents a discrete match event
    """
    event_id: str
    event_type: EventType
    player_id: str
    team_id: str
    timestamp: float  # Match time in seconds
    location: tuple  # (x, y) on pitch
    success: bool = True
    
    # Context modifiers
    game_state: str = 'tied'  # 'leading', 'tied', 'losing'
    match_minute: int = 45
    opponent_threat_level: float = 0.5  # 0-1
    
    # Optional metadata
    assisted_by: Optional[str] = None
    zone: Optional[str] = None  # 'defensive_third', 'middle_third', 'attacking_third'
    

class EventImpactCalculator:
    """
    Compute contextualized event impacts (EventImpact component of PMU)
    
    EventImpact_k = BaseImpact * PositionFactor * GameStateFactor * ZoneFactor * MinuteModifier
    """
    
    # Base impacts (PMU units)
    BASE_IMPACTS = {
        EventType.TACKLE: 5,
        EventType.INTERCEPTION: 3,
        EventType.PASS: 2,
        EventType.SHOT: 4,
        EventType.GOAL: 15,
        EventType.GOAL_CONCEDED: -10,
        EventType.FOUL: -3,
        EventType.TURNOVER: -2,
        EventType.DRIBBLE: 3,
        EventType.CLEARANCE: 2,
    }
    
    @staticmethod
    def get_base_impact(event_type: EventType) -> float:
        """Base impact for event type"""
        return EventImpactCalculator.BASE_IMPACTS.get(event_type, 0)
    
    @staticmethod
    def position_factor(player_position: str) -> float:
        """
        Position-specific impact normalization
        Defenders get more credit for defensive actions
        Forwards get more credit for attacking actions
        """
        factors = {
            'GK': 0.8,
            'DEF': 1.2,  # Defenders: enhanced impact for tackles/clearances
            'MID': 1.0,
            'FWD': 1.3,  # Forwards: enhanced impact for shots/goals
        }
        return factors.get(player_position, 1.0)
    
    @staticmethod
    def game_state_factor(game_state: str) -> float:
        """
        Modify impact based on match situation
        Same impact has more value when losing
        """
        factors = {
            'leading': 0.9,    # Slightly reduced impact when ahead
            'tied': 1.0,
            'losing': 1.2,     # Enhanced impact when behind
        }
        return factors.get(game_state, 1.0)
    
    @staticmethod
    def zone_factor(zone: str) -> float:
        """
        Zone-based impact multiplier
        Actions in attacking third are more impactful
        """
        factors = {
            'defensive_third': 0.8,
            'middle_third': 1.0,
            'attacking_third': 1.5,
        }
        return factors.get(zone, 1.0)
    
    @staticmethod
    def minute_modifier(minute: int) -> float:
        """
        Time-dependent decay of event significance
        Goals early in match have less psychological impact
        Late goals have higher impact
        
        Modified: e.g., 5th min goal ×0.7, 90th min goal ×1.2
        """
        # Exponential increase towards end of match
        normalized_time = minute / 90
        # Shape: low at start, peaks near 85-90 min
        modifier = 0.7 + 0.5 * np.sin(np.pi * normalized_time - np.pi/2)
        return max(0.5, min(1.3, modifier))
    
    @staticmethod
    def compute_impact(
        event_type: EventType,
        player_position: str,
        game_state: str,
        zone: str,
        match_minute: int,
        success: bool = True
    ) -> float:
        """
        Full impact calculation with all modifiers
        
        EventImpact = BaseImpact * PositionFactor * GameStateFactor * ZoneFactor * MinuteModifier
        """
        base = EventImpactCalculator.get_base_impact(event_type)
        
        # Apply modifiers only if event succeeded
        if not success:
            return base * 0.3  # Failed events have 30% impact
        
        pos_factor = EventImpactCalculator.position_factor(player_position)
        state_factor = EventImpactCalculator.game_state_factor(game_state)
        zone_factor = EventImpactCalculator.zone_factor(zone)
        minute_factor = EventImpactCalculator.minute_modifier(match_minute)
        
        impact = base * pos_factor * state_factor * zone_factor * minute_factor
        
        return max(-20, min(20, impact))  # Clamp reasonable range


def determine_zone(location: tuple, pitch_length: float = 105, pitch_width: float = 68) -> str:
    """
    Determine pitch zone from (x, y) coordinates
    """
    x = location[0]
    
    if x < pitch_length / 3:
        return 'defensive_third'
    elif x < 2 * pitch_length / 3:
        return 'middle_third'
    else:
        return 'attacking_third'
