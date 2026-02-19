"""
momentum_sim/core/crowd.py
Crowd influence and environmental effects on player momentum
"""

from typing import Optional


class CrowdInfluenceModel:
    """
    Model crowd noise and sentiment impact on player PMU

    CrowdImpact_i,t = f(HR_i, HRV_i, NoiseLevel_t, PlayerExperience_i)

    Implementation: PMU_adjusted = PMU * (1 + α * CrowdImpact)

    α calibrated via historical natural experiments (COVID-empty stadium matches)
    """

    # Calibration parameter (empirical from data)
    # Positive noise boosts home team, hurts away team
    ALPHA_HOME = 0.08  # 8% per unit noise at home
    ALPHA_AWAY = -0.12  # -12% per unit noise away

    # Heart rate baselines (bpm)
    HR_BASELINE_CALM = 80
    HR_BASELINE_MODERATE = 100
    HR_BASELINE_INTENSE = 120

    # Experience modifiers (how much crowd affects player)
    EXPERIENCE_MODIFIERS = {
        1: 1.2,  # Rookie: 20% more affected
        5: 1.0,  # Mid-career: baseline
        10: 0.7,  # Veteran: 30% less affected
        15: 0.5,  # Legend: 50% less affected
    }

    @staticmethod
    def get_experience_modifier(years_experience: int) -> float:
        """
        Interpolate experience modifier based on career years
        """
        modifiers = CrowdInfluenceModel.EXPERIENCE_MODIFIERS

        if years_experience <= 1:
            return modifiers[1]
        elif years_experience >= 15:
            return modifiers[15]
        else:
            # Linear interpolation
            lower = max(y for y in modifiers.keys() if y <= years_experience)
            upper = min(y for y in modifiers.keys() if y >= years_experience)

            if lower == upper:
                return modifiers[lower]

            fraction = (years_experience - lower) / (upper - lower)
            return modifiers[lower] * (1 - fraction) + modifiers[upper] * fraction

    @staticmethod
    def heart_rate_stress_factor(heart_rate: float, match_minute: int = 45) -> float:
        """
        Estimate stress from heart rate

        High HR while losing = more affected by crowd
        High HR while winning = less affected

        Returns stress factor: 0-2.0 range
        """
        if heart_rate < CrowdInfluenceModel.HR_BASELINE_CALM:
            stress = 0.3
        elif heart_rate < CrowdInfluenceModel.HR_BASELINE_MODERATE:
            stress = 0.7
        elif heart_rate < CrowdInfluenceModel.HR_BASELINE_INTENSE:
            stress = 1.0
        else:
            stress = 1.3 + ((heart_rate - CrowdInfluenceModel.HR_BASELINE_INTENSE) / 50)

        # Time factor: stress increases as match progresses
        fatigue_mult = 1.0 + (match_minute / 90) * 0.3

        return min(2.0, stress * fatigue_mult)

    @staticmethod
    def hrv_stress_indicator(heart_rate_variability: float) -> float:
        """
        Heart rate variability: low HRV = higher stress/fatigue

        Typical HRV ranges: 20-200ms

        Returns normalized stress (0-1)
        """
        if heart_rate_variability < 30:
            return 1.0  # Very high stress
        elif heart_rate_variability < 50:
            return 0.7
        elif heart_rate_variability < 100:
            return 0.4
        else:
            return 0.1  # Low stress

    @staticmethod
    def compute_crowd_impact(
        noise_level: float,
        is_home_team: bool,
        heart_rate: Optional[float] = None,
        hrv: Optional[float] = None,
        years_experience: int = 5,
        match_minute: int = 45,
    ) -> float:
        """
        Full crowd impact calculation

        Args:
            noise_level: Decibel level (0-130 range, ~75 is normal)
            is_home_team: Whether player is on home team
            heart_rate: Player's heart rate (bpm)
            hrv: Heart rate variability (ms)
            years_experience: Years of pro experience
            match_minute: Match progress (0-90)

        Returns:
            crowd_impact: ±5 PMU units typical range
        """
        # Normalize noise level (75 dB = neutral)
        noise_neutral = 75
        noise_delta = noise_level - noise_neutral
        noise_normalized = noise_delta / 20  # -0.25 to +2.75 range roughly

        # Base impact direction
        alpha = (
            CrowdInfluenceModel.ALPHA_HOME
            if is_home_team
            else CrowdInfluenceModel.ALPHA_AWAY
        )

        # Experience modifier (veterans less affected)
        exp_mod = CrowdInfluenceModel.get_experience_modifier(years_experience)

        # Stress modifiers (if biometric data available)
        stress_factor = 1.0
        if heart_rate:
            hr_stress = CrowdInfluenceModel.heart_rate_stress_factor(
                heart_rate, match_minute
            )
            stress_factor *= hr_stress
        if hrv:
            hrv_stress = CrowdInfluenceModel.hrv_stress_indicator(hrv)
            stress_factor *= 0.5 + hrv_stress * 0.5  # 0.5 to 1.0

        # Final impact
        impact = alpha * noise_normalized * exp_mod * stress_factor

        return max(-8, min(8, impact))  # Clamp reasonable range

    @staticmethod
    def apply_crowd_impact_to_pmu(pmu: float, crowd_impact: float) -> float:
        """
        Apply crowd impact multiplicatively

        PMU_adjusted = PMU * (1 + α * CrowdImpact)

        Args:
            pmu: Original PMU value
            crowd_impact: Output from compute_crowd_impact

        Returns:
            adjusted_pmu: PMU with crowd modifications
        """
        multiplier = 1.0 + (crowd_impact / 8) * 0.15  # Max ±15% adjustment
        return max(0, pmu * multiplier)


class EnvironmentalFactors:
    """
    Weather and pitch condition effects
    """

    @staticmethod
    def weather_modifier(
        temperature: float, precipitation: float, wind_speed: float
    ) -> float:
        """
        Combined weather modifier on team performance

        Args:
            temperature: Celsius
            precipitation: mm/hour
            wind_speed: km/h

        Returns:
            modifier: 0.8 to 1.2 range
        """
        # Optimal temperature around 15°C
        temp_factor = 1.0 - abs(temperature - 15) * 0.02  # ±2% per °C

        # Moderate rain slightly reduces pace
        rain_factor = 1.0 - min(0.1, precipitation * 0.02)

        # Wind affects long passing
        wind_factor = 1.0 - (wind_speed / 50) * 0.15

        combined = temp_factor * rain_factor * wind_factor
        return max(0.8, min(1.2, combined))

    @staticmethod
    def pitch_condition_effect(grass_coverage: float, wetness: float) -> float:
        """
        How pitch condition affects momentum

        Args:
            grass_coverage: 0-1 (1 = perfect)
            wetness: 0-1 (1 = waterlogged)

        Returns:
            momentum_adjustement: ±10% range
        """
        # Poor grass reduces ball control momentum
        surface_factor = 1.0 - (1 - grass_coverage) * 0.1

        # Wet pitches slow down play
        wetness_factor = 1.0 - wetness * 0.08

        return surface_factor * wetness_factor
