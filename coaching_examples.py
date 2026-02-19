#!/usr/bin/env python
"""
Coaching Knowledge Integration Examples
Demonstrates how the AI Coach learns from elite coaches
"""

import sys
import json
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

def example_1_load_all_coaches():
    """Example 1: Load all elite coaches and display summary"""
    print("\n" + "="*60)
    print("EXAMPLE 1: Load All Elite Coaches")
    print("="*60)
    
    from coaching.coaching_knowledge import get_all_coaches
    
    coaches = get_all_coaches()
    print(f"\n✓ Loaded {len(coaches)} elite coaches:\n")
    
    for i, coach in enumerate(coaches, 1):
        print(f"{i:2d}. {coach.name:25s} ({coach.nationality:10s}) | {coach.primary_formation} | {coach.tactical_style}")
    
    return coaches


def example_2_get_coach_profile():
    """Example 2: Get detailed profile of a specific coach"""
    print("\n" + "="*60)
    print("EXAMPLE 2: Get Detailed Coach Profile")
    print("="*60)
    
    from coaching.coaching_knowledge import get_coach_tactical_profile
    
    coach_name = "Pep Guardiola"
    profile = get_coach_tactical_profile(coach_name)
    
    print(f"\n🏆 {coach_name}")
    print(f"   Country: {profile.nationality}")
    print(f"   Primary Formation: {profile.primary_formation}")
    print(f"   Tactical Style: {profile.tactical_style}")
    print(f"\n   Tactical Attributes (0-1 scale):")
    print(f"   ├─ Possession Preference:  {profile.possession_preference:.2f} (high = possession-based)")
    print(f"   ├─ Pressing Intensity:     {profile.pressing_intensity:.2f} (high = aggressive pressing)")
    print(f"   ├─ Width of Play:          {profile.width_of_play:.2f}")
    print(f"   └─ Transition Speed:       {profile.transition_speed:.2f} (high = fast breaks)")
    
    print(f"\n   Training Methodology (0-1 scale):")
    print(f"   ├─ Aerobic Emphasis:       {profile.aerobic_emphasis:.2f}")
    print(f"   ├─ Technical Emphasis:     {profile.technical_emphasis:.2f}")
    print(f"   ├─ Tactical Emphasis:      {profile.tactical_emphasis:.2f}")
    print(f"   └─ Mental Emphasis:        {profile.mental_emphasis:.2f}")
    
    print(f"\n   Key Principles:")
    for principle in profile.key_principles:
        print(f"   • {principle}")
    
    print(f"\n   Major Achievements:")
    for achievement in profile.famous_achievements:
        print(f"   • {achievement}")


def example_3_coach_recommendations_for_state():
    """Example 3: Get coach recommendations for specific game states"""
    print("\n" + "="*60)
    print("EXAMPLE 3: Coach Recommendations for Game States")
    print("="*60)
    
    from coaching.coaching_knowledge import get_coach_recommendations_for_state
    
    # Scenario A: Losing (Need to attack)
    print("\n📊 SCENARIO A: Losing by 2 Goals (Need to Attack)")
    print("   ├─ Possession: 35%")
    print("   ├─ Team Fatigue: 50%")
    print("   ├─ Momentum: -2")
    print("   └─ Score Differential: -2")
    
    recs = get_coach_recommendations_for_state(
        possession=35, 
        fatigue=50, 
        momentum=-2, 
        score_differential=-2
    )
    
    print("\n   Top 5 Coaches (by alignment):")
    for rank, (coach_name, alignment_score) in enumerate(recs[:5], 1):
        print(f"   {rank}. {coach_name:25s} - Alignment: {alignment_score:.2f}")
    
    # Scenario B: Protecting lead (Need to control)
    print("\n📊 SCENARIO B: Protecting 1-Goal Lead (Need Control)")
    print("   ├─ Possession: 65%")
    print("   ├─ Team Fatigue: 70%")
    print("   ├─ Momentum: +2")
    print("   └─ Score Differential: +1")
    
    recs = get_coach_recommendations_for_state(
        possession=65, 
        fatigue=70, 
        momentum=2, 
        score_differential=1
    )
    
    print("\n   Top 5 Coaches (by alignment):")
    for rank, (coach_name, alignment_score) in enumerate(recs[:5], 1):
        print(f"   {rank}. {coach_name:25s} - Alignment: {alignment_score:.2f}")
    
    # Scenario C: Balanced game (Tactical flexibility)
    print("\n📊 SCENARIO C: Balanced Game (50% Possession)")
    print("   ├─ Possession: 50%")
    print("   ├─ Team Fatigue: 60%")
    print("   ├─ Momentum: 0")
    print("   └─ Score Differential: 0")
    
    recs = get_coach_recommendations_for_state(
        possession=50, 
        fatigue=60, 
        momentum=0, 
        score_differential=0
    )
    
    print("\n   Top 5 Coaches (by alignment):")
    for rank, (coach_name, alignment_score) in enumerate(recs[:5], 1):
        print(f"   {rank}. {coach_name:25s} - Alignment: {alignment_score:.2f}")


def example_4_filter_by_style():
    """Example 4: Find coaches by tactical style"""
    print("\n" + "="*60)
    print("EXAMPLE 4: Filter Coaches by Tactical Style")
    print("="*60)
    
    from coaching.coaching_knowledge import get_coaches_by_style
    
    styles = ["possession_control", "aggressive_pressing", "defensive_structure"]
    
    for style in styles:
        coaches = get_coaches_by_style(style)
        print(f"\n🎯 {style.upper().replace('_', ' ')}:")
        for coach in coaches:
            print(f"   • {coach.name:25s} | {coach.primary_formation}")


def example_5_formation_by_coach():
    """Example 5: Get primary formation used by coach"""
    print("\n" + "="*60)
    print("EXAMPLE 5: Formations Used by Each Coach")
    print("="*60)
    
    from coaching.coaching_knowledge import get_formation_by_coach, get_all_coaches
    
    coaches = get_all_coaches()
    
    formations = {}
    for coach in coaches:
        formation = get_formation_by_coach(coach.name)
        if formation not in formations:
            formations[formation] = []
        formations[formation].append(coach.name)
    
    print("\nFormations and their proponents:\n")
    for formation in sorted(formations.keys()):
        coaches_using = formations[formation]
        print(f"📋 {formation}")
        for coach in coaches_using:
            print(f"   • {coach}")


def example_6_training_emphasis():
    """Example 6: Get training methodology for a coach"""
    print("\n" + "="*60)
    print("EXAMPLE 6: Training Methodology by Coach")
    print("="*60)
    
    from coaching.coaching_knowledge import get_training_emphasis
    
    coaches_to_compare = ["Jürgen Klopp", "Pep Guardiola", "Carlo Ancelotti"]
    
    print("\nTraining Methodology Comparison (0-1 scale):\n")
    print(f"{'Coach':<25} {'Aerobic':<10} {'Technical':<12} {'Tactical':<10} {'Mental':<10}")
    print("-" * 67)
    
    for coach_name in coaches_to_compare:
        emphasis = get_training_emphasis(coach_name)
        print(f"{coach_name:<25} {emphasis['aerobic']:<10.2f} {emphasis['technical']:<12.2f} " 
              f"{emphasis['tactical']:<10.2f} {emphasis['mental']:<10.2f}")


def example_7_coaching_reward_calculation():
    """Example 7: Show how coaching rewards enhance training"""
    print("\n" + "="*60)
    print("EXAMPLE 7: Coaching Reward Calculation")
    print("="*60)
    
    from coaching.coaching_knowledge import get_coach_recommendations_for_state, get_coach_tactical_profile
    
    # Simulate training scenario
    possession = 50
    fatigue = 55
    momentum = 0.5
    score_diff = 0
    
    print(f"\nGame State:")
    print(f"  • Possession: {possession}%")
    print(f"  • Team Fatigue: {fatigue}%")
    print(f"  • Momentum: {momentum}")
    print(f"  • Score Differential: {score_diff}")
    
    # Get top coaches
    top_coaches = get_coach_recommendations_for_state(possession, fatigue, momentum, score_diff)[:3]
    
    print(f"\nTop 3 Aligned Coaches:")
    for i, (name, score) in enumerate(top_coaches, 1):
        profile = get_coach_tactical_profile(name)
        print(f"  {i}. {name:25s} (Alignment: {score:.2f})")
        print(f"     • Possession Preference: {profile.possession_preference:.2f}")
        print(f"     • Pressing Intensity: {profile.pressing_intensity:.2f}")
    
    # Simulate reward calculation
    print(f"\nReward Calculation for 'aggressive_press' tactic:")
    print(f"  Base reward (tactic quality):    0.35")
    print(f"  Fatigue penalty:                -0.05")
    print(f"  Coaching bonus (3 coaches):     +0.15 (0.05 per coach alignment)")
    print(f"  {'─' * 50}")
    print(f"  Final Q-target:                  0.45  ✓ REINFORCED")
    print(f"\n  → AI learns that 'aggressive_press' is good for this state")
    print(f"  → Because elite pressing coaches (Klopp, Rose, Enrique) align with it")


def main():
    """Run all examples"""
    print("\n" + "🏆" * 30)
    print("ELITE COACHES INTEGRATION - USAGE EXAMPLES")
    print("🏆" * 30)
    
    try:
        # Run examples
        example_1_load_all_coaches()
        example_2_get_coach_profile()
        example_3_coach_recommendations_for_state()
        example_4_filter_by_style()
        example_5_formation_by_coach()
        example_6_training_emphasis()
        example_7_coaching_reward_calculation()
        
        print("\n" + "="*60)
        print("✅ ALL EXAMPLES COMPLETED SUCCESSFULLY")
        print("="*60)
        print("\nKey Takeaways:")
        print("1. 19+ elite coaches available with full tactical profiles")
        print("2. Get coaches for any game state instantly")
        print("3. Coaching knowledge integrates into DQN training")
        print("4. Recommendations show which coaches inspired them")
        print("5. System learns from real-world elite tactics")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
