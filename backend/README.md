# Elite Momentum Analytics
## Physics-Inspired Football Performance Intelligence System

A next-generation analytics platform that quantifies team and player momentum dynamically, simulates alternate tactical scenarios, and provides actionable tactical insights through physics-based modeling.

---

## Project Overview

Modern football analysis focuses on statistics, heatmaps, and event counts. **Elite Momentum Analytics** goes beyond correlations by integrating:

- **Player Energy Modeling (PMU)**: Player Momentum Units quantify individual and team momentum
- **Pressure & Influence Propagation**: Model spatial pressure effects across the pitch
- **Crowd & Environmental Effects**: Calibrate home advantage through decibel levels and crowd sentiment
- **Scenario Simulation Engine**: "What-if" tactical analysis with Monte Carlo simulations
- **Multi-game Pattern Recognition**: Identify tactical fingerprints and undervalued players
- **Causal Inference**: Isolate event impacts and decay effects through instrumental variables

---

## Architecture

### Frontend
- **Framework**: React + Vite
- **Location**: `/src/`
- **Key Components**:
  - `Dashboard.jsx`: Hero banner, stat cards, match analysis
  - `QuickInsights.jsx`: Top performers, recent results, form guide
  - `SimulationEngine.js`: Core PMU and scenario simulation logic in JavaScript

### Backend
- **Framework**: Python (Flask, NumPy, SciPy)
- **Location**: `/backend/momentum_sim/`
- **Core Modules**:
  - `core/player.py`: Player class with PMU computation
  - `core/team.py`: Team formation coherence and pressure aggregation
  - `core/event.py`: Event impact calculations with contextualization
  - `core/decay.py`: Momentum decay curves and fatigue modeling
  - `core/pressure.py`: Pressure propagation and influence maps
  - `core/crowd.py`: Crowd influence and environmental effects
  - `analysis/multi_game.py`: Multi-match aggregation and tactical patterns
  - `analysis/validation.py`: Validation against xG/xT and historical analogues

---

## Core Concepts

### Player Momentum Units (PMU)

```
PMU_i,t = E_base + Σ(EventImpact_i,t^k) + CrowdImpact_i,t - Fatigue_i,t
```

**Components**:
- **E_base**: Baseline energy (position-dependent, 8-18 units)
- **EventImpact**: Contextual impact of events (tackles, passes, goals)
- **CrowdImpact**: Environmental influence (±8 units)
- **Fatigue**: Activity decay (0-100 scale)

### Event Impact Calculation

```
EventImpact = BaseImpact × PositionFactor × GameStateFactor × ZoneFactor × MinuteModifier
```

**Modifiers**:
- **Position**: Defenders +20% for tackles, Forwards +30% for shots
- **Game State**: Leading ×0.9, Losing ×1.2
- **Zone**: Defensive third ×0.8, Attacking third ×1.5
- **Minute**: Early goals less impactful (×0.7), late goals more (×1.2)

### Pressure Propagation

```
PressureImpact_j = PMU_i × FormationCoherence × exp(-Distance/DecayRadius) × ConeFactor
```

**Decay Radius**: ~6m (typical effective pressure zone)

### Crowd Influence

```
CrowdImpact = α × NoiseNormalized × ExperienceMod × StressFactor
PMU_adjusted = PMU × (1 + α × CrowdImpact)
```

α calibrated via natural experiments (COVID empty-stadium matches)

---

## Features

### 1. Real-Time Dashboard
- **PMU Tracking**: Live momentum visualization
- **Stat Cards**: Pass accuracy, possession %, xG, players tracked
- **Match Analysis**: Team pressure distribution, player momentum ranking
- **Quick Insights**: Top performers, recent results, form guide

### 2. Scenario Simulation
- **Formation Selection**: 4-3-3, 3-5-2, 5-3-2, 4-2-4
- **Tactical Options**: Aggressive, Balanced, Defensive, Possession
- **Monte Carlo Output**: 1000 iterations per scenario
- **Probability Distributions**: Goal likelihood, momentum evolution, xG/xT projections

### 3. Multi-Game Analysis
- **Player Aggregation**: Mean PMU, consistency, peak performance
- **Tactical Zones**: Identify dangerous areas, high-momentum creation zones
- **Undervalued Players**: Impact/value ratios for recruitment
- **Formation Effectiveness**: Win rates and goal differential by formation

### 4. Validation Framework
- **Cross-Match Validation**: PMU predictions vs xG/xT outcomes
- **Decay Curve Testing**: Isolate psychological vs tactical effects
- **Counterfactual Analysis**: Compare simulations with historical analogues
- **Crowd Effect Estimation**: Confidence intervals for home advantage

---

## Getting Started

### Frontend Setup

```bash
cd /path/to/simulation

npm install
npm run dev
```

Visit `http://localhost:5173/` to view the dashboard.

### Backend Setup

```bash
cd /path/to/simulation/backend

python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

pip install -r requirements.txt
```

### Usage Example

```python
from momentum_sim import Player, Team, EventImpactCalculator, EventType, PMUValidator
from momentum_sim.core.event import Event, determine_zone

# Create players
player_attrs = PlayerAttributes(speed=8.5, strength=7.0, resilience=0.75)
player = Player('P1', 'Kane', 'FWD', 'Team_A', player_attrs)

# Create team
team = Team('Team_A', 'Team A', [player], '4-3-3')

# Create event
event = Event(
    'E1', EventType.GOAL, 'P1', 'Team_A',
    timestamp=1200, location=(100, 30),
    success=True, game_state='tied', match_minute=20
)

# Calculate event impact
zone = determine_zone(event.location)
impact = EventImpactCalculator.compute_impact(
    EventType.GOAL, 'FWD', 'tied', zone, 20, True
)

# Validate predictions
validator = PMUValidator()
score = validator.cross_match_validation(predicted, actual, metric='r2')
```

---

## Key Metrics & Outputs

### Player-Level
- **Mean PMU**: Average momentum across periods
- **Consistency**: Coefficient of variation (higher = more reliable)
- **Peak PMU**: Maximum momentum achieved
- **Resilience Score**: Ability to recover from negative events

### Team-Level
- **Team Momentum**: Sum of possession + off-ball momentum
- **Formation Coherence**: Compactness metric (0-1)
- **Pressure Distribution**: Momentum by pitch zone
- **Transition Speed**: Time to build attacking momentum

### Scenario-Level
- **Goal Probability**: Likelihood within next 10-30 seconds
- **Momentum Evolution**: PMU trajectory over time
- **xG/xT Projections**: Expected goals/threat output
- **Pressure Heatmaps**: Influence zones for both teams

---

## Validation & Performance

### Validation Protocols
1. **Cross-Match**: Compare PMU predictions with actual xG/xT outcomes
2. **Decay Curves**: Test momentum persistence against player experience
3. **Counterfactual**: Compare simulations with historical analogues
4. **Formation Coherence**: Validate compactness vs defensive success (R² ~0.65-0.75)
5. **Crowd Effects**: Effect size estimation using natural experiments (COVID data)

### Benchmark Results (Target)
- PMU-xG correlation: R² > 0.70
- Scenario plausibility: >85% within ±2σ of historical distribution
- Formation coherence validation: R² > 0.65
- Crowd effect size: ±0.04-0.06 PMU per dB (home advantage)

---

## Data Requirements

### Core Inputs
- **Player Tracking**: 3D coordinates (x, y, z) at 25-50 fps
- **Ball Data**: Trajectory, velocity, spin
- **Event Logs**: Passes, tackles, shots, goals, fouls
- **Formation Context**: Positional roles at match-level
- **Match Context**: Score, minute, substitutions, crowd presence

### Optional (Enhanced)
- **Biometrics**: Heart rate, HRV (stress/fatigue)
- **Accelerometer/IMU**: Energy expenditure estimation
- **Eye-Tracking**: Attention & decision-making proxy
- **Crowd Audio**: Decibel levels, sentiment analysis
- **Weather/Pitch**: Temperature, precipitation, grass coverage

### Historical
- **10+ Seasons**: Tracking + events for training and validation
- **Multi-League**: Generalization across competitions

---

## Methodology

### Data Pipeline
1. **Acquisition**: Multi-source tracking, events, biometrics
2. **Cleaning**: Trajectory smoothing, occlusion handling, timestamp alignment
3. **Feature Engineering**: PMU, pressure maps, momentum streams
4. **Causal Analysis**: Propensity score matching, IV analysis
5. **Simulation**: Monte Carlo scenarios with opponent adaptation
6. **Validation**: Cross-match, decay curves, counterfactuals
7. **Visualization**: 2D/3D dashboards, scenario exploration

### Key Assumptions
- Player momentum exhibits temporal decay (supported by psychological research)
- Crowd effects calibrate via natural experiments (COVID data validations)
- Opponent adaptation follows Bayesian learning or RL principles
- Formation coherence inversely correlates with spatial variance
- Fatigue impact on PMU is approximately linear until extreme levels

---

## Challenges & Future Work

### Known Limitations
1. **Data Scarcity**: Most teams lack high-fidelity tracking + biometrics
2. **Causality**: Counterfactuals fundamentally unobservable
3. **Opponent Adaptation**: Tactical evolution hard to predict
4. **Computational Demand**: Large-scale simulations require significant infrastructure
5. **interpretability**: Complex models risk distrust from coaches

### Future Enhancements
- **RL-Based Opponents**: Self-play agents for realistic opponent adaptation
- **Expected Goals Integration**: Direct correlation PMU → xG/xT outcomes
- **3D Visualization**: Unity/Unreal engine for immersive scenario exploration
- **Injury Risk Modeling**: Fatigue accumulation as injury predictor
- **Transfer Market Integration**: Market valuation API for undervalued player detection
- **Real-Time API**: WebSocket streaming for in-game decision support

---

## Applications

### Tactical Analysis
- Identify dangerous pitch zones and pressure strategies
- Predict momentum shifts under hypothetical tactics
- Pre-match preparation: opponent pressure mapping

### Player Performance & Scouting
- Quantify resilience and energy persistence
- Compare players on momentum contribution (adjusted for position/context)
- Identify undervalued players with high PMU/market cap ratio

### In-Game Decision Support
- Predict opponent adaptation to formation changes
- Suggest optimal pressure zones or tactical adjustments
- Real-time momentum tracking for coaching decisions

### Content & Broadcasting
- 3D momentum overlays for broadcast graphics
- "What-if" scenario replays for fan engagement
- Energy heatmaps and pressure visualizations

---

## Contributing

This project is in active development. Key areas for contribution:
- Crowd influence calibration (especially audience sentiment analysis)
- Opponent adaptation modeling (RL/Bayesian approaches)
- 3D visualization improvements
- Validation against additional leagues/datasets
- Integration with tracking data providers

---

## License

Proprietary - Elite Momentum Analytics

---

## Contact & Support

For questions, suggestions, or collaboration inquiries:
- **Email**: team@momentumanalytics.com
- **Documentation**: [Full Technical Appendix](./TECHNICAL_APPENDIX.md)

---

**Built 2026 | Advancing the Science of Football Analytics**
