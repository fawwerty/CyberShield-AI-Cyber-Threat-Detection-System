/**
 * API Service
 * Centralizes all backend communication.
 * Base URL reads from environment variable (default: localhost:8000)
 */

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ─── Response Interceptor for Error Handling ──────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "Unknown error occurred";
    return Promise.reject(new Error(message));
  }
);

// ─── API Methods ──────────────────────────────────────────────────────────────

/** Check backend + model health */
export const getHealth = () => api.get("/health");

/** Get recent alerts (optionally filtered) */
export const getAlerts = ({ limit = 50, label, severity } = {}) => {
  const params = { limit };
  if (label) params.label = label;
  if (severity) params.severity = severity;
  return api.get("/alerts", { params });
};

/** Get dashboard statistics */
export const getStats = () => api.get("/stats");

/** Analyze a single feature record */
export const analyzeRecord = (features, meta = {}) =>
  api.post("/analyze", {
    features,
    source_ip: meta.source_ip || null,
    destination_ip: meta.destination_ip || null,
    protocol: meta.protocol || null,
  });

/** Upload a CSV file for batch analysis */
export const analyzeBatch = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post(`${BASE_URL}/analyze/batch`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000, // 2 min for large files
  }).then((r) => r.data);
};

/** Clear all alerts */
export const clearAlerts = () => api.delete("/alerts");

// ─── WebSocket Helper ─────────────────────────────────────────────────────────

/**
 * Create a WebSocket connection for real-time alerts.
 * @param {function} onAlert - callback for new alert events
 * @param {function} onHistory - callback for initial history batch
 * @returns {WebSocket} the socket instance (call .close() to disconnect)
 */
export const createWebSocket = (onAlert, onHistory) => {
  const wsUrl = BASE_URL.replace("http://", "ws://").replace("https://", "wss://");
  const ws = new WebSocket(`${wsUrl}/ws`);

  ws.onopen = () => console.log("✅ WebSocket connected");

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "alert" && data.alert) {
        onAlert(data.alert);
      } else if (data.type === "history" && data.alerts) {
        onHistory(data.alerts);
      }
    } catch (e) {
      console.error("WS parse error:", e);
    }
  };

  ws.onerror = (err) => console.error("WebSocket error:", err);
  ws.onclose = () => console.log("WebSocket disconnected");

  return ws;
};

export default api;
