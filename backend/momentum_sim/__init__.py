"""Elite Momentum Analytics — Physics-based football momentum simulation."""

__version__ = "1.0.0"

# Primary entry point: the self-contained simulation engine
from .simulation.engine import (
    MonteCarloEngine,
    MatchSimulator,
    PlayerState,
    MatchState,
    EventProcessor,
    FatigueModel,
    DecayModel,
    PressureEngine,
    CrowdEngine,
    FormationEngine,
    AgentDecision,
    DEFAULT_SQUAD,
)

__all__ = [
    "MonteCarloEngine",
    "MatchSimulator",
    "PlayerState",
    "MatchState",
    "EventProcessor",
    "FatigueModel",
    "DecayModel",
    "PressureEngine",
    "CrowdEngine",
    "FormationEngine",
    "AgentDecision",
    "DEFAULT_SQUAD",
]
