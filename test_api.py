#!/usr/bin/env python3
"""
Quick test of the simulation API
Run: python test_api.py
"""

import requests
import time
import json

BASE_URL = "http://127.0.0.1:5000"

def test_health():
    print("Testing /api/health...")
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200
    data = r.json()['data']
    print(f"  ✓ Status: {data['status']}, NumPy: {data['numpy']}")

def test_players():
    print("\nTesting /api/players...")
    r = requests.get(f"{BASE_URL}/api/players?team=A")
    assert r.status_code == 200
    data = r.json()['data']
    print(f"  ✓ Found {data['count']} Team A players")
    if data['players']:
        p = data['players'][0]
        print(f"    Sample: {p['name']} ({p['position']}) - Base PMU: {p['initial_pmu']}")

def test_formations():
    print("\nTesting /api/formations...")
    r = requests.get(f"{BASE_URL}/api/formations")
    assert r.status_code == 200
    data = r.json()['data']
    print(f"  ✓ Found {len(data['formations'])} formations:")
    for f in data['formations'][:3]:
        print(f"    {f['name']}: coherence {f['coherence']}")

def test_simulation():
    print("\nTesting /api/simulate (50 iterations)...")
    start = time.time()
    payload = {
        "formation": "4-3-3",
        "formation_b": "4-4-2",
        "tactic": "balanced",
        "tactic_b": "balanced",
        "iterations": 50,
        "scenario": "Baseline",
    }
    r = requests.post(f"{BASE_URL}/api/simulate", json=payload)
    elapsed = time.time() - start
    
    assert r.status_code == 200
    data = r.json()['data']
    
    print(f"  ✓ Completed in {elapsed:.2f}s")
    print(f"    Team A PMU: {data['avgPMU_A']}")
    print(f"    Team B PMU: {data['avgPMU_B']}")
    print(f"    Goal Probability: {data['goalProbability']}")
    print(f"    xG: {data['xg']}")
    print(f"    Team A Win %: {data['outcomeDistribution']['teamA_wins']:.1%}")
    print(f"    Team B Win %: {data['outcomeDistribution']['teamB_wins']:.1%}")
    print(f"    Draws %: {data['outcomeDistribution']['draws']:.1%}")
    if data['playerMomentum']:
        print(f"    Top Player: {data['playerMomentum'][0]['name']} ({data['playerMomentum'][0]['pmu']} PMU)")

if __name__ == "__main__":
    try:
        print("="*60)
        print("Football Momentum Simulation API Test")
        print("="*60)
        test_health()
        test_players()
        test_formations()
        test_simulation()
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED")
        print("="*60)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
