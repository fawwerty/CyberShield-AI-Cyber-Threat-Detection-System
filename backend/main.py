"""
AI-Enhanced Cybersecurity Threat Detector
FastAPI Backend - Main Application Entry Point
"""

import asyncio
import json
import logging
import os
import uuid
from collections import deque
from datetime import datetime
from typing import List, Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from inference import EnsembleInference
from schemas import (
    AlertResponse,
    AnalyzeRequest,
    AnalyzeResponse,
    BatchAnalyzeResponse,
    HealthResponse,
    StatsResponse,
)

# ─── Logging Setup ───────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("cyber-detector")

# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI Cybersecurity Threat Detector",
    description="Ensemble ML/DL model for network anomaly detection",
    version="1.0.0",
)

# Allow React (3000) and Expo (19006) origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:19006", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-Memory Alert Store (replace with DB in production) ───────────────────
MAX_ALERTS = 500
alert_store: deque = deque(maxlen=MAX_ALERTS)
connected_websockets: List[WebSocket] = []

# ─── Load Ensemble Model at Startup ──────────────────────────────────────────
inference_engine: Optional[EnsembleInference] = None


@app.on_event("startup")
async def startup_event():
    global inference_engine
    model_dir = os.path.join(os.path.dirname(__file__), "..", "model", "saved_models")
    try:
        inference_engine = EnsembleInference(model_dir=model_dir)
        logger.info("✅ Ensemble inference engine loaded successfully")
    except Exception as e:
        logger.warning(f"⚠️  Model not loaded (train first): {e}")
        inference_engine = None


# ─── WebSocket Manager ────────────────────────────────────────────────────────
async def broadcast_alert(alert: dict):
    """Push new alert to all connected WebSocket clients."""
    disconnected = []
    for ws in connected_websockets:
        try:
            await ws.send_json(alert)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        connected_websockets.remove(ws)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.append(websocket)
    logger.info(f"WebSocket client connected. Total: {len(connected_websockets)}")
    try:
        # Send last 10 alerts on connect
        recent = list(alert_store)[-10:]
        await websocket.send_json({"type": "history", "alerts": recent})
        while True:
            # Keep connection alive
            await asyncio.sleep(30)
            await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        connected_websockets.remove(websocket)
        logger.info("WebSocket client disconnected")


# ─── Health Endpoint ──────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Returns API and model health status."""
    model_loaded = inference_engine is not None and inference_engine.is_ready()
    return HealthResponse(
        status="healthy" if model_loaded else "degraded",
        model_loaded=model_loaded,
        model_type="Ensemble (IsolationForest + RandomForest + LSTM Autoencoder)",
        timestamp=datetime.utcnow().isoformat(),
        total_alerts=len(alert_store),
    )


# ─── Analyze Single Record ────────────────────────────────────────────────────
@app.post("/analyze", response_model=AnalyzeResponse, tags=["Detection"])
async def analyze_traffic(request: AnalyzeRequest):
    """
    Accepts a single network traffic record (feature dict) and returns
    threat classification with confidence score.
    """
    if inference_engine is None or not inference_engine.is_ready():
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please train the model first using: python model/train.py",
        )

    try:
        result = inference_engine.predict_single(request.features)
    except Exception as e:
        logger.error(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

    # Build alert object
    alert = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "label": result["label"],
        "confidence": result["confidence"],
        "severity": result["severity"],
        "source_ip": request.source_ip or "unknown",
        "destination_ip": request.destination_ip or "unknown",
        "protocol": request.protocol or "unknown",
        "ensemble_votes": result["ensemble_votes"],
        "features": request.features,
    }

    # Store and broadcast alert if not normal
    if result["label"] != "Normal":
        alert_store.append(alert)
        await broadcast_alert({"type": "alert", "alert": alert})
        logger.info(f"🚨 Threat detected: {result['label']} ({result['confidence']:.2%})")

    return AnalyzeResponse(**alert)


# ─── Batch Analyze from CSV Upload ───────────────────────────────────────────
@app.post("/analyze/batch", response_model=BatchAnalyzeResponse, tags=["Detection"])
async def analyze_batch(file: UploadFile = File(...)):
    """
    Upload a CSV file with multiple network records for batch analysis.
    Returns a summary + list of threats detected.
    """
    if inference_engine is None or not inference_engine.is_ready():
        raise HTTPException(status_code=503, detail="Model not loaded.")

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        contents = await file.read()
        df = pd.read_csv(pd.io.common.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parse error: {str(e)}")

    results = []
    threats_found = 0

    for idx, row in df.iterrows():
        if idx >= 1000:  # Cap batch size for performance
            break
        try:
            features = row.to_dict()
            result = inference_engine.predict_single(features)
            alert = {
                "id": str(uuid.uuid4()),
                "timestamp": datetime.utcnow().isoformat(),
                "label": result["label"],
                "confidence": result["confidence"],
                "severity": result["severity"],
                "row_index": int(idx),
                "ensemble_votes": result["ensemble_votes"],
            }
            results.append(alert)
            if result["label"] != "Normal":
                threats_found += 1
                alert_store.append(alert)
                await broadcast_alert({"type": "alert", "alert": alert})
        except Exception as e:
            logger.warning(f"Row {idx} failed: {e}")
            continue

    return BatchAnalyzeResponse(
        total_analyzed=len(results),
        threats_detected=threats_found,
        normal_count=len(results) - threats_found,
        results=results,
    )


# ─── Get All Alerts ───────────────────────────────────────────────────────────
@app.get("/alerts", response_model=List[dict], tags=["Alerts"])
async def get_alerts(
    limit: int = 50,
    label: Optional[str] = None,
    severity: Optional[str] = None,
):
    """
    Returns recent detected threat alerts.
    Filter by label (Normal/Suspicious/Malicious) or severity (low/medium/high/critical).
    """
    alerts = list(alert_store)
    alerts.reverse()  # Most recent first

    if label:
        alerts = [a for a in alerts if a.get("label", "").lower() == label.lower()]
    if severity:
        alerts = [a for a in alerts if a.get("severity", "").lower() == severity.lower()]

    return alerts[:limit]


# ─── Get Stats ────────────────────────────────────────────────────────────────
@app.get("/stats", response_model=StatsResponse, tags=["Analytics"])
async def get_stats():
    """Returns summary statistics for the dashboard."""
    all_alerts = list(alert_store)
    total = len(all_alerts)
    malicious = sum(1 for a in all_alerts if a.get("label") == "Malicious")
    suspicious = sum(1 for a in all_alerts if a.get("label") == "Suspicious")
    normal = sum(1 for a in all_alerts if a.get("label") == "Normal")

    # Severity breakdown
    critical = sum(1 for a in all_alerts if a.get("severity") == "critical")
    high = sum(1 for a in all_alerts if a.get("severity") == "high")
    medium = sum(1 for a in all_alerts if a.get("severity") == "medium")
    low = sum(1 for a in all_alerts if a.get("severity") == "low")

    # Last 24 alerts for timeline (newest first, limit 24 for chart)
    timeline = [
        {"timestamp": a["timestamp"], "label": a["label"]}
        for a in reversed(all_alerts[-24:])
    ]

    return StatsResponse(
        total_analyzed=total,
        malicious_count=malicious,
        suspicious_count=suspicious,
        normal_count=normal,
        critical_count=critical,
        high_count=high,
        medium_count=medium,
        low_count=low,
        timeline=timeline,
    )


# ─── Clear Alerts ─────────────────────────────────────────────────────────────
@app.delete("/alerts", tags=["Alerts"])
async def clear_alerts():
    """Clears all stored alerts (use with caution)."""
    alert_store.clear()
    return {"message": "All alerts cleared", "timestamp": datetime.utcnow().isoformat()}


# ─── Run ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
