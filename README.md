# Football Momentum Physics & Scenario Simulation System

**Elite Momentum Analytics** — A physics-based player momentum unit (PMU) simulation engine with Monte Carlo scenario modeling for football (soccer) analytics.

---

## 🎯 Overview

This full-stack system models **Player Momentum Units (PMUs)** — a physics-inspired metric that captures a player's psychological, physical, and tactical state during a match.

### Core Physics Model

**PMU(t) = E_base + ΣEventImpact(t) + CrowdImpact(t) − Fatigue(t)**

Where:
- **E_base** — baseline energy from position and skill level
- **EventImpact** — contextualised impact of match events (goals, tackles, passes, etc.)
- **CrowdImpact** — home/away noise, heart rate variability, player experience
- **Fatigue** — accumulates from speed, distance, sprints; recovers during stoppages

### Key Features

✅ **22 Real Players** — Salah, De Bruyne, Haaland, Dias, etc. with authentic stats  
✅ **1000+ Match Events** — Goals, tackles, passes, interceptions with position & zone modifiers  
✅ **Monte Carlo Engine** — 500 independent match simulations to predict goal probability & xG  
✅ **Pressure Propagation** — Distance decay, cone-based cone-of-influence, formation coherence  
✅ **Fatigue Dynamics** — Speed/acceleration/sprint accumulation with recovery in stoppages  
✅ **Crowd Influence** — Home advantage via noise dB, heart rate stress, experience modifier  
✅ **Agent-Based Decisions** — Stochastic heuristic player actions based on PMU & game state  
✅ **React Frontend** — Real-time dashboard with elite gradient UI & interactive scenario panels  
✅ **Flask REST API** — Full-featured endpoints for simulation, player stats, pressure maps, etc.

---

## 🚀 Quick Start

### 1. **Install Dependencies**

```bash
# Frontend (npm)
npm install

# Backend (Python 3.12+)
python -m venv .venv
source .venv/bin/activate  # or `.\.venv\Scripts\activate` on Windows
pip install -r backend/requirements.txt
```

### 2. **Start the Servers**

```bash
# Terminal 1: Vite dev server (http://localhost:5173)
npm run dev

# Terminal 2: Flask API (http://localhost:5000)
python backend/app.py
```

### 3. **Open the Dashboard**

Visit **http://localhost:5173** in your browser.

- Select a **formation** (4-3-3, 4-4-2, 3-5-2, etc.)
- Select a **tactic** (aggressive, balanced, defensive, possession)
- Click **"Run Simulation"** to run 500 Monte Carlo iterations
- View **real-time momentum**, **goal probability**, **xG**, **player stats**, and **pressure maps**

---

## 🔌 API Endpoints

### Health & Info
- `GET /api/health` — Liveness check
- `GET /api/players?team=A` — Squad stats (optional team filter)
- `GET /api/formations` — Available formations & tactics
- `GET /api/events` — All event types & base impacts

### Simulation
- `POST /api/simulate` — **[MAIN]** Monte Carlo scenario (500 iterations by default)
- `POST /api/simulate/quick` — Single-match quick simulation

### Utilities
- `POST /api/event` — Contextual event impact for one player
- `POST /api/pressure` — Pressure map for multiple pressurers vs. target
- `POST /api/fatigue` — Fatigue update (activity burst)
- `POST /api/crowd` — Crowd effect on one player

### Example: Run Simulation

```bash
curl -X POST http://127.0.0.1:5000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "formation": "4-3-3",
    "formation_b": "4-4-2",
    "tactic": "balanced",
    "tactic_b": "balanced",
    "iterations": 500,
    "scenario": "Baseline",
    "crowd_noise": 80.0
  }'
```

---

## 📊 Dashboard UI

### Components

**Sidebar** (Elite #1a0a2e)
- Tab navigation: Dashboard, Matches, Players, Transfers, Statistics
- Momentum meter (0–100 PMU)

**TopBar**
- Scenario selector (Baseline, Comeback, Dominant, etc.)
- Match state badge (Leading / Tied / Losing)

**Dashboard**
- Hero banner with score & match status
- 4 stat cards: Team A PMU | Team B PMU | Goal Probability | xG
- Scenario panels: Formation picker, tactic picker, simulation button
- Match Analysis section with lineups and pressure heatmaps

**QuickInsights** (Right panel)
- Top Performers — sorted by PMU
- Recent Results — form guide with W/W/D/W/L
- Live momentum sparkline chart (Recharts)

---

## ⚙️ Simulation Engine

### `backend/momentum_sim/simulation/engine.py` (1600+ lines)

**All-in-one module** with complete PMU physics:

- **PlayerState** — Mutable player runtime state with PMU components
- **EventProcessor** — Contextualised event impact with zone & minute modifiers
- **FatigueModel** — Accumulation from speed/distance/sprints, recovery in stoppages
- **DecayModel** — Momentum decay with exponential shock for goal_conceded
- **PressureEngine** — Distance decay & directional cone pressure propagation
- **CrowdEngine** — Home/away influence via noise, HR stress, experience
- **FormationEngine** — Formation coherence metric (spatial + lookup blend)
- **AgentDecision** — Stochastic player actions (pass, shot, tackle, etc.)
- **MatchSimulator** — Single-match orchestrator (0–90 minutes)
- **MonteCarloEngine** — N-iteration aggregation with statistical outputs

### Constants

- **22 Real Players** — M. Salah, K. De Bruyne, E. Haaland, V. van Dijk, etc.
- **20 Event Types** — pass, goal, tackle, shot, etc. with impact values
- **6+ Formations** — 4-3-3 (coherence 0.87), 4-4-2, 3-5-2, etc.
- **4 Tactics** — aggressive, balanced, defensive, possession
- **Physics Params** — base energy, decay rates, pressure radius, crowd alpha

---

## 📁 Project Structure

```
simulation/
├── src/                          # React Frontend (Vite)
│   ├── App.jsx                   # Root app with state management
│   ├── components/               # Dashboard, Sidebar, TopBar, QuickInsights
│   └── index.css                 # Design system (CSS variables)
├── backend/                      # Python Flask API
│   ├── app.py                    # Flask REST server (11 endpoints)
│   ├── requirements.txt          # Python dependencies
│   └── momentum_sim/
│       └── simulation/
│           └── engine.py         # ⭐ Self-contained PMU engine (1600 lines)
├── vite.config.js               # Vite + /api proxy to Flask
├── package.json                 # npm deps
├── index.html                   # Vite entry
└── README.md                    # This file
```

---

## 🧠 Simulation Output Example

**500 Monte Carlo iterations** on Team A (4-3-3) vs. Team B (4-4-2):

```json
{
  "avgPMU_A": 21.47,
  "avgPMU_B": 20.93,
  "goalProbability": 0.0196,
  "xg": 0.05,
  "outcomeDistribution": {
    "teamA_wins": 0.38,
    "teamB_wins": 0.36,
    "draws": 0.26
  },
  "playerMomentum": [
    {"name": "M. Salah", "pmu": 25.34, "position": "FWD", "consistency": 0.87},
    {"name": "K. De Bruyne", "pmu": 23.12, "position": "MID", "consistency": 0.89}
  ],
  "elapsed_seconds": 8.23
}
```

---

## 🎨 Design System

**CSS Variables**:
- Sidebar: `#1a0a2e` (elite dark navy)
- Accent: `#00e5a0` (teal)
- Team A: `#667eea` (indigo)
- Team B: `#f093fb` (magenta)

**Fonts**: Inter (Google Fonts) for all text

---

## 📚 Features Implemented

✅ Complete physics-based momentum model  
✅ Monte Carlo scenario simulation (up to 2000 iterations)  
✅ Real-time React dashboard with Recharts visualizations  
✅ 11 REST API endpoints (simulation, player stats, pressure, crowd, etc.)  
✅ Agent-based player decision making (stochastic heuristics)  
✅ Fatigue & recovery dynamics  
✅ Crowd influence modeling  
✅ Formation coherence & spatial analysis  
✅ Full CORS support for frontend-backend integration  
✅ Vite dev server with proxy to Flask API  

---

## 🔧 Development

### Running Tests

```bash
# Test simulation engine (3 iterations)
python -c "from backend.momentum_sim.simulation.engine import MonteCarloEngine; r=MonteCarloEngine({'iterations':3}).run(); print('avgPMU:', r['avgPMU'])"
```

### Debugging

- **Frontend**: F12 → Network tab to inspect `/api/simulate` calls
- **Backend**: Flask logs show request/response times & errors
- **Both servers**: `netstat -ano | findstr :5173 :5000` to verify ports

---

## 📖 Documentation

For detailed documentation, see:
- `backend/momentum_sim/simulation/engine.py` — inline docstrings for all classes
- `backend/app.py` — endpoint descriptions and request/response schemas

---

## 🤝 Contributing

Extend the system by:
1. Adding new event types to `EVENT_BASE_IMPACTS` in `engine.py`
2. Adding new formations to `FORMATION_COHERENCE`
3. Tuning physics constants (decay rates, pressure radius, crowd alpha)
4. Creating new API endpoints in `backend/app.py`

All changes are **hot-reloaded** in debug mode.

---

**Built with React, Vite, Flask, NumPy, and physics-based momentum modeling.**
- **Scenario Controls**: Formation & tactic selection
- **Quick Insights Panel**: Top performers, recent results, form guide

### Simulation Engine

Real-time PMU calculation:
- Baseline energy (position-dependent)
- Event impact computation with context modifiers
- Crowd influence modeling
- Fatigue accumulation and recovery
- Pressure propagation (distance decay, cone factors)
- Monte Carlo outcome distributions (1000 iterations)

### Visualization
- Momentum bar charts with team pressure streams
- Player PMU rankings with visual bars
- Probability distributions (goal likelihood, momentum evolution)
- Formation coherence metrics
- Tactical zone analysis

## Technology Stack

- **React 19.2.4** - UI framework
- **Vite 7.3.1** - Build tool
- **Recharts 3.7.0** - Charts and visualizations
- **Lucide React 0.574.0** - Icons
- **CSS3** - Custom styling with design system variables

## Architecture

```
src/
├── components/
│   ├── Sidebar.jsx          # Navigation sidebar
│   ├── TopBar.jsx           # Scenario & settings bar
│   ├── Dashboard.jsx        # Main content area
│   └── QuickInsights.jsx    # Right panel
├── services/
│   └── SimulationEngine.js  # Core PMU simulation logic
├── App.jsx                  # Main app component
├── index.css                # Design system & styles
└── main.jsx                 # React entry point
```

## Design System

**Color Palette**:
- Sidebar: `#1a0a2e` (dark purple)
- Accent: `#00e5a0` (cyan green)
- Cards: `#ffffff` (white)
- Text Primary: `#1a202c` (dark gray)
- Text Secondary: `#a0aec0` (light gray)

**Typography**:
- Font: Inter (Google Fonts)
- Weight: 300-800
- Sizes: 10px-28px by component

**Spacing**:
- Base unit: 4px
- Common gaps: 8px, 12px, 16px, 20px, 24px

## Simulation Algorithm

### PMU Computation

```javascript
PMU = BaseEnergy + EventImpact + CrowdImpact - Fatigue
```

**Event Impact Table**:
| Event | Base PMU |
|-------|----------|
| Pass | +2 |
| Tackle | +5 |
| Interception | +3 |
| Shot | +4 |
| Goal | +15 |

### Context Modifiers
- **Position Factor**: DEF ×1.0, MID ×1.0, FWD ×1.3
- **Game State**: Losing ×1.2, Tied ×1.0, Leading ×0.9
- **Zone**: Attacking third ×1.5, Middle ×1.0, Defensive ×0.8
- **Time**: Minute 5 ×0.7, Minute 45 ×1.0, Minute 90 ×1.2

### Pressure Propagation

```javascript
PressureImpact = PMU × FormationCoherence × exp(-Distance/6) × ConeFactor
```

### Momentum Aggregation

```javascript
TeamMomentum = Σ(PMU_Possession) + Σ(PMU_OffBall)
```

## State Management

React hooks manage:
- `scenario`: Currently selected scenario
- `simRunning`: Active simulation status
- `simResults`: Latest simulation output
- `selectedFormation`: Current formation (4-3-3, etc.)
- `selectedTactic`: Current tactic (Aggressive, Balanced, etc.)

## Performance Optimization

- Memoized simulation engine (runs in ~2 seconds for 1000 iterations)
- CSS-in-JS variables for responsive design
- Debounced simulation triggers
- Lazy-loaded chart components

## Deployment

```bash
npm run build
npm run preview
```

Built application in `dist/` directory ready for hosting.

## Browser Support

- Chrome/Brave (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- Real-time WebSocket integration with backend
- 3D pitch visualization (Three.js)
- Player heat map overlays
- Historical match comparison
- Advanced filtering and search
- Export simulation results (PDF/CSV)
- Dark mode toggle

---

**Built with ⚽ and physics-based momentum modeling**
