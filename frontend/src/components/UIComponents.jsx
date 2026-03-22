/**
 * Shared UI Components
 * All reusable building blocks for the CyberShield dashboard.
 */

import React from "react";
import { AlertTriangle, Shield, Activity, Wifi, WifiOff } from "lucide-react";

// ─── Severity Config ──────────────────────────────────────────────────────────
export const SEVERITY_CONFIG = {
  critical: { color: "#ff3860", bg: "rgba(255,56,96,0.12)", label: "CRITICAL", icon: "🔴" },
  high: { color: "#ff6b35", bg: "rgba(255,107,53,0.12)", label: "HIGH", icon: "🟠" },
  medium: { color: "#ffcc00", bg: "rgba(255,204,0,0.12)", label: "MEDIUM", icon: "🟡" },
  low: { color: "#00d4ff", bg: "rgba(0,212,255,0.12)", label: "LOW", icon: "🔵" },
  none: { color: "#00ff88", bg: "rgba(0,255,136,0.08)", label: "NONE", icon: "🟢" },
};

export const LABEL_CONFIG = {
  Malicious: { color: "#ff3860", bg: "rgba(255,56,96,0.15)", glow: "glow-red" },
  Suspicious: { color: "#ffcc00", bg: "rgba(255,204,0,0.12)", glow: "" },
  Normal: { color: "#00ff88", bg: "rgba(0,255,136,0.08)", glow: "glow-green" },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ title, value, icon: Icon, color, subtitle }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-5 border"
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
            {title}
          </p>
          <p className="text-3xl font-bold font-mono" style={{ color }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20` }}
        >
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  );
}

// ─── Alert Badge ─────────────────────────────────────────────────────────────
export function AlertBadge({ label }) {
  const cfg = LABEL_CONFIG[label] || LABEL_CONFIG.Normal;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-semibold uppercase tracking-wider"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {label}
    </span>
  );
}

// ─── Severity Badge ───────────────────────────────────────────────────────────
export function SeverityBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.none;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium uppercase"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────
export function ConfidenceBar({ value, label }) {
  const pct = Math.round(value * 100);
  const cfg = LABEL_CONFIG[label] || LABEL_CONFIG.Normal;
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
          Confidence
        </span>
        <span className="text-xs font-mono font-semibold" style={{ color: cfg.color }}>
          {pct}%
        </span>
      </div>
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--border)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: cfg.color }}
        />
      </div>
    </div>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────
export function AlertCard({ alert, isNew = false }) {
  const severityCfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.none;
  const time = new Date(alert.timestamp).toLocaleTimeString();

  return (
    <div
      className={`rounded-xl p-4 border transition-all duration-300 ${isNew ? "alert-new" : ""}`}
      style={{
        background: severityCfg.bg,
        borderColor: `${severityCfg.color}40`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-lg mt-0.5 flex-shrink-0">{severityCfg.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <AlertBadge label={alert.label} />
              <SeverityBadge severity={alert.severity} />
            </div>
            <div className="flex gap-4 text-xs font-mono" style={{ color: "var(--muted)" }}>
              {alert.source_ip && <span>SRC: {alert.source_ip}</span>}
              {alert.destination_ip && <span>DST: {alert.destination_ip}</span>}
              {alert.protocol && <span>{alert.protocol}</span>}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>
            {time}
          </p>
          <p className="text-sm font-mono font-semibold mt-1" style={{ color: severityCfg.color }}>
            {Math.round(alert.confidence * 100)}%
          </p>
        </div>
      </div>

      {/* Ensemble votes mini display */}
      {alert.ensemble_votes && (
        <div
          className="mt-3 pt-3 grid grid-cols-3 gap-2 text-center border-t"
          style={{ borderColor: `${severityCfg.color}20` }}
        >
          {[
            ["RF", alert.ensemble_votes.random_forest],
            ["IF", alert.ensemble_votes.isolation_forest],
            ["LSTM", alert.ensemble_votes.lstm_autoencoder],
          ].map(([name, vote]) => (
            <div key={name}>
              <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                {name}
              </p>
              <p
                className="text-xs font-mono font-semibold"
                style={{ color: LABEL_CONFIG[vote?.label]?.color || "var(--muted)" }}
              >
                {vote?.label || "—"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Connection Status ────────────────────────────────────────────────────────
export function ConnectionStatus({ connected }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
      style={{
        background: connected ? "rgba(0,255,136,0.1)" : "rgba(255,56,96,0.1)",
        border: `1px solid ${connected ? "rgba(0,255,136,0.3)" : "rgba(255,56,96,0.3)"}`,
        color: connected ? "#00ff88" : "#ff3860",
      }}
    >
      {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
      {connected ? "LIVE" : "POLLING"}
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function Spinner({ size = 24, color = "var(--accent)" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: "spin 1s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ message = "No data yet", icon: Icon = Shield }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)" }}
      >
        <Icon size={28} color="var(--accent)" />
      </div>
      <p className="text-sm font-mono" style={{ color: "var(--muted)" }}>
        {message}
      </p>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold tracking-wide">{title}</h2>
        {subtitle && (
          <p className="text-xs font-mono mt-0.5" style={{ color: "var(--muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
