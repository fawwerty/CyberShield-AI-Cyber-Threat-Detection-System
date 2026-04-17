"""
AI-Enhanced Cybersecurity Threat Detector
FastAPI Backend - Main Application Entry Point
"""

import asyncio
import json
import logging
import os
import uuid
import jwt
from collections import deque
from datetime import datetime, timedelta
from typing import List, Optional, Any, Dict

import numpy as np
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from pydantic import BaseModel

from inference import EnsembleInference
from database import get_db
from schemas import (
    AlertResponse,
    AnalyzeRequest,
    AnalyzeResponse,
    BatchAnalyzeResponse,
    HealthResponse,
    StatsResponse,
    UserRegister,
    UserLogin,
    Token,
)

# ─── Configuration ──────────────────────────────────────────────────────────
load_dotenv = lambda: None # Mock if not using python-dotenv directly here
SECRET_KEY = os.getenv("JWT_SECRET", "cybershield-ultra-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

# ─── Auth Setup ─────────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

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
    version="1.1.0",
)

# CORS logic
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to verified Vercel domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Persistence & Model ──────────────────────────────────────────────────────
db = get_db()
connected_websockets: List[WebSocket] = []
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

# ─── Auth Utilities ──────────────────────────────────────────────────────────
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

# ─── WebSocket Manager ────────────────────────────────────────────────────────
async def broadcast_alert(alert: dict):
    disconnected = []
    for ws in connected_websockets:
        try:
            await ws.send_json(alert)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        if ws in connected_websockets:
            connected_websockets.remove(ws)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.append(websocket)
    try:
        # Send history from DB
        recent = list(db.logs.find().sort("timestamp", -1).limit(10))
        for r in recent: r["_id"] = str(r["_id"])
        await websocket.send_json({"type": "history", "alerts": recent})
        while True:
            await asyncio.sleep(30)
            await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)

# ─── Auth Endpoints ───────────────────────────────────────────────────────────
@app.post("/auth/register", tags=["Auth"])
async def register(user: UserRegister):
    if db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "email": user.email,
        "password": get_password_hash(user.password),
        "full_name": user.full_name,
        "created_at": datetime.utcnow()
    }
    db.users.insert_one(user_dict)
    return {"message": "User created successfully"}

@app.post("/auth/login", response_model=Token, tags=["Auth"])
async def login(user: UserLogin):
    db_user = db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": db_user["email"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": db_user["email"],
            "full_name": db_user["full_name"]
        }
    }

# ─── System & Analytics ───────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    model_loaded = inference_engine is not None and inference_engine.is_ready()
    return HealthResponse(
        status="healthy" if model_loaded else "degraded",
        model_loaded=model_loaded,
        model_type="Ensemble Neural Engine",
        timestamp=datetime.utcnow().isoformat(),
        total_alerts=db.logs.count_documents({}),
    )

@app.post("/analyze", response_model=AnalyzeResponse, tags=["Detection"])
async def analyze_traffic(request: AnalyzeRequest, current_user: dict = Depends(get_current_user)):
    if inference_engine is None or not inference_engine.is_ready():
        raise HTTPException(status_code=503, detail="Model engine offline")

    result = inference_engine.predict_single(request.features)
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
        "user_email": current_user["email"]
    }

    # Persistent storage
    db.logs.insert_one(alert.copy())
    
    if result["label"] != "Normal":
        alert_out = alert.copy()
        if "_id" in alert_out: del alert_out["_id"]
        await broadcast_alert({"type": "alert", "alert": alert_out})
        logger.info(f"🚨 Threat detected: {result['label']}")

    return AnalyzeResponse(**alert)

@app.get("/alerts", response_model=List[dict], tags=["Alerts"])
async def get_alerts(limit: int = 50, label: Optional[str] = None):
    query = {}
    if label: query["label"] = label
    
    cursor = db.logs.find(query).sort("timestamp", -1).limit(limit)
    alerts = []
    for doc in cursor:
        doc["id"] = doc.get("id", str(doc.get("_id")))
        del doc["_id"]
        alerts.append(doc)
    return alerts

@app.get("/stats", response_model=StatsResponse, tags=["Analytics"])
async def get_stats():
    total = db.logs.count_documents({})
    malicious = db.logs.count_documents({"label": "Malicious"})
    suspicious = db.logs.count_documents({"label": "Suspicious"})
    normal = db.logs.count_documents({"label": "Normal"})

    # Severity
    crit = db.logs.count_documents({"severity": "critical"})
    high = db.logs.count_documents({"severity": "high"})
    med = db.logs.count_documents({"severity": "medium"})
    low = db.logs.count_documents({"severity": "low"})

    timeline_docs = db.logs.find({}, {"timestamp": 1, "label": 1}).sort("timestamp", -1).limit(24)
    timeline = [{"timestamp": d["timestamp"], "label": d["label"]} for d in timeline_docs]

    return StatsResponse(
        total_analyzed=total,
        malicious_count=malicious,
        suspicious_count=suspicious,
        normal_count=normal,
        critical_count=crit,
        high_count=high,
        medium_count=med,
        low_count=low,
        timeline=timeline,
    )

@app.delete("/alerts", tags=["Alerts"])
async def clear_alerts(current_user: dict = Depends(get_current_user)):
    db.logs.delete_many({})
    return {"message": "Logs cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
