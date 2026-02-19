"""Coaching intelligence module — integrates elite coach tactics into AI"""

from .coaching_knowledge import (
    ELITE_COACHES,
    CoachProfile,
    get_all_coaches,
    get_coach_recommendations_for_state,
    get_coach_tactical_profile,
    get_coaches_by_style,
    get_formation_by_coach,
    get_training_emphasis,
)

__all__ = [
    "CoachProfile",
    "ELITE_COACHES",
    "get_coach_recommendations_for_state",
    "get_coach_tactical_profile",
    "get_formation_by_coach",
    "get_training_emphasis",
    "get_all_coaches",
    "get_coaches_by_style",
]
