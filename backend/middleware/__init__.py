"""
backend/middleware/__init__.py
Middleware package for API validation, error handling, and rate limiting
"""

from .validation import (
    ValidationError,
    validate_formation,
    validate_tactic,
    validate_iterations,
    validate_crowd_noise,
    validate_minute,
    validate_player_id,
    validate_scenario_name,
    validate_tags,
    validate_scenario_ids,
    validate_json_request,
    sanitize_string,
    format_validation_error
)

from .error_handler import ErrorHandler

from .rate_limiter import (
    RateLimiterConfig,
    setup_rate_limiter,
    get_rate_limit_decorator
)

__all__ = [
    'ValidationError',
    'validate_formation',
    'validate_tactic',
    'validate_iterations',
    'validate_crowd_noise',
    'validate_minute',
    'validate_player_id',
    'validate_scenario_name',
    'validate_tags',
    'validate_scenario_ids',
    'validate_json_request',
    'sanitize_string',
    'format_validation_error',
    'ErrorHandler',
    'RateLimiterConfig',
    'setup_rate_limiter',
    'get_rate_limit_decorator'
]
