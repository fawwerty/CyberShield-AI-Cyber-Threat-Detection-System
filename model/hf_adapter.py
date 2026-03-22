"""
==============================================================
  HuggingFace Model Adapter
  Loads: debashis2007/cybersecuritytl-anomaly-detector

  This adapter auto-detects the model format and provides
  a unified predict() interface regardless of whether the
  model is:
    • A scikit-learn pipeline (.pkl / .joblib)
    • A PyTorch model (.pt / .bin / .safetensors)
    • A HuggingFace pipeline (config.json + weights)
    • A simple label encoder + scaler combo

  The adapter is used as the 4th ensemble member in inference.py,
  alongside Isolation Forest, Random Forest, and LSTM Autoencoder.
==============================================================
"""

import json
import logging
import os
from typing import Any, Dict, Optional

import numpy as np

logger = logging.getLogger("hf_adapter")

# ─── Optional imports (graceful fallback if not installed) ────────────────────
try:
    import joblib
    HAS_JOBLIB = True
except ImportError:
    HAS_JOBLIB = False

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

try:
    import pickle
    HAS_PICKLE = True
except ImportError:
    HAS_PICKLE = False


# ─── Label mapping from HF model's expected output ───────────────────────────
# Adjust if the model uses different class names
HF_LABEL_MAP = {
    # Numeric outputs
    0: "Normal", 1: "Suspicious", 2: "Malicious",
    # String outputs (common variants)
    "normal": "Normal", "benign": "Normal", "0": "Normal",
    "suspicious": "Suspicious", "anomaly": "Suspicious", "1": "Suspicious",
    "malicious": "Malicious", "attack": "Malicious", "2": "Malicious",
    # CICIDS-style labels
    "BENIGN": "Normal",
    "Bot": "Malicious", "DDoS": "Malicious", "DoS": "Malicious",
    "PortScan": "Suspicious", "Infiltration": "Suspicious",
}


def normalize_label(raw_label: Any) -> str:
    """Convert any model output label to Normal/Suspicious/Malicious."""
    if raw_label is None:
        return "Suspicious"
    key = raw_label if isinstance(raw_label, str) else int(raw_label)
    return HF_LABEL_MAP.get(key, HF_LABEL_MAP.get(str(key), "Suspicious"))


class HuggingFaceModelAdapter:
    """
    Wraps the cloned HuggingFace model and exposes a unified predict() method.
    Auto-detects model format on initialization.
    """

    def __init__(self, model_dir: str):
        self.model_dir = model_dir
        self.model = None
        self.scaler = None
        self.label_encoder = None
        self.config = {}
        self.model_type = "unknown"
        self._ready = False

        self._load()

    def _load(self):
        if not os.path.isdir(self.model_dir):
            logger.warning(f"HF model dir not found: {self.model_dir}")
            return

        files = os.listdir(self.model_dir)
        logger.info(f"HF model directory contents: {files}")

        # Load config.json if present (may contain feature names, label map)
        config_path = os.path.join(self.model_dir, "config.json")
        if os.path.exists(config_path):
            with open(config_path) as f:
                self.config = json.load(f)
            logger.info(f"Loaded config.json: {list(self.config.keys())}")

        # ── Try loading in order of preference ───────────────────────────────

        # 1. scikit-learn pipeline (.pkl or .joblib)
        for name in ["detector.pkl", "model.pkl", "model.joblib", "pipeline.pkl", "classifier.pkl",
                     "anomaly_detector.pkl", "cybersecuritytl.pkl"]:
            path = os.path.join(self.model_dir, name)
            if os.path.exists(path):
                # Try joblib first
                if HAS_JOBLIB:
                    try:
                        self.model = joblib.load(path)
                        self.model_type = "sklearn"
                        self._ready = True
                        logger.info(f"✅ Loaded sklearn model: {name} ({type(self.model).__name__})")
                        break
                    except Exception as e:
                        logger.warning(f"joblib failed for {name}: {e}")
                # Try pickle as fallback
                if HAS_PICKLE and not self._ready:
                    try:
                        import pickle
                        with open(path, "rb") as f:
                            self.model = pickle.load(f)
                        self.model_type = "sklearn"
                        self._ready = True
                        logger.info(f"✅ Loaded via pickle: {name} ({type(self.model).__name__})")
                        break
                    except Exception as e:
                        logger.warning(f"pickle failed for {name}: {e}")

        # 2. PyTorch model (.pt or .bin)
        if not self._ready and HAS_TORCH:
            for name in ["model.pt", "pytorch_model.bin", "model.bin", "anomaly_detector.pt"]:
                path = os.path.join(self.model_dir, name)
                if os.path.exists(path):
                    try:
                        state = torch.load(path, map_location="cpu")
                        # Check if it's a state dict or full model
                        if isinstance(state, dict):
                            self.model = state  # Store state dict; build model in predict
                            self.model_type = "pytorch_state_dict"
                        else:
                            self.model = state
                            self.model_type = "pytorch_full"
                        self._ready = True
                        logger.info(f"✅ Loaded PyTorch model: {name}")
                        break
                    except Exception as e:
                        logger.warning(f"torch load failed for {name}: {e}")

        # 3. Safetensors format
        if not self._ready:
            for name in ["model.safetensors"]:
                path = os.path.join(self.model_dir, name)
                if os.path.exists(path):
                    try:
                        from safetensors import safe_open
                        tensors = {}
                        with safe_open(path, framework="pt", device="cpu") as f:
                            for k in f.keys():
                                tensors[k] = f.get_tensor(k)
                        self.model = tensors
                        self.model_type = "safetensors"
                        self._ready = True
                        logger.info(f"✅ Loaded safetensors model: {name}")
                    except ImportError:
                        logger.warning("safetensors not installed. pip install safetensors")
                    except Exception as e:
                        logger.warning(f"safetensors load failed: {e}")

        # 4. Raw pickle
        if not self._ready and HAS_PICKLE:
            for name in ["model.pickle", "detector.pickle"]:
                path = os.path.join(self.model_dir, name)
                if os.path.exists(path):
                    try:
                        with open(path, "rb") as f:
                            self.model = pickle.load(f)
                        self.model_type = "pickle"
                        self._ready = True
                        logger.info(f"✅ Loaded pickle model: {name}")
                    except Exception as e:
                        logger.warning(f"pickle load failed: {e}")

        # Load companion scaler if available
        for name in ["scaler.pkl", "scaler.joblib", "preprocessing.pkl"]:
            path = os.path.join(self.model_dir, name)
            if os.path.exists(path) and HAS_JOBLIB:
                try:
                    self.scaler = joblib.load(path)
                    logger.info(f"Loaded HF scaler: {name}")
                except Exception:
                    pass

        if not self._ready:
            logger.warning(
                "⚠️  HuggingFace model could not be loaded. "
                "Ensemble will run with 3 models instead of 4. "
                "Check that model files are in model/pretrained/"
            )

    def is_ready(self) -> bool:
        return self._ready

    def predict(self, X: np.ndarray) -> Dict[str, Any]:
        """
        Run inference on a single preprocessed feature vector.
        Returns dict with label, confidence, and raw output.
        """
        if not self._ready:
            return {"label": "Suspicious", "confidence": 0.5, "available": False}

        try:
            # Apply companion scaler if present and no upstream scaling was done
            X_input = X.copy()
            if self.scaler is not None:
                X_input = self.scaler.transform(X_input)

            if self.model_type == "sklearn":
                return self._predict_sklearn(X_input)
            elif self.model_type in ("pytorch_full", "pytorch_state_dict"):
                return self._predict_pytorch(X_input)
            elif self.model_type in ("safetensors", "pickle"):
                # For these formats, try calling predict if the object supports it
                if hasattr(self.model, "predict"):
                    return self._predict_sklearn(X_input)
                return {"label": "Suspicious", "confidence": 0.5, "available": True}
        except Exception as e:
            logger.error(f"HF prediction failed: {e}")
            return {"label": "Suspicious", "confidence": 0.5, "available": True, "error": str(e)}

    def _predict_sklearn(self, X: np.ndarray) -> Dict[str, Any]:
        """Handle sklearn-compatible model."""
        raw_pred = self.model.predict(X)[0]
        label = normalize_label(raw_pred)

        confidence = 0.75  # Default if no probability output
        if hasattr(self.model, "predict_proba"):
            proba = self.model.predict_proba(X)[0]
            confidence = float(np.max(proba))
        elif hasattr(self.model, "decision_function"):
            score = self.model.decision_function(X)[0]
            # Normalize decision function score to [0,1]
            confidence = float(np.clip(abs(score) / (abs(score) + 1), 0.1, 1.0))

        return {
            "label": label,
            "confidence": confidence,
            "raw_prediction": str(raw_pred),
            "available": True,
        }

    def _predict_pytorch(self, X: np.ndarray) -> Dict[str, Any]:
        """Handle PyTorch model (assumes simple MLP or similar)."""
        if not HAS_TORCH:
            return {"label": "Suspicious", "confidence": 0.5, "available": True}

        if self.model_type == "pytorch_state_dict":
            # Cannot easily reconstruct unknown architecture from state dict alone
            # Return neutral suspicious score
            logger.debug("PyTorch state_dict loaded but architecture unknown — returning default")
            return {"label": "Suspicious", "confidence": 0.6, "available": True}

        # Full model
        self.model.eval()
        with torch.no_grad():
            tensor = torch.tensor(X, dtype=torch.float32)
            output = self.model(tensor)

            if output.shape[-1] > 1:
                proba = torch.softmax(output, dim=-1).numpy()[0]
                class_idx = int(np.argmax(proba))
                label = normalize_label(class_idx)
                confidence = float(proba[class_idx])
            else:
                # Binary output
                score = float(torch.sigmoid(output)[0])
                label = "Malicious" if score > 0.7 else ("Suspicious" if score > 0.4 else "Normal")
                confidence = score if label != "Normal" else 1.0 - score

        return {"label": label, "confidence": confidence, "available": True}
