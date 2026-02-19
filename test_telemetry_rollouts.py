"""test_telemetry_rollouts.py
Pytest-style integration tests for telemetry collection and Monte Carlo rollouts.
Run with `pytest -m integration` (skipped by default).
"""

import time

import pytest
import requests

BASE_URL = "http://localhost:5000/api"


@pytest.fixture(scope="module")
def session_id():
    """Create a test session by posting a small batch of telemetry events.
    Returns session_id for use by other integration tests.
    """
    sid = f"test_session_{int(time.time() * 1000)}"
    events = [
        {
            "type": "player_state",
            "playerId": "A1",
            "timestamp": int(time.time() * 1000),
            "position": {"x": 50.0, "y": 34.0},
            "velocity": {"vx": 2.1, "vy": -0.5},
            "pmu": 45.2,
            "fatigue": 32.1,
        },
        {
            "type": "action",
            "actionType": "pass",
            "fromPlayerId": "A1",
            "toPlayerId": "A2",
            "success": True,
            "timestamp": int(time.time() * 1000),
        },
        {
            "type": "ball_state",
            "timestamp": int(time.time() * 1000),
            "position": {"x": 52.5, "y": 34.0},
            "velocity": {"vx": 0, "vy": 0},
            "possession": "A",
            "zone": "middle_third",
        },
        {
            "type": "match_context",
            "timestamp": int(time.time() * 1000),
            "formation": "4-3-3",
            "tactic": "balanced",
            "score": {"teamA": 0, "teamB": 0},
            "possession": {"teamA": 50, "teamB": 50},
            "crowdNoise": 80.0,
            "minute": 45,
        },
    ]

    payload = {"sessionId": sid, "events": events}

    r = requests.post(f"{BASE_URL}/events", json=payload, timeout=5)
    r.raise_for_status()
    data = r.json()

    assert data.get("ok") is True
    assert data["data"].get("eventsReceived", 0) >= 1

    return sid


@pytest.mark.integration
def test_recent_events(session_id):
    params = {"limit": 50, "sessionId": session_id}
    r = requests.get(f"{BASE_URL}/events/recent", params=params, timeout=5)
    r.raise_for_status()
    data = r.json()
    assert data.get("ok") is True
    assert isinstance(data["data"].get("events", []), list)


@pytest.mark.integration
def test_rollouts(session_id):
    payload = {
        "sessionId": session_id,
        "formation": "4-3-3",
        "tactic": "balanced",
        "crowdNoise": 80.0,
        "iterations": 10,
        "forecastMinutes": 5,
    }

    r = requests.post(f"{BASE_URL}/rollouts", json=payload, timeout=30)
    r.raise_for_status()
    data = r.json()
    assert data.get("ok") is True
    assert "simulationResults" in data["data"]


@pytest.mark.integration
def test_health():
    r = requests.get(f"{BASE_URL}/health", timeout=3)
    r.raise_for_status()
    data = r.json()
    assert data.get("status") in ("ok",) or data.get("ok") is True
