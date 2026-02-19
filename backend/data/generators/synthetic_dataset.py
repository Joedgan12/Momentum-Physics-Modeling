"""
backend/data/generators/synthetic_dataset.py
Generate synthetic match datasets for validation testing
"""

import json
import random
from pathlib import Path
from typing import Dict, List


class SyntheticDatasetGenerator:
    """Generate realistic synthetic match data for calibration."""

    FORMATIONS = ["4-3-3", "4-4-2", "3-5-2", "5-3-2", "4-2-4"]
    TACTICS = ["aggressive", "balanced", "defensive", "possession"]
    TEAM_NAMES = [
        "Arsenal",
        "Liverpool",
        "Manchester United",
        "Manchester City",
        "Chelsea",
        "Tottenham",
        "Newcastle",
        "Brighton",
        "Aston Villa",
        "Fulham",
        "Brentford",
        "Everton",
        "Ipswich",
        "Nottingham",
        "Bournemouth",
    ]

    def __init__(self, seed: int = 42):
        """Initialize generator with optional seed for reproducibility."""
        random.seed(seed)

    @staticmethod
    def _formation_to_coherence(formation: str) -> float:
        """Map formation to coherence score (0.80-0.90)."""
        coherence_map = {
            "4-3-3": 0.87,
            "4-4-2": 0.84,
            "3-5-2": 0.85,
            "5-3-2": 0.86,
            "4-2-4": 0.80,
        }
        return coherence_map.get(formation, 0.85)

    @staticmethod
    def _tactic_to_xg_multiplier(tactic: str) -> float:
        """Map tactic to xG multiplier (0.75-1.20)."""
        multiplier_map = {
            "aggressive": 1.20,
            "balanced": 1.00,
            "defensive": 0.75,
            "possession": 0.95,
        }
        return multiplier_map.get(tactic, 1.0)

    @classmethod
    def generate_match(cls, match_id: int) -> Dict:
        """
        Generate a single synthetic match.

        Returns:
            Dictionary with: match_id, date, team_a, team_b, formation_a, formation_b,
                           tactic_a, tactic_b, goals_a, goals_b, xg_a, xg_b, etc.
        """
        # Random team selection
        teams = random.sample(cls.TEAM_NAMES, 2)
        team_a, team_b = teams[0], teams[1]

        # Random formations and tactics
        formation_a = random.choice(cls.FORMATIONS)
        formation_b = random.choice(cls.FORMATIONS)
        tactic_a = random.choice(cls.TACTICS)
        tactic_b = random.choice(cls.TACTICS)

        # Calculate base xG from formations and tactics
        coherence_a = cls._formation_to_coherence(formation_a)
        coherence_b = cls._formation_to_coherence(formation_b)

        tactic_mult_a = cls._tactic_to_xg_multiplier(tactic_a)
        tactic_mult_b = cls._tactic_to_xg_multiplier(tactic_b)

        base_xg = 0.035  # League average

        # Team A xG influenced by Team B's defensive setup
        xg_a_raw = base_xg * tactic_mult_a * coherence_a * (1.0 - coherence_b * 0.1)

        # Team B xG influenced by Team A's defensive setup
        xg_b_raw = base_xg * tactic_mult_b * coherence_b * (1.0 - coherence_a * 0.1)

        # Add random noise (±20%)
        xg_a = xg_a_raw * random.uniform(0.8, 1.2)
        xg_b = xg_b_raw * random.uniform(0.8, 1.2)

        # Convert xG to goal probability (nonlinear: higher xG = slightly diminishing returns)
        goal_prob_a = 1.0 - pow(0.98, xg_a * 100)  # Sigmoid-like
        goal_prob_b = 1.0 - pow(0.98, xg_b * 100)

        # Generate goals using probabilities
        goals_a = 1 if random.random() < goal_prob_a else 0
        goals_a += (
            1 if random.random() < (goal_prob_a * 0.3) else 0
        )  # 30% chance of 2nd goal

        goals_b = 1 if random.random() < goal_prob_b else 0
        goals_b += 1 if random.random() < (goal_prob_b * 0.3) else 0

        # Possession (based on tactics)
        if tactic_a == "possession":
            possession_a = random.uniform(55, 70)
        elif tactic_a == "defensive":
            possession_a = random.uniform(35, 50)
        else:
            possession_a = random.uniform(45, 55)

        possession_b = 100.0 - possession_a

        # Shots (rough estimate: ~3-5 shots per 0.01 xG)
        shots_a = max(1, int(xg_a * 300) + random.randint(-2, 2))
        shots_b = max(1, int(xg_b * 300) + random.randint(-2, 2))

        # Tackles/pressure (more with defensive tactic)
        if tactic_a == "aggressive":
            tackles_a = random.randint(10, 20)
        elif tactic_a == "defensive":
            tackles_a = random.randint(20, 35)
        else:
            tackles_a = random.randint(12, 22)

        if tactic_b == "aggressive":
            tackles_b = random.randint(10, 20)
        elif tactic_b == "defensive":
            tackles_b = random.randint(20, 35)
        else:
            tackles_b = random.randint(12, 22)

        # Passes (possession-based)
        total_passes_a = int(possession_a * 10 + random.randint(-20, 20))
        total_passes_b = int(possession_b * 10 + random.randint(-20, 20))

        return {
            "match_id": str(match_id),
            "date": f"2025-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
            "team_a": team_a,
            "team_b": team_b,
            "formation_a": formation_a,
            "formation_b": formation_b,
            "tactic_a": tactic_a,
            "tactic_b": tactic_b,
            "goals_a": goals_a,
            "goals_b": goals_b,
            "xg_a": round(xg_a, 3),
            "xg_b": round(xg_b, 3),
            "shot_count_a": shots_a,
            "shot_count_b": shots_b,
            "tackles_a": tackles_a,
            "tackles_b": tackles_b,
            "passes_a": total_passes_a,
            "passes_b": total_passes_b,
            "possession_a": round(possession_a, 1),
            "possession_b": round(possession_b, 1),
        }

    @classmethod
    def generate_dataset(cls, num_matches: int = 100, seed: int = 42) -> List[Dict]:
        """
        Generate a dataset of synthetic matches.

        Args:
            num_matches: Number of matches to generate (default: 100)
            seed: Random seed for reproducibility

        Returns:
            List of match dictionaries
        """
        random.seed(seed)
        matches = []

        for i in range(num_matches):
            match = cls.generate_match(match_id=i + 1)
            matches.append(match)

        return matches

    @staticmethod
    def save_dataset(
        matches: List[Dict], output_path: str = "backend/data/synthetic_matches.json"
    ):
        """Save dataset to JSON file."""
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w") as f:
            json.dump(matches, f, indent=2)

        print(f"✓ Saved {len(matches)} synthetic matches to {output_path}")
        return output_path


if __name__ == "__main__":
    # Generate sample dataset
    generator = SyntheticDatasetGenerator(seed=42)
    dataset = generator.generate_dataset(num_matches=100)
    generator.save_dataset(dataset)

    # Print summary
    print("\nDataset Summary:")
    print(f"  Total matches: {len(dataset)}")
    print(f"  Avg xG (Team A): {sum(m['xg_a'] for m in dataset) / len(dataset):.3f}")
    print(f"  Avg xG (Team B): {sum(m['xg_b'] for m in dataset) / len(dataset):.3f}")
    print(
        f"  Avg goals (Team A): {sum(m['goals_a'] for m in dataset) / len(dataset):.2f}"
    )
    print(
        f"  Avg goals (Team B): {sum(m['goals_b'] for m in dataset) / len(dataset):.2f}"
    )
