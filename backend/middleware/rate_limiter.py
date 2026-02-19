"""
backend/middleware/rate_limiter.py
Rate limiting to prevent API abuse
"""

from flask import jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


class RateLimiterConfig:
    """Rate limiting configuration"""

    # Default limits (can be overridden per endpoint)
    DEFAULT_LIMIT = "100 per minute"  # 100 requests per minute per IP
    DAILY_LIMIT = "1000 per day"  # 1000 requests per day per IP

    # Endpoint-specific limits (high-cost operations)
    SIMULATION_LIMIT = "50 per minute"  # Simulations are expensive
    SWEEP_LIMIT = "20 per minute"  # Sweep is very expensive (16 sims)
    TRAINING_LIMIT = "10 per day"  # ML training is extremely expensive

    # Bypass for local development (can be disabled in production)
    ENABLED = True

    # Storage backend: memory (dev) or redis (prod)
    STORAGE_URI = "memory://"  # Use "redis://localhost:6379" for production


def setup_rate_limiter(app, storage_uri=None):
    """
    Setup Flask-Limiter for rate limiting.

    Args:
        app: Flask application
        storage_uri: Redis URI or None for in-memory (dev only)

    Returns:
        Limiter instance
    """

    if storage_uri is None:
        storage_uri = RateLimiterConfig.STORAGE_URI

    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=[RateLimiterConfig.DEFAULT_LIMIT],
        storage_uri=storage_uri,
        strategy="fixed-window",  # Simple fixed-window strategy
    )

    # Custom error handler for rate limiting
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return (
            jsonify(
                {
                    "ok": False,
                    "error": "Rate limit exceeded",
                    "message": "Too many requests. Please wait before making another request.",
                    "retry_after": e.description,
                }
            ),
            429,
        )

    return limiter


def get_rate_limit_decorator(limiter, limit_string, key_func=None):
    """
    Get a rate limit decorator for an endpoint.

    Args:
        limiter: Limiter instance
        limit_string: Rate limit string (e.g., "50 per minute")
        key_func: Custom key function (defaults to IP address)

    Returns:
        Decorator function
    """
    return limiter.limit(limit_string, key_func=key_func or get_remote_address)
