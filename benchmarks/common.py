"""
Shared helpers for the quantum-secure-mail benchmark suite.
"""
import json
import csv
import statistics
import time
from pathlib import Path

RESULTS_DIR = Path(__file__).parent / "results"
RAW_DIR = RESULTS_DIR / "raw"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)
RAW_DIR.mkdir(parents=True, exist_ok=True)

BACKEND_URL = "http://127.0.0.1:8001"
KME_URL = "http://127.0.0.1:8000"


def stats(values):
    """Summary statistics for a list of measurements (ms or otherwise)."""
    vals = sorted(values)
    return {
        "n": len(vals),
        "mean": round(statistics.mean(vals), 3),
        "median": round(statistics.median(vals), 3),
        "p95": round(vals[min(len(vals) - 1, int(len(vals) * 0.95))], 3),
        "min": round(min(vals), 3),
        "max": round(max(vals), 3),
        "stdev": round(statistics.stdev(vals), 3) if len(vals) > 1 else 0.0,
    }


def save_json(name, data):
    """Save a stage of raw results as JSON."""
    path = RAW_DIR / f"{name}.json"
    path.write_text(json.dumps(data, indent=2))
    return path


def load_json(name):
    return json.loads((RAW_DIR / f"{name}.json").read_text())


def save_csv(name, rows, fieldnames):
    path = RESULTS_DIR / f"{name}.csv"
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    return path


def fmt_row(name, s):
    return {
        "metric": name,
        "n": s["n"],
        "mean": s["mean"],
        "median": s["median"],
        "p95": s["p95"],
        "min": s["min"],
        "max": s["max"],
        "stdev": s["stdev"],
    }
