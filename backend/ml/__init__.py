"""ML-powered tactical recommendations module"""

from .policy_trainer import (
    TacticalPolicyNetwork,
    PolicyTrainer,
    TrainingState,
    TrainingTransition,
    create_trainer,
    train_policy_async,
)

__all__ = [
    'TacticalPolicyNetwork',
    'PolicyTrainer',
    'TrainingState',
    'TrainingTransition',
    'create_trainer',
    'train_policy_async',
]
