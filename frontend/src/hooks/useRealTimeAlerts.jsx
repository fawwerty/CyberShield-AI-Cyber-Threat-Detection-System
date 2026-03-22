/**
 * useRealTimeAlerts Hook
 * Manages WebSocket connection for real-time alerts with polling fallback.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createWebSocket, getAlerts } from "../services/api";

const MAX_LIVE_ALERTS = 100;

export function useRealTimeAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const pollRef = useRef(null);

  // Add alert to the live feed (newest first, capped at MAX_LIVE_ALERTS)
  const addAlert = useCallback((alert) => {
    setAlerts((prev) => {
      // Avoid duplicates by ID
      if (prev.find((a) => a.id === alert.id)) return prev;
      return [alert, ...prev].slice(0, MAX_LIVE_ALERTS);
    });
  }, []);

  const setHistory = useCallback((history) => {
    setAlerts(history.slice(0, MAX_LIVE_ALERTS));
  }, []);

  // Polling fallback when WebSocket is unavailable
  const startPolling = useCallback(() => {
    pollRef.current = setInterval(async () => {
      try {
        const data = await getAlerts({ limit: 20 });
        if (Array.isArray(data)) {
          setHistory(data);
        }
      } catch (e) {
        // Silently ignore polling errors
      }
    }, 5000); // Poll every 5 seconds
  }, [setHistory]);

  useEffect(() => {
    let wsConnected = false;

    try {
      const ws = createWebSocket(
        (alert) => {
          wsConnected = true;
          setConnected(true);
          addAlert(alert);
        },
        (history) => {
          wsConnected = true;
          setConnected(true);
          setHistory(history);
        }
      );

      ws.onerror = () => {
        setConnected(false);
        if (!wsConnected) startPolling();
      };

      ws.onclose = () => {
        setConnected(false);
        startPolling();
      };

      wsRef.current = ws;
    } catch (e) {
      // WebSocket not available — fall back to polling
      startPolling();
    }

    return () => {
      wsRef.current?.close();
      clearInterval(pollRef.current);
    };
  }, [addAlert, setHistory, startPolling]);

  const clearFeed = useCallback(() => setAlerts([]), []);

  return { alerts, connected, clearFeed };
}
