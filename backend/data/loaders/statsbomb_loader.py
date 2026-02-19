"""
backend/data/loaders/statsbomb_loader.py
Load and parse StatsBomb match data for model calibration
"""

import json
from pathlib import Path
from typing import Dict, List, Optional


class StatsBombLoader:
    """Load and normalize StatsBomb match JSON data."""

    def __init__(self, data_dir: str = "backend/data/raw"):
        """
        Initialize loader with data directory.

        Expected structure:
            backend/data/raw/
            ├── matches.json
            └── events.json
        """
        self.data_dir = Path(data_dir)
        self.matches = []
        self.events = {}

    def load_matches(self, file_path: Optional[str] = None) -> List[Dict]:
        """
        Load matches from JSON file.

        Args:
            file_path: Path to matches.json (default: data_dir/matches.json)

        Returns:
            List of match dictionaries
        """
        if file_path is None:
            file_path = self.data_dir / "matches.json"

        if not Path(file_path).exists():
            print(f"Warning: {file_path} not found, returning empty list")
            return []

        with open(file_path, "r") as f:
            self.matches = json.load(f)

        return self.matches

    def load_events(self, file_path: Optional[str] = None) -> Dict:
        """
        Load events from JSON file.

        Args:
            file_path: Path to events.json

        Returns:
            Dictionary mapping match_id -> list of events
        """
        if file_path is None:
            file_path = self.data_dir / "events.json"

        if not Path(file_path).exists():
            print(f"Warning: {file_path} not found, returning empty dict")
            return {}

        with open(file_path, "r") as f:
            events_data = json.load(f)

        # Index events by match_id
        self.events = {}
        for event in events_data:
            match_id = event.get("match_id", "unknown")
            if match_id not in self.events:
                self.events[match_id] = []
            self.events[match_id].append(event)

        return self.events

    def extract_match_stats(self, match: Dict) -> Dict:
        """
        Extract key statistics from a match.

        Args:
            match: Match dictionary from StatsBomb

        Returns:
            Dictionary with: match_id, date, team_a, team_b, goals_a, goals_b, xg_a, xg_b, etc.
        """
        match_id = match.get("match_id")
        events = self.events.get(match_id, [])

        # Extract teams
        home_team = match.get("home_team", {})
        away_team = match.get("away_team", {})

        team_a_name = home_team.get("home_team_name", "Team A")
        team_b_name = away_team.get("away_team_name", "Team B")

        # Count goals from events
        goals_a = 0
        goals_b = 0

        for event in events:
            if event.get("type") == "Shot":
                outcome = event.get("shot", {}).get("outcome", {})
                if outcome.get("name") == "Goal":
                    team = event.get("team", {}).get("id")
                    if team == home_team.get("home_team_id"):
                        goals_a += 1
                    else:
                        goals_b += 1

        # Calculate xG from shots
        xg_a = 0.0
        xg_b = 0.0

        for event in events:
            if event.get("type") == "Shot":
                shot_data = event.get("shot", {})
                xg_val = shot_data.get("statsbomb_xg", 0.0)

                team = event.get("team", {}).get("id")
                if team == home_team.get("home_team_id"):
                    xg_a += xg_val
                else:
                    xg_b += xg_val

        # Count passes (proxy for possession)
        passes_a = sum(
            1
            for e in events
            if e.get("type") == "Pass"
            and e.get("team", {}).get("id") == home_team.get("home_team_id")
        )
        passes_b = sum(
            1
            for e in events
            if e.get("type") == "Pass"
            and e.get("team", {}).get("id") == away_team.get("away_team_id")
        )

        # Count tackles (proxy for pressure)
        tackles_a = sum(
            1
            for e in events
            if e.get("type") == "Tackle"
            and e.get("team", {}).get("id") == home_team.get("home_team_id")
        )
        tackles_b = sum(
            1
            for e in events
            if e.get("type") == "Tackle"
            and e.get("team", {}).get("id") == away_team.get("away_team_id")
        )

        # Count shots
        shots_a = sum(
            1
            for e in events
            if e.get("type") == "Shot"
            and e.get("team", {}).get("id") == home_team.get("home_team_id")
        )
        shots_b = sum(
            1
            for e in events
            if e.get("type") == "Shot"
            and e.get("team", {}).get("id") == away_team.get("away_team_id")
        )

        return {
            "match_id": match_id,
            "date": match.get("match_date", ""),
            "team_a": team_a_name,
            "team_b": team_b_name,
            "goals_a": goals_a,
            "goals_b": goals_b,
            "xg_a": round(xg_a, 3),
            "xg_b": round(xg_b, 3),
            "passes_a": passes_a,
            "passes_b": passes_b,
            "tackles_a": tackles_a,
            "tackles_b": tackles_b,
            "shots_a": shots_a,
            "shots_b": shots_b,
            "possession_a": round(passes_a / (passes_a + passes_b) * 100, 1)
            if (passes_a + passes_b) > 0
            else 50.0,
        }

    def extract_all_stats(self) -> List[Dict]:
        """Extract stats for all loaded matches."""
        if not self.matches:
            print("No matches loaded. Call load_matches() first.")
            return []

        stats = []
        for match in self.matches:
            try:
                stat = self.extract_match_stats(match)
                stats.append(stat)
            except Exception as e:
                print(f"Error extracting stats for match {match.get('match_id')}: {e}")
                continue

        return stats
