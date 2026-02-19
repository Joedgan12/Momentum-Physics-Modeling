"""Test calibration module"""
from backend.momentum_sim.analysis.calibration import CalibrationValidator, create_simple_xg_predictor
import json

# Test import
print('✓ CalibrationValidator imported')
print('✓ create_simple_xg_predictor imported')

# Load synthetic data
with open('backend/data/synthetic_matches.json', 'r') as f:
    matches = json.load(f)

print(f'✓ Loaded {len(matches)} synthetic matches')

# Test validator
validator = CalibrationValidator()
print('✓ CalibrationValidator instantiated')

# Test predictor
predictor = create_simple_xg_predictor()
test_match = matches[0]
predicted_xg = predictor(test_match)
print(f'✓ Predictor works: predicted_xg={predicted_xg:.3f}')
print(f'  Team A: {test_match["team_a"]}')
print(f'  Team B: {test_match["team_b"]}')

# Test validation
print('\nRunning quick validation on 10 matches...')
result = validator.cross_match_validation(matches, predictor, num_games=10)
print(f'✓ Validation complete')
print(f'  R²: {result["metrics"]["r_squared"]:.4f}')
print(f'  MAPE: {result["metrics"]["mape"]:.4f}')
print(f'  Pass: {result["pass"]}')

# Show best/worst predictions
print('\nBest predictions:')
for pred in result["best_predictions"][:2]:
    print(f'  Match {pred["match_id"]}: error={pred["error"]:.3f}')

print('\nWorst predictions:')
for pred in result["worst_predictions"][-2:]:
    print(f'  Match {pred["match_id"]}: error={pred["error"]:.3f}')
