"""
==============================================================
  Ensemble Inference Engine — 4 Models
  ─────────────────────────────────────
  1. Isolation Forest  (weight: 0.20) — unsupervised anomaly
  2. Random Forest     (weight: 0.40) — supervised classifier
  3. LSTM Autoencoder  (weight: 0.20) — deep reconstruction
  4. HuggingFace Model (weight: 0.20) — pretrained transfer model

  If any model is unavailable its weight is redistributed to RF.
==============================================================
"""

import logging
import os
import sys
from typing import Any, Dict

import joblib
import numpy as np
import torch
import torch.nn as nn

# Import HuggingFace adapter (in same model/ directory)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "model"))
try:
    from hf_adapter import HuggingFaceModelAdapter
    HAS_HF_ADAPTER = True
except ImportError:
    HAS_HF_ADAPTER = False

logger = logging.getLogger("inference")

# ─── Label helpers ────────────────────────────────────────────────────────────
LABEL_MAP = {0: "Normal", 1: "Suspicious", 2: "Malicious"}


def confidence_to_severity(label: str, confidence: float) -> str:
    if label == "Normal":
        return "none"
    if label == "Suspicious":
        return "medium" if confidence > 0.7 else "low"
    if confidence > 0.90:
        return "critical"
    if confidence > 0.75:
        return "high"
    return "medium"


# ─── LSTM Autoencoder (must match train.py architecture) ─────────────────────
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


# ─── Main ensemble class ──────────────────────────────────────────────────────
class EnsembleInference:
    # Base weights — will be renormalized if HF model unavailable
    BASE_WEIGHTS = {
        "isolation_forest": 0.20,
        "random_forest":    0.40,
        "lstm_autoencoder": 0.20,
        "huggingface":      0.20,
    }

    def __init__(self, model_dir: str):
        self.model_dir = model_dir
        self.isolation_forest = None
        self.random_forest    = None
        self.lstm_model       = None
        self.hf_model         = None
        self.scaler           = None
        self.feature_columns  = None
        self.lstm_threshold   = None
        self.input_dim        = None
        self._ready           = False
        self._load()

    # ── Loading ───────────────────────────────────────────────────────────────
    def _load(self):
        try:
            self.scaler = joblib.load(os.path.join(self.model_dir, "scaler.pkl"))
            self.feature_columns = joblib.load(os.path.join(self.model_dir, "feature_columns.pkl"))
            self.input_dim = len(self.feature_columns)

            self.isolation_forest = joblib.load(os.path.join(self.model_dir, "isolation_forest.pkl"))
            self.random_forest    = joblib.load(os.path.join(self.model_dir, "random_forest.pkl"))

            lstm_path = os.path.join(self.model_dir, "lstm_autoencoder.pt")
            self.lstm_model = LSTMAutoencoder(input_dim=self.input_dim)
            self.lstm_model.load_state_dict(torch.load(lstm_path, map_location="cpu"))
            self.lstm_model.eval()

            self.lstm_threshold = joblib.load(os.path.join(self.model_dir, "lstm_threshold.pkl"))
            self._ready = True
            logger.info(f"✅ Core models loaded ({self.input_dim} features)")

        except FileNotFoundError as e:
            logger.warning(f"Core models not found: {e}. Run training first.")
            return
        except Exception as e:
            logger.error(f"Model load error: {e}")
            return

        # Load HuggingFace model (optional — won't break if missing)
        hf_dir = os.path.normpath(os.path.join(self.model_dir, "..", "pretrained"))
        if HAS_HF_ADAPTER and os.path.isdir(hf_dir):
            self.hf_model = HuggingFaceModelAdapter(model_dir=hf_dir)
            if self.hf_model.is_ready():
                logger.info("✅ HuggingFace pretrained model loaded")
            else:
                logger.warning("⚠️  HF model dir exists but could not load — running without it")
                self.hf_model = None
        else:
            logger.info("ℹ️  No HF model found in model/pretrained/ — running 3-model ensemble")
            self.hf_model = None

    def is_ready(self) -> bool:
        return self._ready

    # ── Preprocessing ─────────────────────────────────────────────────────────
    def _preprocess(self, features: Dict[str, Any]) -> np.ndarray:
        row = {col: features.get(col, 0.0) for col in self.feature_columns}
        X = np.array([[row[col] for col in self.feature_columns]], dtype=np.float32)
        X = np.nan_to_num(X, nan=0.0, posinf=1e6, neginf=-1e6)
        return self.scaler.transform(X)

    # ── Individual model votes ────────────────────────────────────────────────
    def _vote_isolation_forest(self, X: np.ndarray) -> Dict:
        pred  = self.isolation_forest.predict(X)[0]
        score = self.isolation_forest.score_samples(X)[0]
        anomaly_prob = float(np.clip((-score - 0.1) / 0.5, 0.0, 1.0))
        label = "Normal" if pred == 1 else ("Malicious" if anomaly_prob > 0.6 else "Suspicious")
        return {"label": label, "confidence": anomaly_prob, "raw_score": float(score)}

    def _vote_random_forest(self, X: np.ndarray) -> Dict:
        proba     = self.random_forest.predict_proba(X)[0]
        class_idx = int(np.argmax(proba))
        return {
            "label": LABEL_MAP[class_idx],
            "confidence": float(proba[class_idx]),
            "probabilities": {
                "Normal": float(proba[0]),
                "Suspicious": float(proba[1]),
                "Malicious": float(proba[2]),
            },
        }

    def _vote_lstm(self, X: np.ndarray) -> Dict:
        tensor = torch.tensor(X, dtype=torch.float32).unsqueeze(1)
        with torch.no_grad():
            recon = self.lstm_model(tensor)
        mse   = float(torch.mean((tensor - recon) ** 2).item())
        ratio = mse / (self.lstm_threshold + 1e-9)
        prob  = float(np.clip(ratio, 0.0, 1.0))
        label = "Malicious" if ratio > 1.5 else ("Suspicious" if ratio > 1.0 else "Normal")
        return {
            "label": label,
            "confidence": prob,
            "reconstruction_error": mse,
            "threshold": float(self.lstm_threshold),
        }

    def _vote_huggingface(self, X: np.ndarray) -> Dict:
        """
        Call the HuggingFace model. X is already scaled by the core scaler.
        The HF adapter has its own companion scaler if needed — it will skip
        double-scaling automatically since we pass raw scaled values.
        """
        result = self.hf_model.predict(X)
        return {
            "label": result["label"],
            "confidence": result["confidence"],
            "available": result.get("available", True),
        }

    # ── Ensemble prediction ───────────────────────────────────────────────────
    def predict_single(self, features: Dict[str, Any]) -> Dict[str, Any]:
        X = self._preprocess(features)

        label_to_int = {"Normal": 0, "Suspicious": 1, "Malicious": 2}

        # Collect votes
        if_vote   = self._vote_isolation_forest(X)
        rf_vote   = self._vote_random_forest(X)
        lstm_vote = self._vote_lstm(X)

        votes = {
            "random_forest":    (rf_vote,   self.BASE_WEIGHTS["random_forest"]),
            "isolation_forest": (if_vote,   self.BASE_WEIGHTS["isolation_forest"]),
            "lstm_autoencoder": (lstm_vote, self.BASE_WEIGHTS["lstm_autoencoder"]),
        }

        # Add HF vote if available
        if self.hf_model and self.hf_model.is_ready():
            hf_vote = self._vote_huggingface(X)
            votes["huggingface_model"] = (hf_vote, self.BASE_WEIGHTS["huggingface"])
        else:
            # Redistribute HF weight to Random Forest
            votes["random_forest"] = (
                rf_vote,
                self.BASE_WEIGHTS["random_forest"] + self.BASE_WEIGHTS["huggingface"],
            )

        # Normalize weights to sum to 1.0
        total_weight = sum(w for _, w in votes.values())
        votes = {k: (v, w / total_weight) for k, (v, w) in votes.items()}

        # Weighted ensemble score (0=Normal → 2=Malicious)
        ensemble_score = sum(
            label_to_int[v["label"]] * w for _, (v, w) in votes.items()
        )

        # Final label
        if ensemble_score < 0.5:
            final_label = "Normal"
        elif ensemble_score < 1.5:
            final_label = "Suspicious"
        else:
            final_label = "Malicious"

        # Final confidence = weighted average of individual confidences
        final_confidence = float(np.clip(
            sum(v["confidence"] * w for _, (v, w) in votes.items()),
            0.0, 1.0,
        ))

        # Build ensemble_votes dict for the API response
        votes_out = {k: v for k, (v, _) in votes.items()}
        votes_out["ensemble_score"] = round(ensemble_score, 4)
        votes_out["hf_model_active"] = self.hf_model is not None and self.hf_model.is_ready()

        return {
            "label": final_label,
            "confidence": final_confidence,
            "severity": confidence_to_severity(final_label, final_confidence),
            "ensemble_votes": votes_out,
        }
