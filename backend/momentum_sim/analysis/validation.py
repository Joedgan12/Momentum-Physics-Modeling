"""
momentum_sim/analysis/validation.py
Validation framework for PMU models against ground truth
"""

from typing import Dict, List, Tuple

import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


class PMUValidator:
    """
    Validate PMU predictions against actual match outcomes (xG, xT, goals)
    """

    @staticmethod
    def cross_match_validation(
        predicted_pmu: List[float], actual_outcomes: List[float], metric: str = "r2"
    ) -> float:
        """
        Validate PMU predictions vs actual outcomes

        Args:
            predicted_pmu: Predicted momentum values
            actual_outcomes: Ground truth (goals, xG, xT, etc.)
            metric: 'r2', 'rmse', or 'mae'

        Returns:
            score: Validation metric (higher is better)
        """
        pred = np.array(predicted_pmu)
        actual = np.array(actual_outcomes)

        if metric == "r2":
            score = r2_score(actual, pred)
            return max(0, min(1, score))  # Clamp 0-1
        elif metric == "rmse":
            score = np.sqrt(mean_squared_error(actual, pred))
            return 1 / (1 + score)  # Convert to 0-1 where 1 is perfect
        elif metric == "mae":
            score = mean_absolute_error(actual, pred)
            return 1 / (1 + score)
        else:
            raise ValueError(f"Unknown metric: {metric}")

    @staticmethod
    def decay_curve_validation(
        event_pmu_trace: List[Tuple[float, float]], resilience_type: str = "veteran"
    ) -> Dict:
        """
        Validate event decay curves isolate psychological vs tactical effects

        Analyzes whether PMU decay matches expected resilience patterns

        Args:
            event_pmu_trace: List of (time_since_event, pmu_value) tuples
            resilience_type: 'veteran', 'experienced', 'young', 'rookie'

        Returns:
            validation: {'fit_quality': float, 'decay_pattern': str, 'assumptions_met': bool}
        """
        if not event_pmu_trace or len(event_pmu_trace) < 3:
            return {"error": "Insufficient data"}

        times = np.array([t[0] for t in event_pmu_trace])
        pmuls = np.array([t[1] for t in event_pmu_trace])

        # Fit exponential decay model
        # log(PMU) = log(PMU_0) - λt
        log_pmuls = np.log(pmuls + 1)  # Avoid log(0)

        # Linear fit to log scale
        coeffs = np.polyfit(times, log_pmuls, 1)
        lambda_fit = -coeffs[0]  # Decay constant
        pmu_0_fit = np.exp(coeffs[1])

        # Quality of fit
        predicted = pmu_0_fit * np.exp(-lambda_fit * times)
        ss_res = np.sum((pmuls - predicted) ** 2)
        ss_tot = np.sum((pmuls - np.mean(pmuls)) ** 2)
        r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

        # Expected decay rates by resilience
        expected_lambda = {
            "veteran": 0.02,
            "experienced": 0.05,
            "young": 0.08,
            "rookie": 0.12,
        }

        expected = expected_lambda.get(resilience_type, 0.05)
        lambda_matches = abs(lambda_fit - expected) < 0.03

        return {
            "fit_quality": max(0, min(1, r2)),
            "decay_constant": float(lambda_fit),
            "expected_constant": expected,
            "resilience_valid": lambda_matches,
            "initial_pmu": float(pmu_0_fit),
        }

    @staticmethod
    def counterfactual_validation(
        historical_match_outcomes: List[Dict], simulated_scenarios: List[Dict]
    ) -> float:
        """
        Validate scenario simulations against historical analogues

        Example: "If Team A pressed aggressively in minute 30, what would've happened?"
        Compare simulated outcome with similar historical sequences

        Returns:
            plausibility_score: 0-1 (how realistic are simulations?)
        """
        if not historical_match_outcomes or not simulated_scenarios:
            return 0.5  # Neutral if insufficient data

        # Extract key metrics from each
        historical_outcomes = np.array(
            [m["final_momentum"] for m in historical_match_outcomes]
        )
        simulated_outcomes = np.array(
            [s.get("final_momentum", 50) for s in simulated_scenarios]
        )

        # Check if simulations fall within historical distribution
        hist_mean = np.mean(historical_outcomes)
        hist_std = np.std(historical_outcomes)

        # Score: how many simulated outcomes within 2-sigma of historical mean?
        within_range = np.sum(
            (simulated_outcomes > hist_mean - 2 * hist_std)
            & (simulated_outcomes < hist_mean + 2 * hist_std)
        )

        plausibility = (
            within_range / len(simulated_scenarios) if simulated_scenarios else 0
        )
        return float(plausibility)

    @staticmethod
    def formation_coherence_validation(
        predicted_coherence: List[float], actual_defensive_success: List[int]
    ) -> float:
        """
        Validate formation coherence metric against actual defensive performance

        (e.g., correlation between predicted compactness and tackles won)
        """
        coherence = np.array(predicted_coherence)
        success = np.array(actual_defensive_success)

        if len(coherence) < 2:
            return 0.5

        # Should be positive correlation: higher coherence -> more defensive success
        correlation = np.corrcoef(coherence, success)[0, 1]

        # Correlation should be positive
        if np.isnan(correlation):
            return 0.5

        return max(0, correlation)  # 0 if negative, up to 1 if perfect

    @staticmethod
    def crowd_influence_validation(
        noise_levels: List[float],
        home_team_pmu_deltas: List[float],
        away_team_pmu_deltas: List[float],
        confidence_level: float = 0.95,
    ) -> Dict:
        """
        Validate crowd influence effect size using natural experiments
        (e.g., COVID matches without crowds vs with crowds)

        Returns:
            validation: {'effect_size': float, 'significant': bool, 'confidence_interval': tuple}
        """
        noise = np.array(noise_levels)
        home_deltas = np.array(home_team_pmu_deltas)
        away_deltas = np.array(away_team_pmu_deltas)

        if len(noise) < 5:
            return {"error": "Need at least 5 observations"}

        # Regression: pmu_home - pmu_away ~ noise_level
        diff_deltas = home_deltas - away_deltas

        # Linear regression
        coeffs = np.polyfit(noise, diff_deltas, 1)
        effect_size = coeffs[0]  # How much noise affects home advantage

        # Estimate confidence interval (simplified)
        residuals = diff_deltas - (coeffs[0] * noise + coeffs[1])
        stderr = np.std(residuals) / np.sqrt(len(noise))
        ci = (effect_size - 1.96 * stderr, effect_size + 1.96 * stderr)

        # Effect is significant if 0 is not in CI
        significant = (ci[0] > 0) or (ci[1] < 0)

        return {
            "effect_size": float(effect_size),
            "confidence_interval": (float(ci[0]), float(ci[1])),
            "significant": significant,
            "interpretation": f"Home team gains ~{effect_size:.2f} PMU per 10dB increase",
        }
