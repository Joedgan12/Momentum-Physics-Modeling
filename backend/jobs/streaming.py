"""
backend/jobs/streaming.py
Background job streaming and progress tracking
"""

import threading
import time
import uuid
from dataclasses import asdict, dataclass
from typing import Callable, Dict, List, Optional


@dataclass
class SweepProgress:
    """Track progress of a sweep operation."""

    job_id: str
    combo_index: int
    total_combos: int
    current_combo: str
    current_formation: str
    current_tactic: str
    metrics: Dict
    rank: int
    progress_percent: float
    elapsed_seconds: float
    estimated_remaining_seconds: float

    def to_dict(self) -> Dict:
        return asdict(self)


class StreamingJobManager:
    """Manage background jobs and stream progress to clients."""

    def __init__(self):
        self.active_jobs: Dict[str, Dict] = {}
        self.completed_jobs: Dict[str, Dict] = {}
        self.lock = threading.Lock()

    def create_job(self, job_type: str, params: Dict) -> str:
        """Create a new streaming job."""
        job_id = str(uuid.uuid4())[:8]

        with self.lock:
            self.active_jobs[job_id] = {
                "id": job_id,
                "type": job_type,
                "params": params,
                "created_at": time.time(),
                "progress": [],
                "status": "running",
            }

        return job_id

    def update_progress(self, job_id: str, progress: SweepProgress):
        """Update progress for a job."""
        if job_id not in self.active_jobs:
            return False

        with self.lock:
            self.active_jobs[job_id]["progress"].append(progress.to_dict())
            self.active_jobs[job_id]["last_update"] = time.time()

        return True

    def complete_job(self, job_id: str, result: Dict):
        """Mark job as complete."""
        if job_id not in self.active_jobs:
            return False

        with self.lock:
            job = self.active_jobs.pop(job_id)
            job["status"] = "completed"
            job["result"] = result
            job["completed_at"] = time.time()
            self.completed_jobs[job_id] = job

        return True

    def get_job_status(self, job_id: str) -> Optional[Dict]:
        """Get current status of a job."""
        with self.lock:
            if job_id in self.active_jobs:
                return {
                    "status": "running",
                    "data": self.active_jobs[job_id],
                }
            elif job_id in self.completed_jobs:
                return {
                    "status": "completed",
                    "data": self.completed_jobs[job_id],
                }

        return None

    def get_latest_progress(self, job_id: str) -> Optional[Dict]:
        """Get latest progress update for a job."""
        with self.lock:
            if job_id in self.active_jobs:
                progress_list = self.active_jobs[job_id]["progress"]
                if progress_list:
                    return progress_list[-1]

        return None

    def cancel_job(self, job_id: str) -> bool:
        """Mark a job for cancellation."""
        if job_id not in self.active_jobs:
            return False

        with self.lock:
            self.active_jobs[job_id]["status"] = "cancelled"

        return True


def run_streaming_sweep(
    socketio,
    job_id: str,
    formations: List[str],
    tactics: List[str],
    formation_b: str,
    tactic_b: str,
    iterations: int,
    start_minute: int,
    end_minute: int,
    crowd_noise: float,
    rank_by: str,
    simulator_fn: Callable,
    analyzer_fn: Callable,
):
    """
    Run sweep simulation with real-time progress streaming.

    Args:
        socketio: Flask-SocketIO instance
        job_id: Unique job identifier
        formations: List of formations to test
        tactics: List of tactics to test
        formation_b, tactic_b: Opponent setup
        iterations: MC iterations per combo
        simulator_fn: Function to run simulation
        analyzer_fn: Function to compute analytics
    """

    try:
        t0 = time.time()
        results = {}
        baseline_result = None

        total_combos = len(formations) * len(tactics)
        combo_index = 0

        # Run each combination
        for formation in formations:
            for tactic in tactics:
                combo_index += 1
                combo_key = f"{formation}_{tactic}"

                # Check if job was cancelled
                # (In production, check job manager)

                config = {
                    "formation": formation,
                    "formation_b": formation_b,
                    "tactic": tactic,
                    "tactic_b": tactic_b,
                    "iterations": iterations,
                    "start_minute": start_minute,
                    "end_minute": end_minute,
                    "crowd_noise": crowd_noise,
                }

                # Run simulation
                result = simulator_fn(config)
                result = analyzer_fn(result, config)
                results[combo_key] = result

                # Track baseline
                if formation == "4-3-3" and tactic == "balanced":
                    baseline_result = result

                # Calculate metrics
                elapsed = time.time() - t0
                progress_percent = (combo_index / total_combos) * 100
                elapsed_per_combo = elapsed / combo_index
                remaining_combos = total_combos - combo_index
                estimated_remaining = elapsed_per_combo * remaining_combos

                # Extract key metrics
                xg = result.get("xg", 0.03)
                goal_prob = result.get("goalProbability", 0.01)
                momentum = result.get("avgPMU_A", 20.0)

                # Emit progress to client
                progress_data = {
                    "job_id": job_id,
                    "combo_index": combo_index,
                    "total_combos": total_combos,
                    "current_combo": combo_key,
                    "current_formation": formation,
                    "current_tactic": tactic,
                    "metrics": {
                        "xg": round(xg, 3),
                        "goal_probability": round(goal_prob, 4),
                        "momentum": round(momentum, 2),
                    },
                    "progress_percent": round(progress_percent, 1),
                    "elapsed_seconds": round(elapsed, 2),
                    "estimated_remaining_seconds": round(estimated_remaining, 2),
                    "timestamp": time.time(),
                }

                # Send to all connected clients
                socketio.emit("sweep_progress", progress_data, broadcast=True)

                # Small delay to allow UI updates
                time.sleep(0.01)

        # Rank final results
        ranked = []
        baseline_xg = baseline_result.get("xg", 0.03) if baseline_result else 0.03
        baseline_goal_prob = (
            baseline_result.get("goalProbability", 0.01) if baseline_result else 0.01
        )
        baseline_momentum = (
            baseline_result.get("avgPMU_A", 20.0) if baseline_result else 20.0
        )

        risk_level_order = {"LOW": 0, "MODERATE": 1, "HIGH": 2, "CRITICAL": 3}
        baseline_risk = (
            baseline_result.get("risk_assessment", {}).get(
                "overall_risk_level", "MODERATE"
            )
            if baseline_result
            else "MODERATE"
        )
        baseline_risk_score = risk_level_order.get(baseline_risk, 1)

        for combo_key, result in results.items():
            formation, tactic = combo_key.split("_")

            xg_val = result.get("xg", 0.03)
            goal_prob = result.get("goalProbability", 0.01)
            momentum = result.get("avgPMU_A", 20.0)
            risk_level = result.get("risk_assessment", {}).get(
                "overall_risk_level", "MODERATE"
            )
            risk_score = risk_level_order.get(risk_level, 1)

            xg_delta = xg_val - baseline_xg
            goal_prob_delta = goal_prob - baseline_goal_prob
            momentum_delta = momentum - baseline_momentum
            risk_delta = risk_score - baseline_risk_score

            scoring = {
                "xg": xg_delta,
                "goal_prob": goal_prob_delta,
                "momentum": momentum_delta,
                "risk": -risk_delta,
            }

            score = scoring.get(rank_by, xg_delta)

            ranked.append(
                {
                    "rank": 0,
                    "formation": formation,
                    "tactic": tactic,
                    "combo": combo_key,
                    "score": round(score, 4),
                    "metrics": {
                        "xg": round(xg_val, 3),
                        "xg_delta": round(xg_delta, 3),
                        "goal_probability": round(goal_prob, 4),
                        "goal_prob_delta": round(goal_prob_delta, 4),
                        "momentum_pmu": round(momentum, 2),
                        "momentum_delta": round(momentum_delta, 2),
                    },
                }
            )

        ranked.sort(key=lambda x: x["score"], reverse=True)
        for idx, item in enumerate(ranked):
            item["rank"] = idx + 1

        # Final result
        final_result = {
            "ranked_scenarios": ranked,
            "top_3_recommendations": ranked[:3],
            "concerning_scenarios": ranked[-3:],
            "total_combinations": total_combos,
            "elapsed_seconds": round(time.time() - t0, 2),
        }

        # Emit completion
        socketio.emit(
            "sweep_complete",
            {
                "job_id": job_id,
                "result": final_result,
                "timestamp": time.time(),
            },
            broadcast=True,
        )

    except Exception as e:
        print(f"Error in streaming sweep: {e}")
        socketio.emit(
            "sweep_error",
            {
                "job_id": job_id,
                "error": str(e),
                "timestamp": time.time(),
            },
            broadcast=True,
        )
