"""
==============================================================
  CyberShield — Ensemble Model Training Script
  Trains 3 models on your preprocessed CICIDS2017 data:
    1. Isolation Forest  (unsupervised anomaly detection)
    2. Random Forest     (supervised 3-class classification)
    3. LSTM Autoencoder  (deep learning reconstruction)

  The 4th model (HuggingFace pretrained) is loaded automatically
  at inference time — no training needed for it.

  Usage:
    python model/train.py --data data/processed.csv
    python model/train.py --data data/processed.csv --lstm_epochs 5   # quick test
==============================================================
"""

import argparse
import json
import logging
import os
import time

import joblib
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("trainer")


# ─── LSTM Autoencoder ─────────────────────────────────────────────────────────
class LSTMAutoencoder(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 64, num_layers: int = 2):
        super().__init__()
        self.encoder = nn.LSTM(input_dim, hidden_dim, num_layers=num_layers,
                               batch_first=True, dropout=0.2)
        self.decoder = nn.LSTM(hidden_dim, input_dim, num_layers=num_layers,
                               batch_first=True, dropout=0.2)

    def forward(self, x):
        enc, _ = self.encoder(x)
        dec, _ = self.decoder(enc)
        return dec


# ─── Training routines ────────────────────────────────────────────────────────
def train_isolation_forest(X_train: np.ndarray, contamination: float = 0.15):
    logger.info("Training Isolation Forest...")
    t0 = time.time()
    clf = IsolationForest(n_estimators=300, contamination=contamination,
                          max_samples="auto", random_state=42, n_jobs=-1)
    clf.fit(X_train)
    logger.info(f"  Done in {time.time()-t0:.1f}s")
    return clf


def train_random_forest(X_train: np.ndarray, y_train: np.ndarray):
    logger.info("Training Random Forest Classifier (3-class)...")
    t0 = time.time()
    clf = RandomForestClassifier(n_estimators=300, max_depth=20,
                                  min_samples_split=5, class_weight="balanced",
                                  random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)
    logger.info(f"  Done in {time.time()-t0:.1f}s")
    return clf


def train_lstm_autoencoder(X_normal: np.ndarray, input_dim: int,
                            epochs: int = 20, batch_size: int = 256, lr: float = 1e-3):
    logger.info(f"Training LSTM Autoencoder on {len(X_normal):,} normal samples...")
    t0 = time.time()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"  Device: {device}")

    model = LSTMAutoencoder(input_dim=input_dim).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=3)
    criterion = nn.MSELoss()

    X_tensor = torch.tensor(X_normal, dtype=torch.float32).unsqueeze(1)
    dataset  = torch.utils.data.TensorDataset(X_tensor)
    loader   = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)

    best_loss, best_state = float("inf"), None

    for epoch in range(epochs):
        model.train()
        epoch_loss = 0.0
        for (batch,) in loader:
            batch = batch.to(device)
            optimizer.zero_grad()
            out  = model(batch)
            loss = criterion(out, batch)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            epoch_loss += loss.item()

        avg = epoch_loss / len(loader)
        scheduler.step(avg)
        if avg < best_loss:
            best_loss  = avg
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
        if (epoch + 1) % 5 == 0:
            logger.info(f"  Epoch [{epoch+1}/{epochs}]  loss={avg:.6f}")

    model.load_state_dict(best_state)
    model.eval()

    # Compute anomaly threshold = 95th percentile of normal reconstruction errors
    errors = []
    with torch.no_grad():
        for (batch,) in loader:
            batch = batch.to(device)
            out   = model(batch)
            mse   = torch.mean((batch - out) ** 2, dim=[1, 2])
            errors.extend(mse.cpu().numpy().tolist())

    threshold = float(np.percentile(errors, 95))
    logger.info(f"  LSTM threshold (95th pct): {threshold:.6f}")
    logger.info(f"  Done in {time.time()-t0:.1f}s  best loss={best_loss:.6f}")

    return model.cpu(), threshold


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data",         default="data/processed.csv")
    parser.add_argument("--output_dir",   default="model/saved_models")
    parser.add_argument("--test_size",    type=float, default=0.2)
    parser.add_argument("--lstm_epochs",  type=int,   default=20)
    parser.add_argument("--lstm_batch",   type=int,   default=256)
    parser.add_argument("--contamination",type=float, default=0.15)
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    # Check for HF pretrained model
    hf_dir = os.path.normpath(os.path.join(args.output_dir, "..", "pretrained"))
    if os.path.isdir(hf_dir) and os.listdir(hf_dir):
        logger.info(f"✅ HuggingFace model found in {hf_dir} — will be auto-loaded at inference.")
    else:
        logger.info(f"ℹ️  No HF model in {hf_dir}. Clone it with:")
        logger.info(f"   git clone https://huggingface.co/debashis2007/cybersecuritytl-anomaly-detector model/pretrained")

    # Load processed data
    if not os.path.exists(args.data):
        logger.error(f"Processed data not found: {args.data}")
        logger.error("Run preprocessing first:")
        logger.error("  python model/preprocess.py --dataset cicids2017 --input_dir data/cicids2017 --output data/processed.csv")
        return

    logger.info(f"Loading: {args.data}")
    df = pd.read_csv(args.data)
    logger.info(f"Loaded {len(df):,} rows. Labels: {df['label'].value_counts().to_dict()}")

    feature_cols = [c for c in df.columns if c != "label"]
    X = df[feature_cols].values.astype(np.float32)
    y = df["label"].values.astype(int)

    # Scale
    scaler   = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=args.test_size, random_state=42, stratify=y
    )
    logger.info(f"Train={len(X_train):,}  Test={len(X_test):,}")

    # Train
    iso_forest  = train_isolation_forest(X_train, contamination=args.contamination)
    rand_forest = train_random_forest(X_train, y_train)

    X_normal    = X_train[y_train == 0]
    lstm_model, lstm_threshold = train_lstm_autoencoder(
        X_normal, len(feature_cols), epochs=args.lstm_epochs, batch_size=args.lstm_batch
    )

    # Evaluate RF
    label_names = ["Normal", "Suspicious", "Malicious"]
    y_pred      = rand_forest.predict(X_test)
    report      = classification_report(y_test, y_pred, target_names=label_names, output_dict=True)
    matrix      = confusion_matrix(y_test, y_pred).tolist()
    logger.info("\n" + classification_report(y_test, y_pred, target_names=label_names))

    # Save all artifacts
    joblib.dump(scaler,       os.path.join(args.output_dir, "scaler.pkl"))
    joblib.dump(feature_cols, os.path.join(args.output_dir, "feature_columns.pkl"))
    joblib.dump(iso_forest,   os.path.join(args.output_dir, "isolation_forest.pkl"))
    joblib.dump(rand_forest,  os.path.join(args.output_dir, "random_forest.pkl"))
    torch.save(lstm_model.state_dict(), os.path.join(args.output_dir, "lstm_autoencoder.pt"))
    joblib.dump(lstm_threshold, os.path.join(args.output_dir, "lstm_threshold.pkl"))

    training_report = {
        "timestamp":            time.strftime("%Y-%m-%d %H:%M:%S"),
        "dataset_rows":         len(df),
        "feature_count":        len(feature_cols),
        "features":             feature_cols,
        "label_distribution":   df["label"].value_counts().to_dict(),
        "rf_classification_report": report,
        "rf_confusion_matrix":  matrix,
        "lstm_threshold":       lstm_threshold,
    }
    with open(os.path.join(args.output_dir, "training_report.json"), "w") as f:
        json.dump(training_report, f, indent=2, default=str)

    logger.info("=" * 55)
    logger.info("✅ All models saved!")
    for fn in os.listdir(args.output_dir):
        sz = os.path.getsize(os.path.join(args.output_dir, fn))
        logger.info(f"   {fn}  ({sz/1024:.0f} KB)")
    logger.info("=" * 55)
    logger.info("Next: cd backend && uvicorn main:app --reload")


if __name__ == "__main__":
    main()
