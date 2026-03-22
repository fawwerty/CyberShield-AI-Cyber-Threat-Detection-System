"""
==============================================================
  Model Inference Test Script
  Tests the ensemble model with sample data after training.

  Usage:
    python model/test_inference.py
    python model/test_inference.py --csv data/processed.csv --n 50
==============================================================
"""

import argparse
import json
import os
import sys

import numpy as np
import pandas as pd

# Add backend to path so we can import EnsembleInference
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from inference import EnsembleInference

MODEL_DIR = os.path.join(os.path.dirname(__file__), "saved_models")

# ─── Sample feature records for quick testing ─────────────────────────────────

SAMPLE_RECORDS = [
    {
        "name": "Normal Web Browsing",
        "features": {
            "duration": 0.5,
            "protocol_type": 1,
            "src_bytes": 1024,
            "dst_bytes": 2048,
            "land": 0,
            "wrong_fragment": 0,
            "urgent": 0,
            "hot": 1,
            "num_failed_logins": 0,
            "logged_in": 1,
            "num_compromised": 0,
            "root_shell": 0,
            "su_attempted": 0,
            "num_root": 0,
            "num_file_creations": 0,
            "num_shells": 0,
            "num_access_files": 1,
            "count": 10,
            "srv_count": 10,
            "dst_host_count": 50,
        },
    },
    {
        "name": "Port Scan (Suspicious)",
        "features": {
            "duration": 0.01,
            "protocol_type": 0,
            "src_bytes": 40,
            "dst_bytes": 0,
            "land": 0,
            "wrong_fragment": 0,
            "urgent": 0,
            "hot": 0,
            "num_failed_logins": 10,
            "logged_in": 0,
            "num_compromised": 0,
            "root_shell": 0,
            "su_attempted": 0,
            "num_root": 0,
            "num_file_creations": 0,
            "num_shells": 0,
            "num_access_files": 0,
            "count": 511,
            "srv_count": 1,
            "dst_host_count": 255,
        },
    },
    {
        "name": "DoS Attack (Malicious)",
        "features": {
            "duration": 0.0,
            "protocol_type": 0,
            "src_bytes": 0,
            "dst_bytes": 0,
            "land": 0,
            "wrong_fragment": 3,
            "urgent": 0,
            "hot": 0,
            "num_failed_logins": 0,
            "logged_in": 0,
            "num_compromised": 0,
            "root_shell": 0,
            "su_attempted": 0,
            "num_root": 0,
            "num_file_creations": 0,
            "num_shells": 0,
            "num_access_files": 0,
            "count": 511,
            "srv_count": 511,
            "dst_host_count": 255,
        },
    },
    {
        "name": "Root Exploit Attempt (Malicious)",
        "features": {
            "duration": 2.3,
            "protocol_type": 1,
            "src_bytes": 9879,
            "dst_bytes": 8001,
            "land": 0,
            "wrong_fragment": 0,
            "urgent": 0,
            "hot": 28,
            "num_failed_logins": 0,
            "logged_in": 1,
            "num_compromised": 235,
            "root_shell": 1,
            "su_attempted": 0,
            "num_root": 235,
            "num_file_creations": 1,
            "num_shells": 2,
            "num_access_files": 1,
            "count": 1,
            "srv_count": 1,
            "dst_host_count": 1,
        },
    },
]


def test_sample_records(engine: EnsembleInference):
    """Run inference on hardcoded sample records."""
    print("\n" + "=" * 70)
    print("  ENSEMBLE MODEL INFERENCE TEST — SAMPLE RECORDS")
    print("=" * 70)

    for record in SAMPLE_RECORDS:
        result = engine.predict_single(record["features"])
        votes = result["ensemble_votes"]

        status_icon = {"Normal": "✅", "Suspicious": "⚠️ ", "Malicious": "🚨"}.get(
            result["label"], "❓"
        )
        print(f"\n{status_icon} [{record['name']}]")
        print(f"   Final Label    : {result['label']}")
        print(f"   Confidence     : {result['confidence']:.2%}")
        print(f"   Severity       : {result['severity'].upper()}")
        print(f"   Ensemble Score : {votes['ensemble_score']}")
        print(f"   Model Votes:")
        print(f"     • Isolation Forest  → {votes['isolation_forest']['label']} ({votes['isolation_forest']['confidence']:.2%})")
        print(f"     • Random Forest     → {votes['random_forest']['label']} ({votes['random_forest']['confidence']:.2%})")
        print(f"     • LSTM Autoencoder  → {votes['lstm_autoencoder']['label']} ({votes['lstm_autoencoder']['confidence']:.2%})")


def test_from_csv(engine: EnsembleInference, csv_path: str, n: int = 50):
    """Run inference on n rows from a processed CSV."""
    print(f"\n{'='*70}")
    print(f"  BATCH INFERENCE TEST — {n} rows from {csv_path}")
    print("=" * 70)

    df = pd.read_csv(csv_path).head(n)
    correct = 0
    total = len(df)

    for idx, row in df.iterrows():
        features = {col: row[col] for col in df.columns if col != "label"}
        result = engine.predict_single(features)
        true_label = int(row.get("label", -1))
        pred_label = {"Normal": 0, "Suspicious": 1, "Malicious": 2}.get(result["label"], -1)
        if true_label == pred_label:
            correct += 1

    accuracy = correct / total if total > 0 else 0
    print(f"\n  Accuracy on {total} samples: {accuracy:.2%} ({correct}/{total} correct)")
    print(f"  (Only exact matches counted; Suspicious/Malicious confusion is expected)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", default=None, help="Optional: path to processed CSV for batch test")
    parser.add_argument("--n", type=int, default=50, help="Number of CSV rows to test")
    args = parser.parse_args()

    print("Loading ensemble inference engine...")
    engine = EnsembleInference(model_dir=MODEL_DIR)

    if not engine.is_ready():
        print("\n❌ Models not loaded. Train the models first:")
        print("   python model/train.py --data data/processed.csv")
        sys.exit(1)

    print("✅ Models loaded successfully")

    # Test with sample records
    test_sample_records(engine)

    # Test with CSV if provided
    if args.csv:
        if os.path.exists(args.csv):
            test_from_csv(engine, args.csv, n=args.n)
        else:
            print(f"\n⚠️  CSV not found: {args.csv}")


if __name__ == "__main__":
    main()
