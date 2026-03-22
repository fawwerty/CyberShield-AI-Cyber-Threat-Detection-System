/**
 * Mobile API Service
 * 
 * ⚠️  IMPORTANT: Change BASE_URL to your computer's local IP address
 *     when testing on a physical device.
 *
 *     To find your IP:
 *       Windows: run  ipconfig  → look for IPv4 Address
 *       Mac/Linux: run  ifconfig  → look for inet
 *
 *     Your current IP appears to be: 172.20.179.164
 *     Update the BASE_URL line below with your IP.
 *
 *     Use "http://localhost:8000" ONLY for emulators (not real phones).
 */

import axios from "axios";

// ─── UPDATE THIS WITH YOUR COMPUTER'S LOCAL IP ────────────────────────────────
export const BASE_URL = "http://172.20.10.2:8000";
// ─────────────────────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "Network error — check your IP and backend";
    return Promise.reject(new Error(message));
  }
);

// ─── API Methods ──────────────────────────────────────────────────────────────

/** Check backend + model health */
export const getHealth = () => api.get("/health");

/** Get recent alerts (optionally filtered) */
export const getAlerts = (params = {}) => api.get("/alerts", { params });

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

/** Clear all alerts */
export const clearAlerts = () => api.delete("/alerts");

export default api;
