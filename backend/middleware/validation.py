"""
backend/middleware/validation.py
Input validation and error handling for API endpoints
"""

from functools import wraps
from flask import request, jsonify
import re


class ValidationError(Exception):
    """Custom validation exception"""
    pass


PRESET_FORMATIONS = ["4-3-3", "4-4-2", "3-5-2", "5-3-2", "4-2-4", "3-4-3", "4-2-3-1", "4-1-4-1", "3-4-3", "4-3-2-1"]


def validate_formation(formation_name: str) -> str:
    """
    Validate a formation string.

    Accepts both preset formations and any custom N-N-...-N pattern where:
      - Each part is 1–6 players
      - Total outfield players = 10
      - 2–5 lines (not counting GK)

    Examples: '4-3-3', '4-2-3-1', '3-4-2-1', '5-2-3'
    """
    if not isinstance(formation_name, str):
        raise ValidationError("Formation must be a string")

    formation_name = formation_name.strip()

    if not formation_name:
        raise ValidationError("Formation cannot be empty")

    # Check pattern: digits separated by hyphens
    if not re.match(r'^\d+(-\d+)+$', formation_name):
        raise ValidationError(
            "Formation must be digits separated by hyphens (e.g. 4-3-3, 4-2-3-1). "
            f"Presets: {', '.join(PRESET_FORMATIONS[:6])}"
        )

    parts = [int(x) for x in formation_name.split('-')]

    # Each line must have 1–6 players
    for p in parts:
        if p < 1 or p > 6:
            raise ValidationError("Each line must have between 1 and 6 players")

    # Must sum to 10 outfield players (GK is separate)
    total = sum(parts)
    if total != 10:
        raise ValidationError(
            f"Formation must have exactly 10 outfield players (got {total}). "
            "Adjust line counts to sum to 10."
        )

    # 2–5 lines
    if len(parts) < 2:
        raise ValidationError("Formation must have at least 2 lines")
    if len(parts) > 5:
        raise ValidationError("Formation can have at most 5 lines")

    return formation_name


def validate_tactic(tactic_name: str) -> str:
    """Validate tactic string."""
    valid_tactics = ["aggressive", "balanced", "defensive", "possession"]
    if tactic_name.lower() not in valid_tactics:
        raise ValidationError(f"Invalid tactic. Must be one of: {', '.join(valid_tactics)}")
    return tactic_name.lower()


def validate_iterations(iterations: int) -> int:
    """Validate iteration count."""
    try:
        iters = int(iterations)
    except (ValueError, TypeError):
        raise ValidationError("Iterations must be an integer")
    
    if iters < 10:
        raise ValidationError("Iterations must be at least 10")
    if iters > 2000:
        raise ValidationError("Iterations max is 2000")
    
    return iters


def validate_crowd_noise(noise: float) -> float:
    """Validate crowd noise dB level."""
    try:
        noise_val = float(noise)
    except (ValueError, TypeError):
        raise ValidationError("Crowd noise must be a float")
    
    if noise_val < 0 or noise_val > 120:
        raise ValidationError("Crowd noise must be between 0-120 dB")
    
    return noise_val


def validate_minute(minute: int) -> int:
    """Validate match minute."""
    try:
        min_val = int(minute)
    except (ValueError, TypeError):
        raise ValidationError("Minute must be an integer")
    
    if min_val < 0 or min_val > 90:
        raise ValidationError("Minute must be between 0-90")
    
    return min_val


def validate_player_id(player_id: str) -> str:
    """Validate player ID format."""
    if not re.match(r'^[AB]\d+$', player_id):
        raise ValidationError("Player ID must be format A1-A11 or B1-B11")
    return player_id


def validate_scenario_name(name: str) -> str:
    """Validate scenario name."""
    if not isinstance(name, str):
        raise ValidationError("Scenario name must be a string")
    if len(name) < 3:
        raise ValidationError("Scenario name must be at least 3 characters")
    if len(name) > 200:
        raise ValidationError("Scenario name must be at most 200 characters")
    return name.strip()


def validate_tags(tags: list) -> list:
    """Validate tags list."""
    if not isinstance(tags, list):
        raise ValidationError("Tags must be a list")
    
    valid_tags = []
    for tag in tags:
        if not isinstance(tag, str):
            raise ValidationError("Each tag must be a string")
        sanitized = tag.strip().lower()
        if len(sanitized) > 50:
            raise ValidationError("Tag must be at most 50 characters")
        if sanitized:
            valid_tags.append(sanitized)
    
    if len(valid_tags) > 20:
        raise ValidationError("Max 20 tags per scenario")
    
    return list(set(valid_tags))  # Remove duplicates


def validate_scenario_ids(scenario_ids: list) -> list:
    """Validate scenario IDs for comparison."""
    if not isinstance(scenario_ids, list):
        raise ValidationError("scenario_ids must be a list")
    if len(scenario_ids) < 2:
        raise ValidationError("Comparison requires at least 2 scenarios")
    if len(scenario_ids) > 10:
        raise ValidationError("Max 10 scenarios per comparison")
    
    for sid in scenario_ids:
        if not isinstance(sid, str):
            raise ValidationError("Each scenario_id must be a string")
        if not re.match(r'^[a-f0-9]{8}$', sid):
            raise ValidationError("Invalid scenario ID format")
    
    return scenario_ids


def validate_json_request(required_fields=None):
    """Decorator to validate JSON request body."""
    if required_fields is None:
        required_fields = []
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                data = request.get_json(silent=True)
                if data is None:
                    return jsonify({"ok": False, "error": "Request body must be JSON"}), 400
                
                for field in required_fields:
                    if field not in data:
                        return jsonify({"ok": False, "error": f"Missing required field: {field}"}), 400
                
                # Store validated data in request context
                request.validated_data = data
                return f(*args, **kwargs)
            
            except Exception as e:
                return jsonify({"ok": False, "error": str(e)}), 400
        
        return decorated_function
    return decorator


def sanitize_string(value: str, max_length: int = 500) -> str:
    """Sanitize string input."""
    if not isinstance(value, str):
        raise ValidationError("Value must be a string")
    
    value = value.strip()
    if len(value) > max_length:
        raise ValidationError(f"String exceeds max length of {max_length}")
    
    # Remove potentially dangerous characters
    value = re.sub(r'[<>\"\'%;()&+]', '', value)
    
    return value


def format_validation_error(error_dict: dict) -> dict:
    """Format validation errors for API response."""
    return {
        "ok": False,
        "error": "Validation failed",
        "details": error_dict
    }
