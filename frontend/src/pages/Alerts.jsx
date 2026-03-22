/**
 * Alerts Page
 * Full alert management: view, filter by label/severity, sort, and clear.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Bell, Filter, Trash2, RefreshCw, ChevronDown } from "lucide-react";
import { getAlerts, clearAlerts } from "../services/api";
import {
  AlertCard, Spinner, EmptyState, SectionHeader, AlertBadge, SeverityBadge,
} from "../components/UIComponents";

const LABEL_FILTERS = ["All", "Malicious", "Suspicious", "Normal"];
const SEVERITY_FILTERS = ["All", "critical", "high", "medium", "low", "none"];
const SORT_OPTIONS = ["Newest First", "Oldest First", "Highest Confidence", "Lowest Confidence"];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [labelFilter, setLabelFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest First");
  const [limit, setLimit] = useState(50);
  const [clearing, setClearing] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit };
      if (labelFilter !== "All") params.label = labelFilter;
      if (severityFilter !== "All") params.severity = severityFilter;
      const data = await getAlerts(params);
      setAlerts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [labelFilter, severityFilter, limit]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 8000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleClear = async () => {
    if (!window.confirm("Clear all alerts? This cannot be undone.")) return;
    setClearing(true);
    try {
      await clearAlerts();
      setAlerts([]);
    } catch (e) {
      setError(e.message);
    } finally {
      setClearing(false);
    }
  };

  // Client-side sorting
  const sortedAlerts = [...alerts].sort((a, b) => {
    switch (sortBy) {
      case "Oldest First":
        return new Date(a.timestamp) - new Date(b.timestamp);
      case "Highest Confidence":
        return b.confidence - a.confidence;
      case "Lowest Confidence":
        return a.confidence - b.confidence;
      default: // Newest First
        return new Date(b.timestamp) - new Date(a.timestamp);
    }
  });

  // Severity order for badge color
  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
  const topSeverity = alerts.reduce(
    (max, a) => (severityOrder[a.severity] > severityOrder[max] ? a.severity : max),
    "none"
  );

  return (
    <div className="min-h-screen p-6 grid-bg" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
          <p className="text-sm font-mono mt-0.5" style={{ color: "var(--muted)" }}>
            {alerts.length} alert{alerts.length !== 1 ? "s" : ""} — auto-refreshes every 8s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono transition-all"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}
          >
            <RefreshCw size={13} />
            Refresh
          </button>
          <button
            onClick={handleClear}
            disabled={clearing || alerts.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono transition-all"
            style={{
              background: "rgba(255,56,96,0.08)",
              border: "1px solid rgba(255,56,96,0.2)",
              color: "#ff3860",
              opacity: alerts.length === 0 ? 0.4 : 1,
              cursor: alerts.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            {clearing ? <Spinner size={13} color="#ff3860" /> : <Trash2 size={13} />}
            Clear All
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      {alerts.length > 0 && (
        <div
          className="grid grid-cols-4 gap-3 mb-5 p-4 rounded-xl border"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          {[
            {
              label: "Total",
              count: alerts.length,
              color: "var(--accent)",
            },
            {
              label: "Malicious",
              count: alerts.filter((a) => a.label === "Malicious").length,
              color: "#ff3860",
            },
            {
              label: "Suspicious",
              count: alerts.filter((a) => a.label === "Suspicious").length,
              color: "#ffcc00",
            },
            {
              label: "Normal",
              count: alerts.filter((a) => a.label === "Normal").length,
              color: "#00ff88",
            },
          ].map(({ label, count, color }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold font-mono" style={{ color }}>
                {count}
              </p>
              <p className="text-xs font-mono mt-0.5" style={{ color: "var(--muted)" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters & Sort */}
      <div
        className="flex flex-wrap items-center gap-3 mb-5 p-4 rounded-xl border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <Filter size={14} color="var(--muted)" />
        <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
          FILTERS:
        </span>

        {/* Label Filter */}
        <div className="flex gap-1">
          {LABEL_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setLabelFilter(f)}
              className="px-2.5 py-1 rounded text-xs font-mono transition-all"
              style={{
                background: labelFilter === f ? "rgba(0,212,255,0.15)" : "var(--surface)",
                border: `1px solid ${labelFilter === f ? "rgba(0,212,255,0.3)" : "var(--border)"}`,
                color: labelFilter === f ? "var(--accent)" : "var(--muted)",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono" style={{ color: "var(--border)" }}>|</span>

        {/* Severity Filter */}
        <div className="flex gap-1 flex-wrap">
          {SEVERITY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setSeverityFilter(f)}
              className="px-2.5 py-1 rounded text-xs font-mono uppercase transition-all"
              style={{
                background: severityFilter === f ? "rgba(0,212,255,0.15)" : "var(--surface)",
                border: `1px solid ${severityFilter === f ? "rgba(0,212,255,0.3)" : "var(--border)"}`,
                color: severityFilter === f ? "var(--accent)" : "var(--muted)",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <ChevronDown size={12} color="var(--muted)" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-mono px-2 py-1 rounded"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--muted)",
              outline: "none",
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="px-4 py-3 rounded-xl mb-4 text-sm font-mono"
          style={{ background: "rgba(255,56,96,0.08)", border: "1px solid rgba(255,56,96,0.25)", color: "#ff3860" }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Alert List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={32} />
        </div>
      ) : sortedAlerts.length === 0 ? (
        <EmptyState message="No alerts match your filters" icon={Bell} />
      ) : (
        <>
          <div className="space-y-3">
            {sortedAlerts.map((alert, i) => (
              <div key={alert.id} className="animate-fade-in">
                <AlertCard alert={alert} isNew={i === 0} />
              </div>
            ))}
          </div>

          {/* Load More */}
          {sortedAlerts.length >= limit && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setLimit((l) => l + 50)}
                className="px-5 py-2.5 rounded-xl text-sm font-mono transition-all"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                }}
              >
                Load More (+50)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
