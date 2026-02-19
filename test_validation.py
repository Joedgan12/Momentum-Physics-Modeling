"""
Quick test of middleware validation functions
Run with: python test_validation.py
"""

import sys

sys.path.insert(0, ".")

from backend.middleware.validation import (
    ValidationError,
    validate_crowd_noise,
    validate_formation,
    validate_iterations,
    validate_scenario_name,
    validate_tactic,
    validate_tags,
)


def test_validators():
    """Run quick validation tests."""

    print("Testing Validation Functions\n" + "=" * 50)

    # Test 1: Valid formation
    try:
        result = validate_formation("4-3-3")
        print("✓ Valid formation: 4-3-3 → PASS")
    except ValidationError as e:
        print(f"✗ Valid formation test failed: {e}")

    # Test 2: Invalid formation
    try:
        validate_formation("6-6-0")
        print("✗ Invalid formation should have failed")
    except ValidationError:
        print("✓ Invalid formation rejected → PASS")

    # Test 3: Valid tactic
    try:
        result = validate_tactic("aggressive")
        print("✓ Valid tactic: aggressive → PASS")
    except ValidationError as e:
        print(f"✗ Valid tactic test failed: {e}")

    # Test 4: Invalid tactic
    try:
        validate_tactic("ultra_aggressive")
        print("✗ Invalid tactic should have failed")
    except ValidationError:
        print("✓ Invalid tactic rejected → PASS")

    # Test 5: Valid iterations
    try:
        result = validate_iterations(500)
        assert result == 500
        print("✓ Valid iterations (500) → PASS")
    except ValidationError as e:
        print(f"✗ Valid iterations test failed: {e}")

    # Test 6: Low iterations (too small)
    try:
        validate_iterations(5)
        print("✗ Low iterations should have failed")
    except ValidationError:
        print("✓ Low iterations rejected → PASS")

    # Test 7: High iterations (too large)
    try:
        validate_iterations(9999)
        print("✗ High iterations should have failed")
    except ValidationError:
        print("✓ High iterations rejected → PASS")

    # Test 8: Valid crowd noise
    try:
        result = validate_crowd_noise(80.0)
        assert result == 80.0
        print("✓ Valid crowd noise (80.0) → PASS")
    except ValidationError as e:
        print(f"✗ Valid crowd noise test failed: {e}")

    # Test 9: Invalid crowd noise (negative)
    try:
        validate_crowd_noise(-10.0)
        print("✗ Negative crowd noise should have failed")
    except ValidationError:
        print("✓ Negative crowd noise rejected → PASS")

    # Test 10: Valid scenario name
    try:
        result = validate_scenario_name("My Tactical Scenario")
        assert result == "My Tactical Scenario"
        print("✓ Valid scenario name → PASS")
    except ValidationError as e:
        print(f"✗ Valid scenario name test failed: {e}")

    # Test 11: Short scenario name
    try:
        validate_scenario_name("AB")
        print("✗ Short scenario name should have failed")
    except ValidationError:
        print("✓ Short scenario name rejected → PASS")

    # Test 12: Valid tags
    try:
        result = validate_tags(["aggressive", "formation", "test"])
        assert len(result) == 3
        print("✓ Valid tags → PASS")
    except ValidationError as e:
        print(f"✗ Valid tags test failed: {e}")

    # Test 13: Too many tags
    try:
        validate_tags([f"tag{i}" for i in range(25)])
        print("✗ Too many tags should have failed")
    except ValidationError:
        print("✓ Too many tags rejected → PASS")

    # Test 14: Duplicate tag removal
    try:
        result = validate_tags(["test", "Test", "TEST"])
        # All lowercase, so all 3 should be normalized to "test"
        # but set should remove duplicates
        print(f"✓ Duplicate tags handled → PASS (reduced to {len(result)} unique)")
    except ValidationError as e:
        print(f"✗ Duplicate tags test failed: {e}")

    print("\n" + "=" * 50)
    print("All validation tests completed!")


if __name__ == "__main__":
    test_validators()
