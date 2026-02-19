"""
test_telemetry_rollouts.py
Integration test for telemetry collection and Monte Carlo rollouts
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000/api"

def test_event_collection():
    """Test telemetry event collection endpoint."""
    print("\n=== Testing Event Collection Endpoint ===")
    
    session_id = f"test_session_{datetime.now().timestamp()}"
    
    events = [
        {
            "type": "player_state",
            "playerId": "A1",
            "timestamp": int(datetime.now().timestamp() * 1000),
            "position": {"x": 50.0, "y": 34.0},
            "velocity": {"vx": 2.1, "vy": -0.5},
            "pmu": 45.2,
            "fatigue": 32.1
        },
        {
            "type": "action",
            "actionType": "pass",
            "fromPlayerId": "A1",
            "toPlayerId": "A2",
            "success": True,
            "timestamp": int(datetime.now().timestamp() * 1000)
        },
        {
            "type": "ball_state",
            "timestamp": int(datetime.now().timestamp() * 1000),
            "position": {"x": 52.5, "y": 34.0},
            "velocity": {"vx": 0, "vy": 0},
            "possession": "A",
            "zone": "middle_third"
        },
        {
            "type": "match_context",
            "timestamp": int(datetime.now().timestamp() * 1000),
            "formation": "4-3-3",
            "tactic": "balanced",
            "score": {"teamA": 0, "teamB": 0},
            "possession": {"teamA": 50, "teamB": 50},
            "crowdNoise": 80.0,
            "minute": 45
        }
    ]
    
    payload = {
        "sessionId": session_id,
        "events": events
    }
    
    try:
        response = requests.post(f"{BASE_URL}/events", json=payload)
        response.raise_for_status()
        
        result = response.json()
        print(f"✓ Event collection successful")
        print(f"  - Events received: {result['data']['eventsReceived']}")
        print(f"  - Session ID: {result['data']['sessionId']}")
        print(f"  - Log file: {result['data']['logFile']}")
        
        return session_id, events
    except Exception as e:
        print(f"✗ Event collection failed: {e}")
        return None, None

def test_recent_events(session_id):
    """Test retrieving recent events."""
    print("\n=== Testing Recent Events Retrieval ===")
    
    try:
        params = {
            "limit": 50,
            "sessionId": session_id
        }
        response = requests.get(f"{BASE_URL}/events/recent", params=params)
        response.raise_for_status()
        
        result = response.json()
        print(f"✓ Recent events retrieval successful")
        print(f"  - Events returned: {result['data']['eventsReturned']}")
        
        if result['data']['events']:
            first_event = result['data']['events'][0]['event']
            print(f"  - Sample event type: {first_event.get('type', 'unknown')}")
        
    except Exception as e:
        print(f"✗ Recent events retrieval failed: {e}")

def test_rollouts(session_id):
    """Test Monte Carlo rollouts endpoint."""
    print("\n=== Testing Monte Carlo Rollouts ===")
    
    payload = {
        "sessionId": session_id,
        "formation": "4-3-3",
        "tactic": "balanced",
        "crowdNoise": 80.0,
        "iterations": 100,  # Small number for testing
        "forecastMinutes": 10
    }
    
    try:
        response = requests.post(f"{BASE_URL}/rollouts", json=payload)
        response.raise_for_status()
        
        result = response.json()
        data = result['data']
        
        print(f"✓ Monte Carlo rollouts successful")
        print(f"  - Iterations: {data['iterations']}")
        print(f"  - Forecast minutes: {data['forecastMinutes']}")
        print(f"  - Reconstructed player states: {data['reconstructedPlayerStates']}")
        print(f"  - Confidence: {data['confidence']:.1%}")
        
        print(f"\n  Simulation Results:")
        sim_results = data['simulationResults']
        print(f"    - Team A avg PMU: {sim_results['avgPMU_A']:.2f}")
        print(f"    - Team B avg PMU: {sim_results['avgPMU_B']:.2f}")
        print(f"    - Goal probability: {sim_results['goalProbability']:.2%}")
        print(f"    - xG: {sim_results['xg']:.3f}")
        
        return data
    
    except Exception as e:
        print(f"✗ Monte Carlo rollouts failed: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_health():
    """Test that API is running."""
    print("\n=== Testing API Health ===")
    try:
        response = requests.get(f"{BASE_URL}/health")
        response.raise_for_status()
        result = response.json()
        if result.get('ok'):
            print(f"✓ API is healthy")
            return True
        else:
            print(f"✗ API health check failed: {result}")
            return False
    except Exception as e:
        print(f"✗ API connection failed: {e}")
        print(f"  Make sure the backend is running: python backend/app.py")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("  Telemetry & Rollouts Integration Test")
    print("=" * 60)
    
    # Check health
    if not test_health():
        exit(1)
    
    # Test event collection
    session_id, events = test_event_collection()
    if not session_id:
        print("\n✗ Test failed at event collection")
        exit(1)
    
    # Test retrieving events
    test_recent_events(session_id)
    
    # Test rollouts
    rollout_results = test_rollouts(session_id)
    
    print("\n" + "=" * 60)
    print("  Test Summary")
    print("=" * 60)
    
    if rollout_results:
        print("\n✓ All tests passed!")
        print("\nNext steps:")
        print("  1. Run: npm run dev")
        print("  2. Open http://localhost:5173")
        print("  3. Run a simulation")
        print("  4. View Coach Report to see rollout results")
    else:
        print("\n✗ Some tests failed")
        exit(1)
