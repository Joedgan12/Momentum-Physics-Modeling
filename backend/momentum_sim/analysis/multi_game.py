"""
momentum_sim/analysis/multi_game.py
Multi-match aggregation and tactical pattern recognition
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple
from collections import defaultdict


class MultiGameAnalyzer:
    """
    Aggregate PMU and tactical metrics across multiple matches
    Identify tactical fingerprints and player value patterns
    """
    
    def __init__(self, matches: List[Dict]):
        """
        Args:
            matches: List of match results, each with PMU histories and outcomes
        """
        self.matches = matches
        self.player_pmu_stats = {}
        self.team_metrics = {}
        
    def aggregate_player_momentum(self, player_id: str, position: str = None) -> Dict:
        """
        Aggregate PMU across all matches for a player
        
        Returns:
            stats: {'mean': float, 'std': float, 'max': float, 'consistency': float}
        """
        pmuls = []
        
        for match in self.matches:
            if 'players' in match:
                for p in match['players']:
                    if p['id'] == player_id and (position is None or p['position'] == position):
                        if 'pmu_history' in p:
                            pmuls.extend(p['pmu_history'])
        
        if not pmuls:
            return None
        
        pmuls = np.array(pmuls)
        
        return {
            'player_id': player_id,
            'mean': float(np.mean(pmuls)),
            'median': float(np.median(pmuls)),
            'std': float(np.std(pmuls)),
            'max': float(np.max(pmuls)),
            'min': float(np.min(pmuls)),
            'matches_count': len(self.matches),
            'consistency': float(1 - (np.std(pmuls) / (np.mean(pmuls) + 1e-6)))  # 0-1, higher = consistent
        }
    
    def aggregate_team_momentum(self, team_id: str) -> Dict:
        """
        Aggregate team momentum metrics across matches
        """
        team_momentums = []
        formation_coherences = []
        
        for match in self.matches:
            if 'teams' in match:
                for team in match['teams']:
                    if team['id'] == team_id:
                        if 'momentum_history' in team:
                            team_momentums.extend(team['momentum_history'])
                        if 'formation_coherence' in team:
                            formation_coherences.append(team['formation_coherence'])
        
        if not team_momentums:
            return None
        
        team_momentums = np.array(team_momentums)
        formation_coherences = np.array(formation_coherences) if formation_coherences else np.array([0.8])
        
        return {
            'team_id': team_id,
            'avg_momentum': float(np.mean(team_momentums)),
            'momentum_stability': float(1 - (np.std(team_momentums) / (np.mean(team_momentums) + 1e-6))),
            'avg_formation_coherence': float(np.mean(formation_coherences)),
            'matches_analyzed': len(self.matches)
        }
    
    def identify_tactical_zones(self, team_id: str, min_momentum_threshold: float = 5.0) -> Dict:
        """
        Identify pitch zones where team creates most momentum
        
        Returns:
            zone_stats: {'defensive_third': {...}, 'middle_third': {...}, 'attacking_third': {...}}
        """
        zone_momentums = {
            'defensive_third': [],
            'middle_third': [],
            'attacking_third': []
        }
        
        for match in self.matches:
            if 'zone_moments' in match:
                for zone, moments in match['zone_moments'].items():
                    if moments:
                        zone_momentums[zone].extend(moments)
        
        stats = {}
        for zone, momentums in zone_momentums.items():
            if momentums:
                momentums = np.array(momentums)
                stats[zone] = {
                    'avg_momentum': float(np.mean(momentums)),
                    'peak_momentum': float(np.max(momentums)),
                    'frequency': len(momentums),
                    'impact': float(np.mean(momentums) * len(momentums))  # Cumulative impact
                }
            else:
                stats[zone] = {
                    'avg_momentum': 0,
                    'peak_momentum': 0,
                    'frequency': 0,
                    'impact': 0
                }
        
        return stats
    
    def detect_undervalued_players(
        self,
        position: str = None,
        market_value_threshold: float = None
    ) -> List[Dict]:
        """
        Identify players with high PMU contribution relative to market value
        (Would integrate with external valuation APIs in production)
        
        Returns:
            players: Sorted by impact/value ratio
        """
        players_data = defaultdict(list)
        
        for match in self.matches:
            if 'players' in match:
                for p in match['players']:
                    if position is None or p.get('position') == position:
                        players_data[p['id']].append({
                            'name': p.get('name'),
                            'position': p.get('position'),
                            'pmu_stats': self.aggregate_player_momentum(p['id'], position)
                        })
        
        # Score players by consistency and peak momentum
        scored_players = []
        for pid, data in players_data.items():
            if data[0]['pmu_stats']:
                stats = data[0]['pmu_stats']
                
                # Impact score: mean * consistency
                impact_score = stats['mean'] * (1 + stats['consistency'] * 0.5)
                
                scored_players.append({
                    'player_id': pid,
                    'name': data[0]['name'],
                    'position': data[0]['position'],
                    'avg_pmu': stats['mean'],
                    'consistency': stats['consistency'],
                    'impact_score': impact_score,
                    'peak_pmu': stats['max']
                })
        
        return sorted(scored_players, key=lambda p: p['impact_score'], reverse=True)
    
    def formation_analysis(self, team_id: str, formation: str) -> Dict:
        """
        Analyze team performance with specific formation across matches
        """
        formation_matches = [m for m in self.matches if m.get('formation') == formation]
        
        if not formation_matches:
            return None
        
        momentums = []
        goals_for = []
        goals_against = []
        
        for match in formation_matches:
            if 'momentum' in match:
                momentums.append(match['momentum'])
            if 'goals_for' in match:
                goals_for.append(match['goals_for'])
            if 'goals_against' in match:
                goals_against.append(match['goals_against'])
        
        return {
            'formation': formation,
            'matches': len(formation_matches),
            'avg_momentum': float(np.mean(momentums)) if momentums else 0,
            'avg_goals_for': float(np.mean(goals_for)) if goals_for else 0,
            'avg_goals_against': float(np.mean(goals_against)) if goals_against else 0,
            'goal_differential': float(np.mean(goals_for) - np.mean(goals_against)) if goals_for and goals_against else 0
        }


class TacticalFingerprint:
    """
    Identify recurring tactical patterns and team identity
    """
    
    @staticmethod
    def compute_compactness_profile(team_data: List[Dict]) -> Dict:
        """
        Measure formation tightness across multiple matches
        (Compactness: low variance of player positions)
        """
        all_compactness = []
        
        for match in team_data:
            if 'formation_coherence' in match:
                all_compactness.append(match['formation_coherence'])
        
        if not all_compactness:
            return None
        
        compactness = np.array(all_compactness)
        
        return {
            'mean_compactness': float(np.mean(compactness)),
            'compactness_variance': float(np.var(compactness)),
            'style': 'tight_defense' if np.mean(compactness) > 0.8 else 'open_play'
        }
    
    @staticmethod
    def compute_transition_speed(team_data: List[Dict]) -> float:
        """
        How quickly team transitions from defense to attack
        Based on momentum ramp-up time
        """
        transition_times = []
        
        for match in team_data:
            if 'possession_shifts' in match:
                for shift in match['possession_shifts']:
                    transition_times.append(shift.get('time_to_momentum', 10))  # seconds
        
        if not transition_times:
            return 8.0  # Default
        
        return float(np.mean(transition_times))
    
    @staticmethod
    def compute_pressure_profile(team_data: List[Dict]) -> Dict:
        """
        Where on pitch does team apply most pressure?
        """
        pressure_zones = defaultdict(list)
        
        for match in team_data:
            if 'pressure_zones' in match:
                for zone, pressure_val in match['pressure_zones'].items():
                    pressure_zones[zone].append(pressure_val)
        
        return {
            zone: float(np.mean(values))
            for zone, values in pressure_zones.items()
        }
