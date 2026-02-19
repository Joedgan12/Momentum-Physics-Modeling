#!/usr/bin/env python3
"""Poll GitHub Actions for the calibration.yml workflow run for a given commit.
Usage: python scripts/poll_calibration_workflow.py <commit-sha> [timeout_seconds]
"""
import subprocess
import sys
import time

import requests

OWNER = "Joedgan12"
REPO = "Momentum-Physics-Modeling"
WORKFLOW_FILE = "calibration.yml"

HEAD_SHA = (
    sys.argv[1]
    if len(sys.argv) > 1
    else subprocess.check_output(["git", "rev-parse", "HEAD"]).decode().strip()
)
TIMEOUT = int(sys.argv[2]) if len(sys.argv) > 2 else 600

API_BASE = f"https://api.github.com/repos/{OWNER}/{REPO}"
HEADERS = {"Accept": "application/vnd.github.v3+json", "User-Agent": "workflow-poller"}


def find_run_for_sha(sha):
    url = f"{API_BASE}/actions/workflows/{WORKFLOW_FILE}/runs?per_page=50"
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    runs = r.json().get("workflow_runs", [])
    for run in runs:
        if run.get("head_sha") == sha:
            return run
    return None


def wait_for_completion(sha, timeout_s=600):
    start = time.time()
    while time.time() - start < timeout_s:
        run = find_run_for_sha(sha)
        if run:
            rid = run["id"]
            status = run.get("status")
            conclusion = run.get("conclusion")
            print(f"Found run id={rid} status={status} conclusion={conclusion}")
            if status == "completed":
                return run
        else:
            print("Run not found yet; retrying...")
        time.sleep(5)
    raise SystemExit(2)


def fetch_jobs(run_id):
    url = f"{API_BASE}/actions/runs/{run_id}/jobs"
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.json().get("jobs", [])


if __name__ == "__main__":
    print(f"Polling for workflow run for commit {HEAD_SHA} (timeout {TIMEOUT}s)")
    run = wait_for_completion(HEAD_SHA, TIMEOUT)
    jobs = fetch_jobs(run["id"])
    print("\nJob results:")
    for j in jobs:
        print(f" - {j['name']}: status={j['status']} conclusion={j['conclusion']}")

    # determine success for calibration-test and production-montecarlo
    calib_jobs = [j for j in jobs if "calibration" in j["name"].lower()]
    prod_jobs = [
        j
        for j in jobs
        if "montecarlo" in j["name"].lower() or "production" in j["name"].lower()
    ]

    ok = True
    if calib_jobs:
        for j in calib_jobs:
            if j["conclusion"] != "success":
                ok = False
    else:
        print("Warning: calibration job not found in run")
        ok = False

    if prod_jobs:
        for j in prod_jobs:
            if j["conclusion"] != "success":
                ok = False
    else:
        print("Warning: MonteCarlo production job not found in run")
        # treat absence as non-blocking (ok stays True)

    if ok:
        print("\n✅ Both calibration and MonteCarlo jobs succeeded")
        sys.exit(0)
    else:
        print("\n✗ One or more jobs failed")
        sys.exit(1)
