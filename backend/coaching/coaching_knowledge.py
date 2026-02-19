"""
Coaching Knowledge Base — Top 20 Coaches (2016-2026)

Curates tactical, training, and strategic patterns from elite football coaches.
Sources: Match analyses, interviews, tactical databases, public records.

This module provides:
1. Coach profiles (formation preferences, tactical DNA)
2. Tactical patterns (situational formations, pressing styles)
3. Training methodologies (fatigue management, skill development)
4. Situational recommendations (game state → optimal tactic)
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple


@dataclass
class CoachProfile:
    """Elite coach profile with tactical DNA"""

    name: str
    nationality: str
    years_active: Tuple[int, int]  # (start_year, end_year)
    primary_formation: str  # Most used formation
    alternative_formations: List[str]
    tactical_style: str  # "possession", "counter", "pressing", "balanced", etc.
    key_principles: List[str]  # Coaching philosophy
    famous_achievements: List[str]

    # Tactical preferences (0-1 scale)
    possession_preference: float  # 0=counter-attack, 1=possession-based
    pressing_intensity: float  # 0=defensively compact, 1=aggressive high press
    width_of_play: float  # 0=central play, 1=wide attacking play
    transition_speed: float  # 0=structured, 1=rapid counter

    # Training focus areas (0-1 scale)
    aerobic_emphasis: float  # Fitness conditioning
    technical_emphasis: float  # Ball control, passing
    tactical_emphasis: float  # Set pieces, patterns
    mental_emphasis: float  # Psychology, team cohesion


# Top 20 Coaches (2016-2026)
ELITE_COACHES: List[CoachProfile] = [
    CoachProfile(
        name="Carlo Ancelotti",
        nationality="Italian",
        years_active=(2016, 2026),
        primary_formation="4-3-3",
        alternative_formations=["4-2-3-1", "3-5-2"],
        tactical_style="balanced_control",
        key_principles=[
            "Experience and composure",
            "Conservative defensive structure",
            "Quick counter-attacks",
            "Set piece optimization",
        ],
        famous_achievements=["Real Madrid LaLiga wins", "Champions League trophy"],
        possession_preference=0.55,
        pressing_intensity=0.45,
        width_of_play=0.60,
        transition_speed=0.65,
        aerobic_emphasis=0.70,
        technical_emphasis=0.75,
        tactical_emphasis=0.75,
        mental_emphasis=0.60,
    ),
    CoachProfile(
        name="Pep Guardiola",
        nationality="Spanish",
        years_active=(2016, 2026),
        primary_formation="4-3-3",
        alternative_formations=["3-2-5", "4-1-4-1"],
        tactical_style="possession_control",
        key_principles=[
            "Ball retention & positional play",
            "Relentless pressing",
            "Positional superiority",
            "Suffocating defense through possession",
        ],
        famous_achievements=[
            "Manchester City dominance",
            "Multiple Premier League titles",
        ],
        possession_preference=0.95,
        pressing_intensity=0.90,
        width_of_play=0.70,
        transition_speed=0.40,
        aerobic_emphasis=0.85,
        technical_emphasis=0.95,
        tactical_emphasis=0.90,
        mental_emphasis=0.75,
    ),
    CoachProfile(
        name="Luis Enrique",
        nationality="Spanish",
        years_active=(2016, 2026),
        primary_formation="4-3-3",
        alternative_formations=["4-2-3-1", "3-4-3"],
        tactical_style="offensive_pressing",
        key_principles=[
            "Attacking football with intensity",
            "High pressing triggers",
            "Ball recovery in opponent half",
            "Fluid attacking movements",
        ],
        famous_achievements=["PSG dominance", "Barcelona treble architect"],
        possession_preference=0.80,
        pressing_intensity=0.85,
        width_of_play=0.75,
        transition_speed=0.70,
        aerobic_emphasis=0.90,
        technical_emphasis=0.85,
        tactical_emphasis=0.80,
        mental_emphasis=0.70,
    ),
    CoachProfile(
        name="Thomas Tuchel",
        nationality="German",
        years_active=(2016, 2026),
        primary_formation="3-4-2-1",
        alternative_formations=["4-2-3-1", "5-2-3"],
        tactical_style="defensive_structure",
        key_principles=[
            "Defensively organized",
            "Wing-back emphasis",
            "Defensive transitions",
            "Counter-attacking precision",
        ],
        famous_achievements=["Champions League Chelsea", "PSG consistency"],
        possession_preference=0.50,
        pressing_intensity=0.60,
        width_of_play=0.65,
        transition_speed=0.75,
        aerobic_emphasis=0.80,
        technical_emphasis=0.70,
        tactical_emphasis=0.85,
        mental_emphasis=0.75,
    ),
    CoachProfile(
        name="Jürgen Klopp",
        nationality="German",
        years_active=(2016, 2026),
        primary_formation="4-3-3",
        alternative_formations=["4-2-3-1"],
        tactical_style="heavy_metal_football",
        key_principles=[
            "Gegenpressing (immediate pressure)",
            "High intensity",
            "Wide attacking play",
            "Emotional engagement",
        ],
        famous_achievements=["Liverpool Champions League & Premier League"],
        possession_preference=0.65,
        pressing_intensity=0.95,
        width_of_play=0.80,
        transition_speed=0.85,
        aerobic_emphasis=0.95,
        technical_emphasis=0.80,
        tactical_emphasis=0.75,
        mental_emphasis=0.85,
    ),
    CoachProfile(
        name="Marco Rose",
        nationality="German",
        years_active=(2016, 2026),
        primary_formation="4-2-3-1",
        alternative_formations=["4-3-3", "3-5-2"],
        tactical_style="aggressive_pressing",
        key_principles=[
            "High-intensity pressing",
            "Attacking transition",
            "Fluid positional play",
            "Youth development",
        ],
        famous_achievements=["Borussia Dortmund & Leipzig success"],
        possession_preference=0.65,
        pressing_intensity=0.85,
        width_of_play=0.70,
        transition_speed=0.80,
        aerobic_emphasis=0.85,
        technical_emphasis=0.75,
        tactical_emphasis=0.70,
        mental_emphasis=0.65,
    ),
    CoachProfile(
        name="Zinedine Zidane",
        nationality="French",
        years_active=(2016, 2026),
        primary_formation="4-3-3",
        alternative_formations=["4-2-3-1"],
        tactical_style="balanced_pragmatic",
        key_principles=[
            "Tournament mentality",
            "Key player reliance",
            "Defensive solidity",
            "Clutch performances",
        ],
        famous_achievements=["Real Madrid 3 Champions Leagues"],
        possession_preference=0.58,
        pressing_intensity=0.50,
        width_of_play=0.65,
        transition_speed=0.70,
        aerobic_emphasis=0.75,
        technical_emphasis=0.80,
        tactical_emphasis=0.75,
        mental_emphasis=0.90,
    ),
    CoachProfile(
        name="Maurizio Sarri",
        nationality="Italian",
        years_active=(2016, 2026),
        primary_formation="4-3-3",
        alternative_formations=["3-4-3"],
        tactical_style="ballroom_football",
        key_principles=[
            "Vertically oriented possession",
            "Numerical superiority in midfield",
            "Tempo control",
            "Aesthetic football",
        ],
        famous_achievements=["Napoli attacking records", "Chelsea/Juventus tenure"],
        possession_preference=0.85,
        pressing_intensity=0.65,
        width_of_play=0.60,
        transition_speed=0.55,
        aerobic_emphasis=0.75,
        technical_emphasis=0.90,
        tactical_emphasis=0.80,
        mental_emphasis=0.60,
    ),
    CoachProfile(
        name="Luis de la Fuente",
        nationality="Spanish",
        years_active=(2016, 2026),
        primary_formation="4-3-3",
        alternative_formations=["4-1-4-1"],
        tactical_style="possession_with_intensity",
        key_principles=[
            "Spanish possession tradition",
            "Aggressive pressing",
            "Youth development",
            "Flexibility in tactics",
        ],
        famous_achievements=["Spain Euro 2024 success", "Spain Nations League"],
        possession_preference=0.80,
        pressing_intensity=0.75,
        width_of_play=0.70,
        transition_speed=0.65,
        aerobic_emphasis=0.80,
        technical_emphasis=0.85,
        tactical_emphasis=0.75,
        mental_emphasis=0.70,
    ),
    CoachProfile(
        name="Gareth Southgate",
        nationality="English",
        years_active=(2016, 2026),
        primary_formation="3-5-2",
        alternative_formations=["4-1-4-1", "4-3-3"],
        tactical_style="organized_transitional",
        key_principles=[
            "Organizational discipline",
            "Set piece optimization",
            "Defensive stability",
            "Tournament consistency",
        ],
        famous_achievements=["England Euro 2020 final", "World Cup semi-final"],
        possession_preference=0.55,
        pressing_intensity=0.60,
        width_of_play=0.65,
        transition_speed=0.70,
        aerobic_emphasis=0.80,
        technical_emphasis=0.70,
        tactical_emphasis=0.80,
        mental_emphasis=0.80,
    ),
    CoachProfile(
        name="Ange Postecoglou",
        nationality="Australian",
        years_active=(2016, 2026),
        primary_formation="4-3-3",
        alternative_formations=["4-1-4-1"],
        tactical_style="attacking_intensity",
        key_principles=[
            "Relentless attacking",
            "High press from minute 1",
            "Fearless football",
            "Exciting attacking play",
        ],
        famous_achievements=["Tottenham attacking revolution", "Celtic dominance"],
        possession_preference=0.70,
        pressing_intensity=0.90,
        width_of_play=0.75,
        transition_speed=0.80,
        aerobic_emphasis=0.90,
        technical_emphasis=0.80,
        tactical_emphasis=0.70,
        mental_emphasis=0.75,
    ),
    CoachProfile(
        name="Simone Inzaghi",
        nationality="Italian",
        years_active=(2016, 2026),
        primary_formation="3-5-2",
        alternative_formations=["3-4-2-1"],
        tactical_style="wing_back_based",
        key_principles=[
            "Wing-back dominance",
            "Pressing triggers",
            "Creative midfield play",
            "Defensive compactness",
        ],
        famous_achievements=["Inter Milan Serie A titles", "Coppa Italia"],
        possession_preference=0.60,
        pressing_intensity=0.70,
        width_of_play=0.75,
        transition_speed=0.75,
        aerobic_emphasis=0.80,
        technical_emphasis=0.75,
        tactical_emphasis=0.80,
        mental_emphasis=0.70,
    ),
    CoachProfile(
        name="Erik ten Hag",
        nationality="Dutch",
        years_active=(2016, 2026),
        primary_formation="4-3-3",
        alternative_formations=["4-2-3-1"],
        tactical_style="structured_pressing",
        key_principles=[
            "Positional discipline",
            "Pressing triggers",
            "Build-up control",
            "Youth integration",
        ],
        famous_achievements=["Ajax European success", "Manchester United rebuild"],
        possession_preference=0.70,
        pressing_intensity=0.75,
        width_of_play=0.65,
        transition_speed=0.70,
        aerobic_emphasis=0.80,
        technical_emphasis=0.85,
        tactical_emphasis=0.80,
        mental_emphasis=0.70,
    ),
    CoachProfile(
        name="Xavi Hernández",
        nationality="Spanish",
        years_active=(2016, 2026),
        primary_formation="4-3-3",
        alternative_formations=["4-1-4-1"],
        tactical_style="possession_control",
        key_principles=[
            "Barcelona philosophy continuation",
            "Positional superiority",
            "Youth development",
            "Possession patterns",
        ],
        famous_achievements=["Barcelona midfield dominance", "Copa del Rey"],
        possession_preference=0.85,
        pressing_intensity=0.70,
        width_of_play=0.65,
        transition_speed=0.50,
        aerobic_emphasis=0.75,
        technical_emphasis=0.95,
        tactical_emphasis=0.85,
        mental_emphasis=0.65,
    ),
    CoachProfile(
        name="Nico Kovač",
        nationality="Croatian",
        years_active=(2016, 2026),
        primary_formation="4-2-3-1",
        alternative_formations=["4-3-3", "3-5-2"],
        tactical_style="balanced_intensity",
        key_principles=[
            "Balanced approach",
            "Offensive transitions",
            "Defensive organization",
            "Pressing discipline",
        ],
        famous_achievements=["Bayern Munich success", "AS Monaco stability"],
        possession_preference=0.65,
        pressing_intensity=0.75,
        width_of_play=0.70,
        transition_speed=0.75,
        aerobic_emphasis=0.85,
        technical_emphasis=0.75,
        tactical_emphasis=0.80,
        mental_emphasis=0.70,
    ),
    CoachProfile(
        name="Luciano Spalletti",
        nationality="Italian",
        years_active=(2016, 2026),
        primary_formation="4-3-3",
        alternative_formations=["4-1-4-1"],
        tactical_style="offensive_balance",
        key_principles=[
            "Attacking fullbacks",
            "Pressing from midfield",
            "Dynamic transitions",
            "Player adaptability",
        ],
        famous_achievements=["Napoli record points (91)", "Italy coach"],
        possession_preference=0.70,
        pressing_intensity=0.75,
        width_of_play=0.72,
        transition_speed=0.75,
        aerobic_emphasis=0.85,
        technical_emphasis=0.80,
        tactical_emphasis=0.75,
        mental_emphasis=0.70,
    ),
    CoachProfile(
        name="Trent Alexander-Arnold (emerging)",
        nationality="English",  # Hypothetical future coach
        years_active=(2026, 2030),  # Projected future role
        primary_formation="4-3-3",
        alternative_formations=["4-2-3-1"],
        tactical_style="modern_positional",
        key_principles=[
            "Ball retention through positioning",
            "Full-back creativity",
            "Modern pressing",
            "Data-informed decisions",
        ],
        famous_achievements=["Hypothetical: Liverpool legacy"],
        possession_preference=0.75,
        pressing_intensity=0.80,
        width_of_play=0.75,
        transition_speed=0.70,
        aerobic_emphasis=0.85,
        technical_emphasis=0.90,
        tactical_emphasis=0.75,
        mental_emphasis=0.70,
    ),
    CoachProfile(
        name="Julian Nagelsmann",
        nationality="German",
        years_active=(2016, 2026),
        primary_formation="3-4-3",
        alternative_formations=["4-2-3-1", "5-3-2"],
        tactical_style="system_flexibility",
        key_principles=[
            "Tactical flexibility & innovation",
            "High pressing engagement",
            "Ball progression patterns",
            "Youth development",
        ],
        famous_achievements=["Hoffenheim overachievement", "Bayern & Leipzig success"],
        possession_preference=0.70,
        pressing_intensity=0.85,
        width_of_play=0.70,
        transition_speed=0.75,
        aerobic_emphasis=0.85,
        technical_emphasis=0.85,
        tactical_emphasis=0.85,
        mental_emphasis=0.70,
    ),
    CoachProfile(
        name="Steve Clarke",
        nationality="Scottish",
        years_active=(2016, 2026),
        primary_formation="3-5-2",
        alternative_formations=["4-2-3-1"],
        tactical_style="defensive_solidity",
        key_principles=[
            "Defensive organization",
            "Set piece threat",
            "Team unity",
            "Counter-attacking threat",
        ],
        famous_achievements=["Scotland Euro 2020 return", "Defensive stability"],
        possession_preference=0.45,
        pressing_intensity=0.55,
        width_of_play=0.60,
        transition_speed=0.70,
        aerobic_emphasis=0.80,
        technical_emphasis=0.65,
        tactical_emphasis=0.80,
        mental_emphasis=0.75,
    ),
]


def get_coach_recommendations_for_state(
    possession: float,
    fatigue: float,
    momentum: float,
    score_differential: int,
) -> List[Tuple[str, float]]:
    """
    Get top coach recommendations based on game state.
    Returns: [(coach_name, recommendation_score), ...]
    """
    recommendations = []

    for coach in ELITE_COACHES:
        score = 0.0

        # Score based on possession preference vs. current possession
        possession_match = 1.0 - abs(coach.possession_preference - (possession / 100.0))
        score += possession_match * 0.25

        # Score based on pressing intensity vs. current situation
        if momentum > 0:  # Winning, can press more
            pressing_match = coach.pressing_intensity
            score += pressing_match * 0.20
        else:  # Losing, might need conservative approach
            pressing_match = 1.0 - coach.pressing_intensity
            score += pressing_match * 0.20

        # Score based on fatigue management
        if fatigue > 70:  # Players tired, need structured approach
            structure_emphasis = 1.0 - coach.transition_speed
            score += structure_emphasis * 0.15
        else:
            score += coach.transition_speed * 0.15

        # Score based on tactical style for given situation
        if score_differential > 0:  # Winning
            # Prefer coaches known for controlling games
            score += coach.possession_preference * 0.20
        elif score_differential < 0:  # Losing
            # Prefer coaches known for transitional play
            score += coach.transition_speed * 0.20
        else:  # Tied
            # Prefer balanced coaches
            balance = 1.0 - abs(coach.possession_preference - 0.5) * 2
            score += balance * 0.20

        # Normalize to 0-1
        score = min(1.0, score / 1.0)

        recommendations.append((coach.name, score))

    # Sort by score (descending)
    recommendations.sort(key=lambda x: x[1], reverse=True)

    return recommendations


def get_coach_tactical_profile(coach_name: str) -> Optional[CoachProfile]:
    """Get full profile for a specific coach"""
    for coach in ELITE_COACHES:
        if coach.name.lower() == coach_name.lower():
            return coach
    return None


def get_formation_by_coach(coach_name: str) -> Optional[str]:
    """Get primary formation preferred by coach"""
    coach = get_coach_tactical_profile(coach_name)
    return coach.primary_formation if coach else None


def get_training_emphasis(coach_name: str) -> Optional[Dict[str, float]]:
    """Get training methodology emphasis areas"""
    coach = get_coach_tactical_profile(coach_name)
    if not coach:
        return None

    return {
        "aerobic": coach.aerobic_emphasis,
        "technical": coach.technical_emphasis,
        "tactical": coach.tactical_emphasis,
        "mental": coach.mental_emphasis,
    }


def get_all_coaches() -> List[CoachProfile]:
    """Get all elite coaches"""
    return ELITE_COACHES


def get_coaches_by_style(tactical_style: str) -> List[CoachProfile]:
    """Filter coaches by tactical style"""
    return [
        c for c in ELITE_COACHES if tactical_style.lower() in c.tactical_style.lower()
    ]
