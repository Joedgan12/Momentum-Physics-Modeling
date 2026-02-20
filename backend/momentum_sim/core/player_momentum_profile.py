"""
momentum_sim/core/player_momentum_profile.py

Player Momentum Personality Profiles
====================================

Define distinctive psychological momentum curves for player archetypes.
Example: "The Olunga Momentum Profile" - late-game intensity spike, 
aerial dominance, clutch probability scaling after 70th minute.

Each player gets a personality-driven momentum curve that's unique and
defensible as a differentiated feature.
"""

from dataclasses import dataclass
from typing import Dict, Callable, Optional
import math


@dataclass
class MomentumProfile:
    """
    Defines a player's unique momentum identity.
    
    Rather than generic attributes, each player has a personality-driven curve.
    """
    player_id: str
    player_name: str
    profile_type: str  # 'clutch_finisher', 'rhythm_player', 'aggressive_presser', etc.
    
    # Curve modifiers
    fatigue_sensitivity: float = 1.0  # How much fatigue affects momentum
    pressure_resilience: float = 1.0  # How well they handle high-pressure moments
    rhythm_dependency: float = 1.0  # How much they need touches/success streak
    game_phase_sensitivity: Dict[str, float] = None  # Performance by phase
    crowd_response: float = 1.0  # How much crowd noise affects them
    
    # Unique traits
    late_game_intensity: float = 1.0  # Boost in final 30 min
    aerial_dominance: float = 1.0  # Header/cross advantage
    counter_attack_burst: float = 1.0  # Transition speed multiplier
    set_piece_specialization: float = 1.0  # Free kick / penalty skill
    
    # Psychological traits
    mental_toughness: float = 0.7
    clutch_factor: float = 0.8
    consistency: float = 0.75
    recovery_speed: float = 0.5
    
    def __post_init__(self):
        if self.game_phase_sensitivity is None:
            self.game_phase_sensitivity = {
                'early': 0.95,      # 0-15 min
                'buildup': 1.0,     # 15-45 min
                'halftime_adjustment': 0.9,  # 45-50 min
                'second_half_start': 1.05,   # 50-60 min
                'final_stretch': 1.15,       # 60-75 min
                'clutch_time': 1.30,         # 75+ min
            }


class MomentumProfileLibrary:
    """
    Pre-defined momentum personality profiles for iconic players.
    
    These are defensible, unique curves that differentiate the simulation.
    """
    
    @staticmethod
    def olunga_momentum_profile() -> MomentumProfile:
        """
        The Olunga Momentum Profile
        
        Traits:
        - Late-game intensity spike (gets stronger after 70')
        - Aerial dominance (header accuracy, positioning)
        - Clutch finisher (penalty conversion, 1v1s)
        - Physical/mental decline in midfield (builds toward opportunities)
        """
        return MomentumProfile(
            player_id="olunga",
            player_name="Michael Olunga",
            profile_type="clutch_finisher_aerial",
            fatigue_sensitivity=0.8,  # Slightly resilient to fatigue
            pressure_resilience=1.3,  # Loves pressure
            rhythm_dependency=0.6,  # Doesn't need many touches
            game_phase_sensitivity={
                'early': 0.90,
                'buildup': 1.0,
                'halftime_adjustment': 0.85,
                'second_half_start': 1.05,
                'final_stretch': 1.25,  # BIG jump
                'clutch_time': 1.40,    # Peak performance
            },
            crowd_response=0.9,
            late_game_intensity=1.40,
            aerial_dominance=1.45,  # His signature strength
            counter_attack_burst=1.25,
            set_piece_specialization=1.35,  # Penalties, headers
            mental_toughness=0.85,
            clutch_factor=1.0,  # This is his DNA
            consistency=0.70,  # Streaky
            recovery_speed=0.6,  # Takes time to get going
        )
    
    @staticmethod
    def salah_momentum_profile() -> MomentumProfile:
        """
        The Salah Momentum Profile
        
        Traits:
        - Rhythm player (needs consecutive touches)
        - Consistent high performance (veteran poise)
        - Quick recovery from setbacks
        - Speed-based momentum (dribble bursts)
        """
        return MomentumProfile(
            player_id="salah",
            player_name="Mohamed Salah",
            profile_type="rhythm_winger",
            fatigue_sensitivity=1.1,
            pressure_resilience=1.15,
            rhythm_dependency=1.3,  # Loves rhythm
            game_phase_sensitivity={
                'early': 1.05,
                'buildup': 1.10,
                'halftime_adjustment': 0.95,
                'second_half_start': 1.15,
                'final_stretch': 1.10,
                'clutch_time': 1.20,
            },
            crowd_response=0.8,
            late_game_intensity=1.10,
            aerial_dominance=0.7,
            counter_attack_burst=1.35,
            set_piece_specialization=1.20,
            mental_toughness=0.80,
            clutch_factor=0.95,
            consistency=0.90,  # Very consistent
            recovery_speed=0.9,  # Bounces back quickly
        )
    
    @staticmethod
    def haaland_momentum_profile() -> MomentumProfile:
        """
        The Haaland Momentum Profile
        
        Traits:
        - Physical dominance in 1v1
        - Consistent high throughput (high-volume finisher)
        - Counter-attack lethal weapon
        - Minimal dependency on rhythm (hunger-driven)
        """
        return MomentumProfile(
            player_id="haaland",
            player_name="Erling Haaland",
            profile_type="physical_finisher",
            fatigue_sensitivity=1.0,
            pressure_resilience=1.1,
            rhythm_dependency=0.5,  # Minimal rhythm dependency
            game_phase_sensitivity={
                'early': 1.0,
                'buildup': 1.05,
                'halftime_adjustment': 0.90,
                'second_half_start': 1.10,
                'final_stretch': 1.15,
                'clutch_time': 1.25,
            },
            crowd_response=0.7,
            late_game_intensity=1.20,
            aerial_dominance=1.10,
            counter_attack_burst=1.50,  # ELITE
            set_piece_specialization=1.0,
            mental_toughness=0.85,
            clutch_factor=0.90,
            consistency=0.85,  # High scoring rate
            recovery_speed=0.80,
        )
    
    @staticmethod
    def de_bruyne_momentum_profile() -> MomentumProfile:
        """
        The De Bruyne Momentum Profile
        
        Traits:
        - Playmaking momentum (assists/key passes)
        - Versatility (can play multiple positions)
        - Long-range threat (shot power)
        - Leadership/experience modulates teammates
        """
        return MomentumProfile(
            player_id="de_bruyne",
            player_name="Kevin De Bruyne",
            profile_type="creative_midfielder",
            fatigue_sensitivity=1.05,
            pressure_resilience=1.20,
            rhythm_dependency=1.1,
            game_phase_sensitivity={
                'early': 1.0,
                'buildup': 1.15,
                'halftime_adjustment': 1.0,
                'second_half_start': 1.10,
                'final_stretch': 1.15,
                'clutch_time': 1.25,
            },
            crowd_response=0.75,
            late_game_intensity=1.20,
            aerial_dominance=0.8,
            counter_attack_burst=1.20,
            set_piece_specialization=1.30,
            mental_toughness=0.90,
            clutch_factor=1.0,
            consistency=0.92,  # Elite consistency
            recovery_speed=1.0,
        )
    
    @staticmethod
    def van_dijk_momentum_profile() -> MomentumProfile:
        """
        The Van Dijk Momentum Profile
        
        Traits:
        - Leadership/authority momentum
        - Resilience under pressure (veteran poise)
        - Leadership radius (affects teammates nearby)
        - Set-piece defending specialization
        """
        return MomentumProfile(
            player_id="van_dijk",
            player_name="Virgil van Dijk",
            profile_type="authoritative_defender",
            fatigue_sensitivity=0.8,
            pressure_resilience=1.40,  # ELITE under pressure
            rhythm_dependency=0.7,
            game_phase_sensitivity={
                'early': 1.0,
                'buildup': 1.0,
                'halftime_adjustment': 0.95,
                'second_half_start': 1.05,
                'final_stretch': 1.15,
                'clutch_time': 1.35,
            },
            crowd_response=0.5,  # Doesn't get shaken
            late_game_intensity=1.30,
            aerial_dominance=1.40,
            counter_attack_burst=0.9,
            set_piece_specialization=1.50,  # Defending set pieces
            mental_toughness=0.95,  # ELITE
            clutch_factor=1.1,
            consistency=0.95,
            recovery_speed=0.9,
        )
    
    @staticmethod
    def young_talent_profile(name: str, position: str) -> MomentumProfile:
        """
        Generic profile for young talents.
        
        Traits:
        - High volatility
        - Quick to build rhythm
        - Vulnerable to mental pressure
        - Recovery-dependent
        """
        return MomentumProfile(
            player_id=f"young_{name.lower().replace(' ', '_')}",
            player_name=name,
            profile_type="young_talent",
            fatigue_sensitivity=1.2,
            pressure_resilience=0.75,
            rhythm_dependency=1.4,
            game_phase_sensitivity={
                'early': 0.95,
                'buildup': 1.0,
                'halftime_adjustment': 0.85,
                'second_half_start': 0.95,
                'final_stretch': 1.0,
                'clutch_time': 0.85,
            },
            crowd_response=1.2,
            late_game_intensity=0.95,
            aerial_dominance=1.0,
            counter_attack_burst=1.15,
            set_piece_specialization=0.90,
            mental_toughness=0.60,
            clutch_factor=0.70,
            consistency=0.65,
            recovery_speed=0.8,
        )
    
    @staticmethod
    def veteran_profile(name: str, position: str) -> MomentumProfile:
        """
        Generic profile for veterans.
        
        Traits:
        - Rock-solid consistency
        - Minimal volatility
        - Pressure-resistant
        - Slow rhythm building but durable
        """
        return MomentumProfile(
            player_id=f"vet_{name.lower().replace(' ', '_')}",
            player_name=name,
            profile_type="veteran",
            fatigue_sensitivity=0.9,
            pressure_resilience=1.25,
            rhythm_dependency=0.8,
            game_phase_sensitivity={
                'early': 1.0,
                'buildup': 1.0,
                'halftime_adjustment': 0.95,
                'second_half_start': 1.0,
                'final_stretch': 1.05,
                'clutch_time': 1.15,
            },
            crowd_response=0.6,
            late_game_intensity=1.10,
            aerial_dominance=1.0,
            counter_attack_burst=0.95,
            set_piece_specialization=1.05,
            mental_toughness=0.90,
            clutch_factor=0.95,
            consistency=0.90,
            recovery_speed=0.95,
        )


class MomentumProfileApplier:
    """
    Apply momentum profiles to in-game decisions and modifiers.
    """
    
    @staticmethod
    def get_game_phase_modifier(profile: MomentumProfile, match_minute: int) -> float:
        """
        Get momentum multiplier based on game phase and player's personality.
        
        Args:
            profile: Player momentum profile
            match_minute: Current minute (0-90)
        
        Returns:
            Multiplier 0.5-1.5 for momentum during this phase
        """
        
        if match_minute <= 15:
            phase = 'early'
        elif match_minute <= 45:
            phase = 'buildup'
        elif match_minute <= 50:
            phase = 'halftime_adjustment'
        elif match_minute <= 60:
            phase = 'second_half_start'
        elif match_minute <= 75:
            phase = 'final_stretch'
        else:
            phase = 'clutch_time'
        
        return profile.game_phase_sensitivity.get(phase, 1.0)
    
    @staticmethod
    def apply_profile_to_event_impact(
        base_impact: float,
        profile: MomentumProfile,
        event_type: str,
        match_minute: int,
    ) -> float:
        """
        Modulate event impact based on player's momentum personality.
        
        Olunga's goal in 85th minute has different psychological weight
        than his goal in 10th minute (personality curve).
        
        Args:
            base_impact: Base psychological impact of event
            profile: Player momentum profile
            event_type: Type of event (goal, miss, assist, etc.)
            match_minute: Current minute
        
        Returns:
            Adjusted impact value
        """
        
        # Game phase sensitivity
        phase_mult = MomentumProfileApplier.get_game_phase_modifier(profile, match_minute)
        
        # Event-specific profile adjustments
        impact = base_impact * phase_mult
        
        if event_type == 'goal':
            impact *= (1.0 + profile.late_game_intensity - 1.0)
        elif event_type in ['header', 'aerial_challenge_won']:
            impact *= profile.aerial_dominance
        elif event_type in ['tackle_won', 'press']:
            impact *= profile.pressure_resilience
        elif event_type in ['key_pass', 'assist', 'through_ball']:
            impact *= profile.rhythm_dependency  # Playmakers benefit from rhythm
        
        return round(impact, 3)
    
    @staticmethod
    def get_strength_modifier(
        profile: MomentumProfile,
        situation: str,  # '1v1', 'open_play', 'set_piece', 'counter', 'transition'
    ) -> float:
        """
        Get strength modifier for specific game situations based on profile.
        
        Haaland excels in counter-attacks and 1v1s.
        De Bruyne excels in possession and set pieces.
        Van Dijk excels in set-piece defending.
        """
        
        modifiers = {
            '1v1': 1.0 + (profile.pressure_resilience - 1.0) * 0.5,
            'open_play': profile.rhythm_dependency,
            'set_piece': profile.set_piece_specialization,
            'counter': profile.counter_attack_burst,
            'transition': profile.counter_attack_burst * 0.8,
        }
        
        return modifiers.get(situation, 1.0)
