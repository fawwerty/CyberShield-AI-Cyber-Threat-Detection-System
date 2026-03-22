"""
==============================================================
  CyberShield — CICIDS2017 Dataset Preprocessor
  Supports:
    • Single combined CSV file
    • Directory of multiple CICIDS2017 CSVs (full Kaggle dataset)
    • UNSW-NB15 (optional)
==============================================================

Usage:
  # Multiple CSVs in a directory (Kaggle full dataset):
  python model/preprocess.py --dataset cicids2017 --input_dir data/cicids2017 --output data/processed.csv

  # Single CSV file:
  python model/preprocess.py --dataset cicids2017 --input data/cicids2017/combined.csv --output data/processed.csv

  # UNSW-NB15:
  python model/preprocess.py --dataset unsw_nb15 --input data/UNSW-NB15_1.csv --output data/processed.csv
"""

import argparse
import glob
import logging
import os
import sys

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("preprocessor")

# ─── Unified 3-class label mapping ───────────────────────────────────────────
# 0 = Normal, 1 = Suspicious, 2 = Malicious

CICIDS2017_LABEL_MAP = {
    # ── Standard CICIDS2017 labels (original dataset) ──────────────────────
    "BENIGN": 0,
    "Bot": 2,
    "DDoS": 2,
    "DoS GoldenEye": 2,
    "DoS Hulk": 2,
    "DoS Slowhttptest": 2,
    "DoS slowloris": 2,
    "FTP-Patator": 2,
    "Heartbleed": 2,
    "Infiltration": 1,
    "PortScan": 1,
    "SSH-Patator": 2,
    "Web Attack \x96 Brute Force": 2,
    "Web Attack \xe2\x80\x93 Brute Force": 2,
    "Web Attack – Brute Force": 2,
    "Web Attack  Brute Force": 2,
    "Web Attack \x96 Sql Injection": 2,
    "Web Attack \xe2\x80\x93 Sql Injection": 2,
    "Web Attack – Sql Injection": 2,
    "Web Attack  Sql Injection": 2,
    "Web Attack \x96 XSS": 1,
    "Web Attack \xe2\x80\x93 XSS": 1,
    "Web Attack – XSS": 1,
    "Web Attack  XSS": 1,

    # ── Kaggle combined CSV variant labels ─────────────────────────────────
    # (your cicids2017_combined.csv uses these names)
    "Normal Traffic": 0,
    "Normal": 0,
    "Benign": 0,
    "benign": 0,
    "normal": 0,
    "Port Scanning": 1,
    "PortScanning": 1,
    "Port Scan": 1,
    "Reconnaissance": 1,
    "reconnaissance": 1,
    "Web Attacks": 1,
    "Web Attack": 1,
    "web attack": 1,
    "Brute Force": 2,
    "BruteForce": 2,
    "brute force": 2,
    "brute-force": 2,
    "DDoS": 2,
    "ddos": 2,
    "DDOS": 2,
    "Bots": 2,
    "Bot Activity": 2,
    "botnet": 2,
    "Botnet": 2,
    "DoS": 2,
    "dos": 2,
    "DOS": 2,
    "Denial of Service": 2,
    "SQL Injection": 2,
    "SQLInjection": 2,
    "XSS": 1,
    "Infilteration": 1,
    "Infiltration": 1,
    "Heartbleed": 2,
    "FTP-Patator": 2,
    "SSH-Patator": 2,

    # ── Numeric labels (some Kaggle versions use 0/1 integers) ────────────
    "0": 0, "1": 2,   # binary: 0=normal, 1=attack
}

UNSW_NB15_LABEL_MAP = {
    "Normal": 0,
    "Fuzzers": 1,
    "Analysis": 1,
    "Backdoors": 2,
    "DoS": 2,
    "Exploits": 2,
    "Generic": 2,
    "Reconnaissance": 1,
    "Shellcode": 2,
    "Worms": 2,
}

# ─── The 20 features used across both datasets ───────────────────────────────
# These are intentionally kept consistent with the HuggingFace model's expected features.
FINAL_FEATURES = [
    "duration",
    "protocol_type",
    "src_bytes",
    "dst_bytes",
    "land",
    "wrong_fragment",
    "urgent",
    "hot",
    "num_failed_logins",
    "logged_in",
    "num_compromised",
    "root_shell",
    "su_attempted",
    "num_root",
    "num_file_creations",
    "num_shells",
    "num_access_files",
    "count",
    "srv_count",
    "dst_host_count",
]

# ─── CICIDS2017 raw → standard column name mapping ───────────────────────────
# Handles both space-prefixed and clean column names from different Kaggle versions
CICIDS_REMAP = {
    # Duration
    " Flow Duration": "duration", "Flow Duration": "duration",
    # Protocol
    " Protocol": "protocol_type", "Protocol": "protocol_type",
    # Bytes
    " Total Length of Fwd Packets": "src_bytes", "Total Length of Fwd Packets": "src_bytes",
    " Total Length of Bwd Packets": "dst_bytes", "Total Length of Bwd Packets": "dst_bytes",
    # Packet counts (mapped to count features)
    " Total Fwd Packets": "count", "Total Fwd Packets": "count",
    " Total Backward Packets": "srv_count", "Total Backward Packets": "srv_count",
    # Other traffic features
    " Fwd Packet Length Max": "num_compromised", "Fwd Packet Length Max": "num_compromised",
    " Bwd Packet Length Max": "num_root", "Bwd Packet Length Max": "num_root",
    " Fwd IAT Total": "hot", "Fwd IAT Total": "hot",
    " Flow Packets/s": "dst_host_count", "Flow Packets/s": "dst_host_count",
    " Avg Fwd Segment Size": "num_file_creations", "Avg Fwd Segment Size": "num_file_creations",
    " Avg Bwd Segment Size": "num_access_files", "Avg Bwd Segment Size": "num_access_files",
    # Label
    " Label": "label", "Label": "label",
}

UNSW_REMAP = {
    "dur": "duration", "proto": "protocol_type",
    "sbytes": "src_bytes", "dbytes": "dst_bytes",
    "ct_state_ttl": "count", "ct_srv_src": "srv_count",
    "ct_dst_sport_ltm": "dst_host_count",
    "attack_cat": "attack_category", "label": "label_binary",
}


# ─── Load multiple CSV files from a directory ────────────────────────────────

def load_cicids2017_directory(input_dir: str) -> pd.DataFrame:
    """
    Load all CSV files from a directory and concatenate them.
    Handles both the full Kaggle CICIDS2017 multi-file dataset
    and any single CSV placed in the directory.
    """
    csv_files = sorted(glob.glob(os.path.join(input_dir, "*.csv")))
    if not csv_files:
        raise FileNotFoundError(
            f"No CSV files found in '{input_dir}'.\n"
            f"Please place your CICIDS2017 CSV files in that directory."
        )

    logger.info(f"Found {len(csv_files)} CSV file(s) in {input_dir}")
    parts = []
    for path in csv_files:
        logger.info(f"  Loading: {os.path.basename(path)}")
        try:
            df = pd.read_csv(path, low_memory=False)
            logger.info(f"    → {len(df):,} rows, {len(df.columns)} columns")
            parts.append(df)
        except Exception as e:
            logger.warning(f"  ⚠️ Skipping {os.path.basename(path)}: {e}")

    combined = pd.concat(parts, ignore_index=True)
    logger.info(f"Combined total: {len(combined):,} rows")
    return combined


# ─── CICIDS2017 preprocessing ─────────────────────────────────────────────────

def preprocess_cicids2017(df: pd.DataFrame) -> pd.DataFrame:
    # Step 1: Strip whitespace from ALL column names first
    df.columns = df.columns.str.strip()

    # Step 2: Remap known columns to standard names
    df.rename(columns=CICIDS_REMAP, inplace=True)

    # Step 3: Find label column with broad search
    # Handles: 'Label', 'label', 'LABEL', 'Label ', ' Label',
    #          'Class', 'Attack Type', 'category', 'type', etc.
    label_col = None

    # First priority: exact match after strip
    if "label" in df.columns:
        label_col = "label"
    else:
        # Case-insensitive exact match
        for col in df.columns:
            if col.strip().lower() == "label":
                label_col = col
                break

    # Second priority: common alternative label column names
    if label_col is None:
        alt_names = ["class", "attack", "attack_type", "category",
                     "type", "target", "attack type", "attacktype"]
        for col in df.columns:
            if col.strip().lower() in alt_names:
                label_col = col
                logger.info(f"Using column '{col}' as label column")
                break

    # Third priority: any column whose name contains 'label'
    if label_col is None:
        for col in df.columns:
            if "label" in col.strip().lower():
                label_col = col
                logger.info(f"Using column '{col}' as label column")
                break

    if label_col is None:
        # Show ALL column names to help user diagnose
        raise ValueError(
            f"Could not find a label column in your CSV.\n"
            f"All {len(df.columns)} columns found:\n"
            f"{list(df.columns)}\n\n"
            f"Your CSV must have a column named 'Label' containing values like:\n"
            f"  BENIGN, DDoS, PortScan, Bot, DoS Hulk, etc."
        )

    # Rename to standard 'label'
    if label_col != "label":
        df.rename(columns={label_col: "label"}, inplace=True)

    # Step 4: Map string labels → 0/1/2
    df["label"] = df["label"].astype(str).str.strip()
    unique_labels = df["label"].unique()
    logger.info(f"Unique labels found ({len(unique_labels)}): {list(unique_labels)}")

    df["label"] = df["label"].map(CICIDS2017_LABEL_MAP)

    unmapped = df["label"].isna().sum()
    if unmapped > 0:
        logger.warning(f"{unmapped} rows had unrecognized labels → dropped")

    df.dropna(subset=["label"], inplace=True)
    df["label"] = df["label"].astype(int)
    logger.info(f"Label distribution: {df['label'].value_counts().to_dict()}")

    # Step 5: Fill any missing feature columns with 0
    for col in FINAL_FEATURES:
        if col not in df.columns:
            logger.debug(f"Feature '{col}' not found — filling with 0")
            df[col] = 0.0

    return df[FINAL_FEATURES + ["label"]]


# ─── UNSW-NB15 preprocessing ──────────────────────────────────────────────────

def preprocess_unsw_nb15(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = df.columns.str.strip().str.lower()
    df.rename(columns=UNSW_REMAP, inplace=True)

    if "attack_category" in df.columns:
        df["attack_category"] = df["attack_category"].fillna("Normal").str.strip()
        df["label"] = df["attack_category"].map(UNSW_NB15_LABEL_MAP)
    elif "label_binary" in df.columns:
        df["label"] = df["label_binary"].apply(lambda x: 0 if x == 0 else 2)
    else:
        raise ValueError("No label column found in UNSW-NB15 CSV.")

    if "protocol_type" in df.columns and df["protocol_type"].dtype == object:
        le = LabelEncoder()
        df["protocol_type"] = le.fit_transform(df["protocol_type"].astype(str))

    for col in FINAL_FEATURES:
        if col not in df.columns:
            df[col] = 0.0

    df.dropna(subset=["label"], inplace=True)
    df["label"] = df["label"].astype(int)
    return df[FINAL_FEATURES + ["label"]]


# ─── Cleaning and balancing ───────────────────────────────────────────────────

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    logger.info(f"Cleaning {len(df):,} rows...")
    df.replace([np.inf, -np.inf], np.nan, inplace=True)

    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())

    feature_cols = [c for c in FINAL_FEATURES if c in df.columns]
    for col in feature_cols:
        upper = df[col].quantile(0.999)
        lower = df[col].quantile(0.001)
        df[col] = df[col].clip(lower=lower, upper=upper)

    df.dropna(inplace=True)
    logger.info(f"After cleaning: {len(df):,} rows")
    return df


def balance_dataset(df: pd.DataFrame, max_per_class: int = 100_000) -> pd.DataFrame:
    """Balance classes — cap each at max_per_class to avoid memory issues."""
    counts = df["label"].value_counts()
    logger.info(f"Before balancing: {counts.to_dict()}")

    parts = []
    for val in df["label"].unique():
        sub = df[df["label"] == val]
        if len(sub) > max_per_class:
            sub = sub.sample(n=max_per_class, random_state=42)
        parts.append(sub)

    balanced = pd.concat(parts).sample(frac=1, random_state=42).reset_index(drop=True)
    logger.info(f"After balancing: {balanced['label'].value_counts().to_dict()}")
    return balanced


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Preprocess CICIDS2017 (single CSV or directory) or UNSW-NB15",
        formatter_class=argparse.RawTextHelpFormatter,
        epilog="""
Examples:
  # Single combined CSV (most common):
  python model/preprocess.py --input data/cicids2017/combined.csv --output data/processed.csv

  # Directory of multiple CSVs:
  python model/preprocess.py --input_dir data/cicids2017/ --output data/processed.csv

  # UNSW-NB15:
  python model/preprocess.py --dataset unsw_nb15 --input data/UNSW-NB15_1.csv --output data/processed.csv
"""
    )
    parser.add_argument("--dataset", default="cicids2017", choices=["cicids2017", "unsw_nb15"],
                        help="Which dataset format to expect (default: cicids2017)")
    parser.add_argument("--input", default=None,
                        help="Path to a SINGLE combined CSV file  ← use this for Kaggle CICIDS2017")
    parser.add_argument("--input_dir", default=None,
                        help="Directory containing multiple CSV files (they'll be combined)")
    parser.add_argument("--output", default="data/processed.csv",
                        help="Where to save the processed CSV (default: data/processed.csv)")
    parser.add_argument("--max_per_class", type=int, default=100_000,
                        help="Max rows per class for balancing (default: 100000)")
    args = parser.parse_args()

    # ── Validate inputs ──────────────────────────────────────────────────────
    if args.input and args.input_dir:
        logger.error("Use --input OR --input_dir, not both.")
        sys.exit(1)

    if not args.input and not args.input_dir:
        # Auto-detect: look for any CSV in data/cicids2017/
        auto_dir = os.path.normpath(
            os.path.join(os.path.dirname(os.path.abspath(args.output)), "..", "data", "cicids2017")
        )
        csvs = glob.glob(os.path.join(auto_dir, "*.csv"))
        if csvs:
            if len(csvs) == 1:
                args.input = csvs[0]   # exactly one file → use --input path
                logger.info(f"Auto-detected single CSV: {args.input}")
            else:
                args.input_dir = auto_dir  # multiple files → use --input_dir
                logger.info(f"Auto-detected multi-file directory: {auto_dir}")
        else:
            logger.error(
                "\n  No input specified and no CSV found automatically.\n"
                "  Put your CICIDS2017 CSV in  data/cicids2017/  then re-run,\n"
                "  or pass  --input path/to/your_file.csv\n"
            )
            sys.exit(1)

    # ── Load data ─────────────────────────────────────────────────────────────
    if args.input:
        if not os.path.exists(args.input):
            logger.error(
                f"\n  File not found: {args.input}\n"
                f"  Make sure your CSV is saved in  data/cicids2017/\n"
            )
            sys.exit(1)
        file_size = os.path.getsize(args.input) / (1024 ** 2)
        logger.info(f"Loading CSV: {args.input}  ({file_size:.0f} MB)")
        df = pd.read_csv(args.input, low_memory=False)
        logger.info(f"Loaded {len(df):,} rows, {len(df.columns)} columns")
    else:
        if not os.path.isdir(args.input_dir):
            logger.error(f"Directory not found: {args.input_dir}")
            sys.exit(1)
        df = load_cicids2017_directory(args.input_dir)

    # Preprocess
    if args.dataset == "cicids2017":
        df = preprocess_cicids2017(df)
    else:
        df = preprocess_unsw_nb15(df)

    df = clean_dataframe(df)
    df = balance_dataset(df, max_per_class=args.max_per_class)

    # Save
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    df.to_csv(args.output, index=False)

    logger.info("=" * 55)
    logger.info(f"✅ Saved to: {args.output}")
    logger.info(f"   Shape: {df.shape}")
    logger.info(f"   Label distribution:\n{df['label'].value_counts()}")
    logger.info("=" * 55)
    logger.info("Next: python model/train.py --data data/processed.csv")


if __name__ == "__main__":
    main()
