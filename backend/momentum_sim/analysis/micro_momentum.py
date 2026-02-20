"""
momentum_sim/analysis/micro_momentum.py

Micro-Momentum 30-Second Engine
===============================

Ultra-granular momentum analysis at 10-30 second windows.

While traditional analytics look at 90-minute aggregates,
micro-momentum reveals:
  - Transition bursts (5-second counter-attack escalations)
  - Defensive recovery time compression
  - Pressure build-up in 10-second windows
  - Momentum inflection points (when games "shift")

This is where games are actually won/lost at a tactical level.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import math
import statistics


@dataclass
class MicroMomentumSnapshot:
    """
    Single snapshot of game state in a 10-30 second window.
    """
    timestamp: int  # Seconds into match (0-5400)
    window_duration: int  # 10, 15, 20, 30 seconds
    
    # Possession metrics
    possession_percentage: float  # 0-100
    pass_completion: float  # 0-1
    
    # Pressure metrics
    team_a_pressure: float  # 0-100, average distance to ball
    team_b_pressure: float  # 0-100
    
    # Technical metrics
    progressive_passes_a: int  # Passes moving ball toward goal
    progressive_passes_b: int
    tackles_a: int
    tackles_b: int
    interceptions_a: int
    interceptions_b: int
    
    # Momentum metrics
    team_a_momentum_score: float  # 0-100
    team_b_momentum_score: float
    momentum_shift_rate: float  # How fast momentum is changing (per second)
    
    # Player-level
    on_ball_player_id: Optional[str] = None
    on_ball_pressure: float = 0.0  # Distance to nearest defender
    
    # Context
    game_state: str = "open"  # 'open', 'transition', 'pressing', 'possession'
    tactical_phase: str = "buildup"  # 'buildup', 'final_third', 'defensive',  'recovery'


@dataclass
class MicroMomentumEvent:
    """
    Significant momentum event within a 30-second window.
    """
    event_type: str  # 'momentum_peak', 'momentum_trough', 'inflection', 'burst', 'collapse'
    timestamp: int  # Seconds
    player_id: str
    team_id: str
    magnitude: float  # 0-100, strength of the event
    trigger: str  # What caused it (goal, miss, press, turnover, etc.)
    impact: float  # Expected momentum shift
    is_game_changing: bool = False  # Did this shift momentum meaningfully?


class MicroMomentumEngine:
    """
    Analyze game momentum at ultra-granular resolution.
    
    Key insight: Most of football happens in 10-30 second bursts.
    Traditional analytics smooth over the actual decision points.
    """
    
    # Thresholds for detecting significant events
    MOMENTUM_PEAK_THRESHOLD = 75.0  # Momentum score > 75 = peak
    MOMENTUM_TROUGH_THRESHOLD = 25.0  # Momentum score < 25 = trough
    INFLECTION_CHANGE_RATE = 0.5  # Momentum changing >0.5 per second = inflection
    
    # Burst detection
    TRANSITION_SPEED_THRESHOLD = 7.0  # m/s average ball speed = burst
    COUNTER_ATTACK_MINIMUM_DISTANCE = 30.0  # meters forward in <10 seconds
    
    # Recovery metrics
    PRESSURE_RECOVERY_BASELINE = 20.0  # meters, normal defensive distance
    PRESSURE_SPIKE_THRESHOLD = 8.0  # Within 8m = high pressure
    
    def __init__(self, match_duration_seconds: int = 5400):  # 90 minutes
        self.match_duration = match_duration_seconds
        self.snapshots: List[MicroMomentumSnapshot] = []
        self.events: List[MicroMomentumEvent] = []
        self.momentum_history: Dict[str, List[float]] = {'A': [], 'B': []}
    
    def add_snapshot(self, snapshot: MicroMomentumSnapshot):
        """Record a micro-momentum snapshot."""
        self.snapshots.append(snapshot)
        self.momentum_history[snapshot.team_a_momentum_score].append(snapshot.team_a_momentum_score)
        self.momentum_history[snapshot.team_b_momentum_score].append(snapshot.team_b_momentum_score)
        
        # Check for significant events
        self._detect_events(snapshot)
    
    def _detect_events(self, snapshot: MicroMomentumSnapshot):
        """Detect significant momentum moments within the snapshot."""
        
        # Create event if at peak
        if snapshot.team_a_momentum_score > self.MOMENTUM_PEAK_THRESHOLD:
            self.events.append(MicroMomentumEvent(
                event_type='momentum_peak',
                timestamp=snapshot.timestamp,
                player_id=snapshot.on_ball_player_id or 'unknown',
                team_id='A',
                magnitude=snapshot.team_a_momentum_score,
                trigger=snapshot.game_state,
                impact=min(100, snapshot.team_a_momentum_score - 50),
            ))
        elif snapshot.team_a_momentum_score < self.MOMENTUM_TROUGH_THRESHOLD:
            self.events.append(MicroMomentumEvent(
                event_type='momentum_trough',
                timestamp=snapshot.timestamp,
                player_id=snapshot.on_ball_player_id or 'unknown',
                team_id='A',
                magnitude=snapshot.team_a_momentum_score,
                trigger=snapshot.game_state,
                impact=-(50 - snapshot.team_a_momentum_score),
            ))
        
        # Detect inflection points (rapid momentum shifts)
        if len(self.snapshots) >= 2:
            prev_snapshot = self.snapshots[-2]
            momentum_change_a = snapshot.team_a_momentum_score - prev_snapshot.team_a_momentum_score
            momentum_change_rate = abs(momentum_change_a / snapshot.window_duration)
            
            if momentum_change_rate > self.INFLECTION_CHANGE_RATE:
                self.events.append(MicroMomentumEvent(
                    event_type='inflection',
                    timestamp=snapshot.timestamp,
                    player_id=snapshot.on_ball_player_id or 'unknown',
                    team_id='A' if momentum_change_a > 0 else 'B',
                    magnitude=abs(momentum_change_a),
                    trigger='rapid_shift',
                    impact=momentum_change_a,
                    is_game_changing=abs(momentum_change_a) > 25,
                ))
        
        # Detect transition bursts
        if snapshot.game_state == 'transition':
            self.events.append(MicroMomentumEvent(
                event_type='burst',
                timestamp=snapshot.timestamp,
                player_id=snapshot.on_ball_player_id or 'unknown',
                team_id='A',
                magnitude=snapshot.team_a_momentum_score,
                trigger='counter_attack',
                impact=20.0,
            ))
        
        # Detect defensive collapses
        if snapshot.team_a_pressure < 15.0:  # Very close pressure = danger
            self.events.append(MicroMomentumEvent(
                event_type='collapse',
                timestamp=snapshot.timestamp,
                player_id=snapshot.on_ball_player_id or 'unknown',
                team_id='A',
                magnitude=50.0,
                trigger='defensive_vulnerability',
                impact=-15.0,
                is_game_changing=True,
            ))
    
    def get_momentum_curve(self, team_id: str, window_size: int = 300) -> List[Tuple[int, float]]:
        """
        Get smoothed momentum curve for a team.
        
        Args:
            team_id: 'A' or 'B'
            window_size: Rolling average window in seconds
        
        Returns:
            List of (timestamp, momentum) tuples
        """
        
        if team_id not in ['A', 'B']:
            return []
        
        team_key = f'team_{team_id.lower()}_momentum_score'
        momentum_values = [getattr(s, team_key) for s in self.snapshots]
        
        if not momentum_values:
            return []
        
        # Rolling average for smooth curve
        smoothed = []
        window = window_size // 10  # Assuming 10-second snapshots
        
        for i in range(len(momentum_values)):
            start = max(0, i - window)
            end = min(len(momentum_values), i + window)
            avg = statistics.mean(momentum_values[start:end])
            timestamp = self.snapshots[i].timestamp
            smoothed.append((timestamp, round(avg, 2)))
        
        return smoothed
    
    def find_inflection_points(self, team_id: str) -> List[int]:
        """
        Find timestamps where momentum changed direction significantly.
        
        Returns:
            List of timestamps (seconds) where inflections occurred
        """
        
        inflections = []
        
        team_key = f'team_{team_id.lower()}_momentum_score'
        momentum_values = [getattr(s, team_key) for s in self.snapshots]
        
        for i in range(1, len(momentum_values) - 1):
            prev = momentum_values[i - 1]
            curr = momentum_values[i]
            next_val = momentum_values[i + 1]
            
            # Peak or trough
            if (curr > prev and curr > next_val) or (curr < prev and curr < next_val):
                inflections.append(self.snapshots[i].timestamp)
        
        return inflections
    
    def analyze_transition_bursts(self) -> List[Dict]:
        """
        Identify and characterize counter-attack/transition moments.
        
        Returns:
            List of burst analysis dicts with timing, momentum gain, etc.
        """
        
        bursts = []
        
        for event in self.events:
            if event.event_type == 'burst':
                burst_analysis = {
                    'timestamp': event.timestamp,
                    'team': event.team_id,
                    'magnitude': event.magnitude,
                    'momentum_gain': event.impact,
                    'game_minute': event.timestamp // 60,
                    'is_consequential': event.is_game_changing,
                }
                bursts.append(burst_analysis)
        
        return bursts
    
    def analyze_defensive_recovery_time(self, team_id: str, position: str = 'MID') -> float:
        """
        Measure how fast a team returns to baseline defensive shape
        after losing possession in final third.
        
        Returns:
            Average recovery time in seconds
        """
        
        recovery_times = []
        position_key = f'team_{team_id.lower()}_pressure'
        
        in_danger = False
        danger_start = None
        
        for snapshot in self.snapshots:
            pressure = getattr(snapshot, position_key)
            
            if pressure < self.PRESSURE_SPIKE_THRESHOLD and not in_danger:
                in_danger = True
                danger_start = snapshot.timestamp
            elif pressure >= self.PRESSURE_RECOVERY_BASELINE and in_danger:
                recovery_time = snapshot.timestamp - danger_start
                recovery_times.append(recovery_time)
                in_danger = False
        
        return round(statistics.mean(recovery_times), 1) if recovery_times else 0.0
    
    def get_high_pressure_windows(self, team_id: str, threshold: float = 10.0) -> List[Tuple[int, int]]:
        """
        Find windows where a team was under extreme pressure.
        
        Args:
            team_id: 'A' or 'B'
            threshold: Distance threshold in meters (lower = higher pressure)
        
        Returns:
            List of (start_timestamp, end_timestamp) tuples
        """
        
        position_key = f'team_{team_id.lower()}_pressure'
        windows = []
        in_window = False
        window_start = None
        
        for snapshot in self.snapshots:
            pressure = getattr(snapshot, position_key)
            
            if pressure < threshold and not in_window:
                in_window = True
                window_start = snapshot.timestamp
            elif pressure >= threshold and in_window:
                windows.append((window_start, snapshot.timestamp))
                in_window = False
        
        # Close any open window
        if in_window and self.snapshots:
            windows.append((window_start, self.snapshots[-1].timestamp))
        
        return windows
    
    def get_momentum_shift_summary(self) -> Dict:
        """
        Generate summary of momentum dynamics throughout match.
        """
        
        team_a_values = [getattr(s, 'team_a_momentum_score') for s in self.snapshots]
        team_b_values = [getattr(s, 'team_b_momentum_score') for s in self.snapshots]
        
        summary = {
            'team_a': {
                'peak_momentum': max(team_a_values) if team_a_values else 0,
                'lowest_momentum': min(team_a_values) if team_a_values else 0,
                'average_momentum': round(statistics.mean(team_a_values), 1) if team_a_values else 0,
                'momentum_variance': round(statistics.variance(team_a_values), 1) if len(team_a_values) > 1 else 0,
                'inflection_points': len([e for e in self.events if e.team_id == 'A' and e.event_type == 'inflection']),
                'momentum_peaks': len([e for e in self.events if e.team_id == 'A' and e.event_type == 'momentum_peak']),
            },
            'team_b': {
                'peak_momentum': max(team_b_values) if team_b_values else 0,
                'lowest_momentum': min(team_b_values) if team_b_values else 0,
                'average_momentum': round(statistics.mean(team_b_values), 1) if team_b_values else 0,
                'momentum_variance': round(statistics.variance(team_b_values), 1) if len(team_b_values) > 1 else 0,
                'inflection_points': len([e for e in self.events if e.team_id == 'B' and e.event_type == 'inflection']),
                'momentum_peaks': len([e for e in self.events if e.team_id == 'B' and e.event_type == 'momentum_peak']),
            },
            'total_moments': len(self.snapshots),
            'total_events': len(self.events),
            'game_changing_events': len([e for e in self.events if e.is_game_changing]),
        }
        
        return summary
    
    def export_micro_momentum_timeline(self) -> List[Dict]:
        """
        Export complete micro-momentum timeline for visualization.
        """
        
        timeline = []
        
        for snapshot in self.snapshots:
            timeline.append({
                'timestamp': snapshot.timestamp,
                'minute': snapshot.timestamp // 60,
                'second': snapshot.timestamp % 60,
                'team_a_momentum': snapshot.team_a_momentum_score,
                'team_b_momentum': snapshot.team_b_momentum_score,
                'momentum_shift_rate': snapshot.momentum_shift_rate,
                'possession_a': snapshot.possession_percentage,
                'possession_b': 100 - snapshot.possession_percentage,
                'pressure_a': snapshot.team_a_pressure,
                'pressure_b': snapshot.team_b_pressure,
                'game_state': snapshot.game_state,
                'tactical_phase': snapshot.tactical_phase,
            })
        
        return timeline
