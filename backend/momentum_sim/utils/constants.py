"""
momentum_sim/utils/constants.py
System-wide constants, calibration parameters and lookup tables
"""

# ── Pitch Geometry ─────────────────────────────────────────────────────────────
PITCH_LENGTH = 105.0  # metres (x-axis)
PITCH_WIDTH = 68.0  # metres (y-axis)
GOAL_CENTRE = (PITCH_LENGTH, PITCH_WIDTH / 2.0)
HOME_GOAL = (0.0, PITCH_WIDTH / 2.0)
PENALTY_AREA_X_THRESHOLD = PITCH_LENGTH * 0.85  # ~89 m

# ── PMU Baseline Energies (per position) ───────────────────────────────────────
BASE_ENERGY = {
    "GK": 8.0,
    "DEF": 12.0,
    "MID": 15.0,
    "FWD": 18.0,
}

# ── Event Base Impacts (PMU units, before modifiers) ───────────────────────────
EVENT_BASE_IMPACTS = {
    "pass": 2.0,
    "key_pass": 3.5,
    "through_ball": 4.0,
    "cross": 2.5,
    "tackle": 5.0,
    "tackle_won": 6.0,
    "interception": 3.0,
    "clearance": 2.0,
    "shot": 4.0,
    "shot_on_target": 5.5,
    "goal": 15.0,
    "goal_conceded": -10.0,
    "save": 5.0,
    "foul": -3.0,
    "yellow_card": -4.0,
    "red_card": -12.0,
    "turnover": -2.5,
    "dribble": 3.0,
    "dribble_success": 4.5,
    "press": 1.5,
}

# ── Position Modifiers (multiply event impact by these) ────────────────────────
POSITION_MODIFIERS = {
    "GK": {"save": 1.5, "pass": 0.8, "tackle": 0.9, "default": 1.0},
    "DEF": {
        "tackle": 1.3,
        "tackle_won": 1.4,
        "clearance": 1.4,
        "interception": 1.3,
        "goal": 1.8,
        "default": 1.0,
    },
    "MID": {
        "pass": 1.2,
        "key_pass": 1.3,
        "through_ball": 1.4,
        "goal": 1.5,
        "default": 1.0,
    },
    "FWD": {
        "shot": 1.3,
        "shot_on_target": 1.4,
        "goal": 1.2,
        "dribble_success": 1.3,
        "default": 1.0,
    },
}

# ── Game-State Modifiers ────────────────────────────────────────────────────────
GAME_STATE_MODIFIERS = {
    "leading": 0.9,
    "tied": 1.0,
    "losing": 1.2,
}

# ── Zone Modifiers (pitch thirds) ──────────────────────────────────────────────
ZONE_MODIFIERS = {
    "defensive_third": 0.8,
    "middle_third": 1.0,
    "attacking_third": 1.5,
}

# ── Minute Modifier parameters (sigmoid-like, peaks near 90') ──────────────────
MINUTE_MOD_MIN = 0.65
MINUTE_MOD_MAX = 1.30

# ── Event Decay Rates (PMU units per second of real match time) ────────────────
EVENT_DECAY_RATES = {
    "goal": 0.20,
    "goal_conceded": 0.25,
    "tackle": 0.15,
    "shot": 0.12,
    "pass": 0.05,
    "foul": 0.08,
    "default": 0.08,
}

# ── Exponential decay lambda for goal-conceded psychological shock ──────────────
GOAL_CONCEDED_LAMBDA = 0.03  # PMU(t) = PMU_0 * exp(-λt)

# ── Player Resilience Factors (momentum persistence) ───────────────────────────
RESILIENCE_MAP = {
    "veteran": 0.90,
    "experienced": 0.75,
    "young": 0.60,
    "rookie": 0.45,
}

# Experience boundaries (years)
EXPERIENCE_THRESHOLDS = {
    "rookie": (0, 2),
    "young": (2, 5),
    "experienced": (5, 10),
    "veteran": (10, 99),
}

# ── Fatigue weights ─────────────────────────────────────────────────────────────
FATIGUE_SPEED_WEIGHT = 0.002  # per m/s
FATIGUE_DISTANCE_WEIGHT = 0.0001  # per metre
FATIGUE_ACCEL_WEIGHT = 0.010  # per m/s²
FATIGUE_SPRINT_WEIGHT = 0.50  # per sprint event
FATIGUE_RECOVERY_RATE = 0.010  # rest recovery per second
FATIGUE_STOPPAGE_RATE = 0.020  # dead-ball recovery
MAX_FATIGUE = 100.0

# ── Pressure Propagation ────────────────────────────────────────────────────────
PRESSURE_DECAY_RADIUS = 6.0  # metres
PRESSURE_CONE_ANGLE_DEG = 120.0  # total cone width
LINE_OF_SIGHT_THRESHOLD = 1.5  # metres for body blocking
BLOCKER_PENALTY = 0.20  # pressure reduction per blocker

# ── Crowd / Environmental ───────────────────────────────────────────────────────
CROWD_ALPHA_HOME = 0.08
CROWD_ALPHA_AWAY = -0.12
CROWD_NEUTRAL_DB = 75.0  # dB considered neutral
CROWD_DB_SCALE = 20.0  # normalisation divisor
MAX_CROWD_IMPACT_PMU = 8.0

# Heart-rate thresholds (bpm)
HR_CALM = 80
HR_MODERATE = 100
HR_INTENSE = 120

# Crowd / experience modifier breakpoints {experience_years: modifier}
EXPERIENCE_CROWD_MODS = {1: 1.2, 5: 1.0, 10: 0.7, 15: 0.5}

# ── Formation Coherence ────────────────────────────────────────────────────────
FORMATION_COHERENCE = {
    "4-3-3": 0.87,
    "3-5-2": 0.82,
    "5-3-2": 0.85,
    "4-2-4": 0.78,
    "4-4-2": 0.84,
    "3-4-3": 0.80,
}

# ── Tactic Modifiers {tactic: {pmu_mult, off_ball_mult, possession_mult}} ──────
TACTIC_MODIFIERS = {
    "aggressive": {
        "pmu": 1.20,
        "off_ball": 0.85,
        "possession": 0.95,
        "press_intensity": 1.35,
    },
    "balanced": {
        "pmu": 1.00,
        "off_ball": 1.00,
        "possession": 1.00,
        "press_intensity": 1.00,
    },
    "defensive": {
        "pmu": 0.75,
        "off_ball": 1.25,
        "possession": 0.80,
        "press_intensity": 0.70,
    },
    "possession": {
        "pmu": 1.15,
        "off_ball": 0.80,
        "possession": 1.20,
        "press_intensity": 0.90,
    },
}

# ── Monte Carlo ────────────────────────────────────────────────────────────────
DEFAULT_MC_ITERATIONS = 1000
XG_WINDOW_SECONDS = 30  # xG evaluated over next N seconds
GOAL_PROB_SCALE = 0.15  # scale factor for goal probability
MAX_GOAL_PROB = 0.55  # upper bound per window

# ── Player roster (match-day squad, 22 outfield players) ───────────────────────
SQUAD_TEMPLATE = [
    # Team A
    {
        "id": "A1",
        "name": "M. Salah",
        "team": "A",
        "pos": "FWD",
        "xp": "veteran",
        "skill": 9.2,
        "speed": 9.1,
    },
    {
        "id": "A2",
        "name": "K. De Bruyne",
        "team": "A",
        "pos": "MID",
        "xp": "veteran",
        "skill": 9.0,
        "speed": 8.4,
    },
    {
        "id": "A3",
        "name": "V. van Dijk",
        "team": "A",
        "pos": "DEF",
        "xp": "veteran",
        "skill": 8.8,
        "speed": 7.6,
    },
    {
        "id": "A4",
        "name": "T. Alexander-Arnold",
        "team": "A",
        "pos": "DEF",
        "xp": "experienced",
        "skill": 8.5,
        "speed": 8.7,
    },
    {
        "id": "A5",
        "name": "H. Kane",
        "team": "A",
        "pos": "FWD",
        "xp": "veteran",
        "skill": 8.9,
        "speed": 7.8,
    },
    {
        "id": "A6",
        "name": "B. Saka",
        "team": "A",
        "pos": "FWD",
        "xp": "young",
        "skill": 8.4,
        "speed": 8.8,
    },
    {
        "id": "A7",
        "name": "R. James",
        "team": "A",
        "pos": "DEF",
        "xp": "experienced",
        "skill": 8.2,
        "speed": 8.5,
    },
    {
        "id": "A8",
        "name": "D. Rice",
        "team": "A",
        "pos": "MID",
        "xp": "experienced",
        "skill": 8.3,
        "speed": 8.1,
    },
    {
        "id": "A9",
        "name": "P. Foden",
        "team": "A",
        "pos": "MID",
        "xp": "experienced",
        "skill": 8.7,
        "speed": 8.6,
    },
    {
        "id": "A10",
        "name": "L. Dunk",
        "team": "A",
        "pos": "DEF",
        "xp": "veteran",
        "skill": 7.9,
        "speed": 7.2,
    },
    {
        "id": "A11",
        "name": "A. Ramsdale",
        "team": "A",
        "pos": "GK",
        "xp": "experienced",
        "skill": 8.0,
        "speed": 6.5,
    },
    # Team B
    {
        "id": "B1",
        "name": "E. Haaland",
        "team": "B",
        "pos": "FWD",
        "xp": "young",
        "skill": 9.3,
        "speed": 9.5,
    },
    {
        "id": "B2",
        "name": "B. Fernandes",
        "team": "B",
        "pos": "MID",
        "xp": "veteran",
        "skill": 8.6,
        "speed": 8.2,
    },
    {
        "id": "B3",
        "name": "R. Dias",
        "team": "B",
        "pos": "DEF",
        "xp": "veteran",
        "skill": 8.7,
        "speed": 7.9,
    },
    {
        "id": "B4",
        "name": "T. Koulibaly",
        "team": "B",
        "pos": "DEF",
        "xp": "veteran",
        "skill": 8.5,
        "speed": 7.8,
    },
    {
        "id": "B5",
        "name": "J. Bellingham",
        "team": "B",
        "pos": "MID",
        "xp": "experienced",
        "skill": 8.9,
        "speed": 8.7,
    },
    {
        "id": "B6",
        "name": "V. Osimhen",
        "team": "B",
        "pos": "FWD",
        "xp": "experienced",
        "skill": 8.6,
        "speed": 9.2,
    },
    {
        "id": "B7",
        "name": "F. de Jong",
        "team": "B",
        "pos": "MID",
        "xp": "experienced",
        "skill": 8.5,
        "speed": 8.3,
    },
    {
        "id": "B8",
        "name": "T. Hernandez",
        "team": "B",
        "pos": "DEF",
        "xp": "experienced",
        "skill": 8.1,
        "speed": 9.0,
    },
    {
        "id": "B9",
        "name": "K. Havertz",
        "team": "B",
        "pos": "FWD",
        "xp": "experienced",
        "skill": 8.2,
        "speed": 8.4,
    },
    {
        "id": "B10",
        "name": "E. Camavinga",
        "team": "B",
        "pos": "MID",
        "xp": "young",
        "skill": 8.3,
        "speed": 8.6,
    },
    {
        "id": "B11",
        "name": "E. Mendy",
        "team": "B",
        "pos": "GK",
        "xp": "veteran",
        "skill": 8.4,
        "speed": 6.8,
    },
]
