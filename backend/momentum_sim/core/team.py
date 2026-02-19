"""
momentum_sim/core/team.py
Team model — formation coherence, pressure aggregation, momentum streams
"""

import numpy as np
from typing import List, Dict, Optional
from .player import Player
from ..utils.constants import FORMATION_COHERENCE


class Team:
    """
    Represents a team of 11 players with formation and tactical awareness
    """
    
    def __init__(self, team_id: str, name: str, players: List[Player], formation: str = '4-3-3'):
        self.id = team_id
        self.name = name
        self.players = players
        self.formation = formation
        
        # Formation coherence metrics
        self.formation_coherence = 0.0
        self.compactness = 0.0
        self.pass_lane_density = 0.0
        
        # Momentum aggregates
        self.team_momentum = 0.0
        self.possession_momentum = 0.0
        self.off_ball_momentum = 0.0
        
    def compute_formation_coherence(self, defender_positions: np.ndarray) -> float:
        """
        Measure team compactness and formation structure
        
        FormationCoherence = 1 - (σ(DefenderPositions) / MaxDeviation) * PassLaneDensity
        
        Args:
            defender_positions: (n, 2) array of defender x,y coordinates
            
        Returns:
            coherence: 0-1 score
        """
        if len(defender_positions) < 2:
            return 1.0
        
        # Calculate spatial variance (compactness)
        std_dev = np.std(defender_positions, axis=0)
        max_deviation = 30  # Field width in meters (normalized)
        
        compactness = 1 - (np.mean(std_dev) / max_deviation)
        compactness = max(0, min(1, compactness))
        
        # Pass lane density (how tightly defenders are packed)
        # More compact = higher density = harder to pass through
        self.compactness = compactness
        self.pass_lane_density = 0.8 * compactness + 0.2  # 0.2 to 1.0 range
        
        # Final coherence metric
        self.formation_coherence = compactness * self.pass_lane_density
        
        return self.formation_coherence
    
    def aggregate_momentum(self, possession: bool = True) -> float:
        """
        Aggregate PMU across all players
        
        TeamMomentum = Sum(PMU_Possession) + Sum(PMU_OffBall)
        """
        total_pmu = sum(p.pmu for p in self.players)
        
        if possession:
            # Possession momentum: more concentrated
            self.possession_momentum = total_pmu
        else:
            # Off-ball momentum: pressure applied defensively
            self.off_ball_momentum = total_pmu
        
        self.team_momentum = self.possession_momentum + self.off_ball_momentum
        return self.team_momentum
    
    def get_formation_type(self) -> Dict[str, int]:
        """Parse formation string (e.g., '4-3-3') into role counts"""
        parts = self.formation.split('-')
        return {
            'defenders': int(parts[0]),
            'midfielders': int(parts[1]),
            'forwards': int(parts[2])
        }
    
    def get_pressure_distribution(self) -> Dict[str, List[float]]:
        """Get PMU distribution by position"""
        positions = {}
        for player in self.players:
            if player.position not in positions:
                positions[player.position] = []
            positions[player.position].append(player.pmu)
        
        return {
            pos: {
                'avg': np.mean(pmuls),
                'max': np.max(pmuls),
                'min': np.min(pmuls),
                'std': np.std(pmuls),
                'count': len(pmuls)
            }
            for pos, pmuls in positions.items()
        }
    
    def get_resilience_score(self) -> float:
        """
        Calculate team-wide resilience to momentum shocks
        Based on experience distribution
        """
        resiliences = [p.get_momentum_persistence() for p in self.players]
        return np.mean(resiliences)
