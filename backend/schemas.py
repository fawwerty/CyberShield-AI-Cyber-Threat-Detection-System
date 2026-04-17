"""
Pydantic schemas for request and response validation.
These define the exact shape of data going in and out of the API.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ─── Request Schemas ──────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    """
    Single network traffic record for analysis.
    'features' is a dictionary of network feature names to their values.
    """
    features: Dict[str, Any] = Field(
        ...,
        description="Network traffic feature key-value pairs",
        example={
            "duration": 0.5,
            "protocol_type": 1,
            "src_bytes": 1024,
            "dst_bytes": 512,
            "land": 0,
            "wrong_fragment": 0,
            "urgent": 0,
            "hot": 1,
            "num_failed_logins": 0,
            "logged_in": 1,
        },
    )
    source_ip: Optional[str] = Field(None, example="192.168.1.5")
    destination_ip: Optional[str] = Field(None, example="10.0.0.1")
    protocol: Optional[str] = Field(None, example="TCP")


# ─── Response Schemas ─────────────────────────────────────────────────────────

class AnalyzeResponse(BaseModel):
    """Response for a single analyzed traffic record."""
    id: str
    timestamp: str
    label: str = Field(..., description="Normal | Suspicious | Malicious")
    confidence: float = Field(..., ge=0.0, le=1.0, description="0.0 to 1.0")
    severity: str = Field(..., description="none | low | medium | high | critical")
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    protocol: Optional[str] = None
    ensemble_votes: Dict[str, Any] = Field(default_factory=dict)
    features: Dict[str, Any] = Field(default_factory=dict)


class BatchAnalyzeResponse(BaseModel):
    """Response for batch CSV analysis."""
    total_analyzed: int
    threats_detected: int
    normal_count: int
    results: List[Dict[str, Any]]


class HealthResponse(BaseModel):
    """API and model health status."""
    status: str
    model_loaded: bool
    model_type: str
    timestamp: str
    total_alerts: int


class StatsResponse(BaseModel):
    """Dashboard statistics summary."""
    total_analyzed: int
    malicious_count: int
    suspicious_count: int
    normal_count: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    timeline: List[Dict[str, str]]


class AlertResponse(BaseModel):
    """A single alert record."""
    id: str
    timestamp: str
    label: str
    confidence: float
    severity: str
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    protocol: Optional[str] = None
    ensemble_votes: Dict[str, Any] = Field(default_factory=dict)


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    """Schema for new user registration."""
    email: str = Field(..., example="admin@cybershield.ai")
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., example="System Administrator")

class UserLogin(BaseModel):
    """Schema for user authentication."""
    email: str = Field(..., example="admin@cybershield.ai")
    password: str = Field(...)

class Token(BaseModel):
    """JWT Token response."""
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]
