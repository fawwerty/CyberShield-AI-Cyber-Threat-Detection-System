/**
 * Logs Page
 * Shows raw alert data in a detailed table view with
 * expandable rows revealing ensemble vote breakdowns.
 */

import React, { useState, useEffect, useCallback } from "react";
import { ScrollText, ChevronDown, ChevronRight, RefreshCw, Download } from "lucide-react";
import { getAlerts } from "../services/api";
import { AlertBadge, SeverityBadge, Spinner, EmptyState } from "../components/UIComponents";

// ─── Expandable Row Component ─────────────────────────────────────────────────
function LogRow({ alert, index }) {
  const [expanded, setExpanded] = useState(false);

  const time = new Date(alert.timestamp).toLocaleString();
  const rfVote = alert.ensemble_votes?.random_forest;
  const ifVote = alert.ensemble_votes?.isolation_forest;
  const lstmVote = alert.ensemble_votes?.lstm_autoencoder;

  return (
    <>
      {/* Main Row */}
      <tr
        className="border-b cursor-pointer transition-colors"
        style={{
          borderColor: "var(--border)",
          background: expanded ? "rgba(0,212,255,0.04)" : index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--muted)" }}>
          <span className="flex items-center gap-1">
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {index + 1}
          </span>
        </td>
        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--muted)" }}>
          {time}
        </td>
        <td className="px-4 py-3">
          <AlertBadge label={alert.label} />
        </td>
        <td className="px-4 py-3">
          <SeverityBadge severity={alert.severity} />
        </td>
        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text)" }}>
          {Math.round(alert.confidence * 100)}%
        </td>
        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--muted)" }}>
          {alert.source_ip || "—"}
        </td>
        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--muted)" }}>
          {alert.destination_ip || "—"}
        </td>
        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--muted)" }}>
          {alert.protocol || "—"}
        </td>
        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--muted)" }}>
          {alert.id?.slice(0, 8)}…
        </td>
      </tr>

      {/* Expanded Row — Ensemble Detail + Feature Values */}
      {expanded && (
        <tr style={{ background: "rgba(0,212,255,0.03)" }}>
          <td colSpan={9} className="px-6 pb-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ensemble Votes */}
              <div>
                <p
                  className="text-xs font-mono uppercase tracking-widest mb-2"
                  style={{ color: "var(--muted)" }}
                >
                  Ensemble Model Votes
                </p>
                <div className="space-y-2">
                  {[
                    { name: "Random Forest", vote: rfVote, weight: "50%" },
                    { name: "Isolation Forest", vote: ifVote, weight: "30%" },
                    { name: "LSTM Autoencoder", vote: lstmVote, weight: "20%" },
                  ].map(({ name, vote, weight }) => (
                    <div
                      key={name}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      <span style={{ color: "var(--muted)" }}>{name}</span>
                      <span style={{ color: "var(--border)" }}>weight: {weight}</span>
                      <AlertBadge label={vote?.label || "—"} />
                      <span style={{ color: "var(--text)" }}>
                        {vote ? `${(vote.confidence * 100).toFixed(1)}%` : "—"}
                      </span>
                    </div>
                  ))}
                  <div
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono"
                    style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.2)" }}
                  >
                    <span style={{ color: "var(--accent)" }}>Ensemble Score</span>
                    <span className="font-bold" style={{ color: "var(--accent)" }}>
                      {alert.ensemble_votes?.ensemble_score ?? "—"}
                    </span>
                  </div>
                </div>

                {/* LSTM specific */}
                {lstmVote?.reconstruction_error !== undefined && (
                  <div className="mt-2 text-xs font-mono" style={{ color: "var(--muted)" }}>
                    LSTM reconstruction error:{" "}
                    <span style={{ color: "var(--text)" }}>
                      {lstmVote.reconstruction_error.toFixed(6)}
                    </span>{" "}
                    / threshold:{" "}
                    <span style={{ color: "var(--text)" }}>
                      {lstmVote.threshold?.toFixed(6)}
                    </span>
                  </div>
                )}
              </div>

              {/* Feature Values */}
              {alert.features && Object.keys(alert.features).length > 0 && (
                <div>
                  <p
                    className="text-xs font-mono uppercase tracking-widest mb-2"
                    style={{ color: "var(--muted)" }}
                  >
                    Input Features
                  </p>
                  <div
                    className="rounded-lg p-3 max-h-48 overflow-y-auto"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  >
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(alert.features)
                        .slice(0, 20)
                        .map(([k, v]) => (
                          <div key={k} className="flex justify-between text-xs font-mono">
                            <span style={{ color: "var(--muted)" }}>{k}:</span>
                            <span style={{ color: "var(--accent)" }}>
                              {typeof v === "number" ? v.toFixed(2) : String(v)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Logs Page ───────────────────────────────────────────────────────────
export default function LogsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAlerts({ limit: 200 });
      setAlerts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filter by search query (label, IP, severity, ID)
  const filteredAlerts = alerts.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.label?.toLowerCase().includes(q) ||
      a.severity?.toLowerCase().includes(q) ||
      a.source_ip?.toLowerCase().includes(q) ||
      a.destination_ip?.toLowerCase().includes(q) ||
      a.id?.toLowerCase().includes(q) ||
      a.protocol?.toLowerCase().includes(q)
    );
  });

  // Export logs as JSON
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(alerts, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cybershield-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as CSV
  const exportCSV = () => {
    const headers = ["id", "timestamp", "label", "severity", "confidence", "source_ip", "destination_ip", "protocol"];
    const rows = alerts.map((a) =>
      headers.map((h) => `"${a[h] ?? ""}"`).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cybershield-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-6 grid-bg" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Log Viewer</h1>
          <p className="text-sm font-mono mt-0.5" style={{ color: "var(--muted)" }}>
            Full raw log data with ensemble vote details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}
          >
            <RefreshCw size={13} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono"
            style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "var(--accent)" }}
          >
            <Download size={13} />
            CSV
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono"
            style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "var(--accent)" }}
          >
            <Download size={13} />
            JSON
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by label, IP, severity, ID, protocol…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm font-mono"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            outline: "none",
          }}
        />
      </div>

      {/* Stats Strip */}
      <div className="flex gap-4 mb-4 text-xs font-mono" style={{ color: "var(--muted)" }}>
        <span>
          Showing{" "}
          <span style={{ color: "var(--accent)" }}>{filteredAlerts.length}</span> /{" "}
          {alerts.length} logs
        </span>
        <span>•</span>
        <span>
          Click any row to expand ensemble details
        </span>
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

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={32} />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <EmptyState message="No logs found" icon={ScrollText} />
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                  {["#", "Timestamp", "Label", "Severity", "Confidence", "Source IP", "Dest IP", "Protocol", "ID"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-mono uppercase tracking-widest"
                        style={{ color: "var(--muted)" }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert, i) => (
                  <LogRow key={alert.id} alert={alert} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
