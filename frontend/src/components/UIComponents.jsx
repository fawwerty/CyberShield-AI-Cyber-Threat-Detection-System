/**
 * Shared UI Components
 * All reusable building blocks for the CyberShield dashboard.
 */

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Shield, Activity, Wifi, WifiOff, CheckCircle2 } from "lucide-react";

// ─── Severity Config ──────────────────────────────────────────────────────────
export const SEVERITY_CONFIG = {
  critical: { color: "var(--red)", bg: "rgba(239, 68, 68, 0.1)", label: "CRITICAL", icon: "🔴" },
  high: { color: "var(--orange)", bg: "rgba(249, 115, 22, 0.1)", label: "HIGH", icon: "🟠" },
  medium: { color: "var(--yellow)", bg: "rgba(245, 158, 11, 0.1)", label: "MEDIUM", icon: "🟡" },
  low: { color: "var(--accent)", bg: "rgba(99, 102, 241, 0.1)", label: "LOW", icon: "🔵" },
  none: { color: "var(--green)", bg: "rgba(16, 185, 129, 0.1)", label: "NONE", icon: "🟢" },
};

export const LABEL_CONFIG = {
  Malicious: { color: "var(--red)", bg: "rgba(239, 68, 68, 0.1)", glow: "shadow-red-500/20" },
  Suspicious: { color: "var(--yellow)", bg: "rgba(245, 158, 11, 0.1)", glow: "shadow-amber-500/20" },
  Normal: { color: "var(--green)", bg: "rgba(16, 185, 129, 0.1)", glow: "shadow-emerald-500/20" },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ title, value, icon: Icon, color, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="glass-card p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-3">
            {title}
          </p>
          <p className="text-3xl font-extrabold font-display leading-none mb-2" style={{ color }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-text-muted font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon size={22} style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Alert Badge ─────────────────────────────────────────────────────────────
export function AlertBadge({ label }) {
  const cfg = LABEL_CONFIG[label] || LABEL_CONFIG.Normal;
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: `${cfg.color}30` }}
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
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: `${cfg.color}30` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
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
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
          Threat Confidence
        </span>
        <span className="text-sm font-bold font-mono" style={{ color: cfg.color }}>
          {pct}%
        </span>
      </div>
      <div className="w-full h-2 bg-surface border border-card-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${cfg.color}80, ${cfg.color})`, boxShadow: `0 0 10px ${cfg.color}40` }}
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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`glass-card p-5 mb-4 group transition-all duration-300 relative overflow-hidden`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b" style={{ background: severityCfg.color }} />
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${severityCfg.color}10`, border: `1px solid ${severityCfg.color}20` }}>
            <span className="text-lg">{severityCfg.icon}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <AlertBadge label={alert.label} />
              <SeverityBadge severity={alert.severity} />
            </div>
            <div className="flex gap-4 text-[11px] font-medium text-text-dim">
              {alert.source_ip && <span className="flex items-center gap-1.5"><Globe size={12} /> {alert.source_ip}</span>}
              {alert.protocol && <span className="uppercase">{alert.protocol}</span>}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
            {time}
          </p>
          <p className="text-xl font-bold font-display mt-1" style={{ color: severityCfg.color }}>
            {Math.round(alert.confidence * 100)}%
          </p>
        </div>
      </div>

      {/* Ensemble votes mini display */}
      {alert.ensemble_votes && (
        <div
          className="mt-5 pt-4 grid grid-cols-3 gap-3 border-t border-card-border"
        >
          {Object.entries(alert.ensemble_votes).map(([model, data]) => {
            const modelName = model.split('_').map(w => w[0].toUpperCase()).join('');
            const label = data.label || "Normal";
            const cfg = LABEL_CONFIG[label] || LABEL_CONFIG.Normal;
            return (
              <div key={model} className="text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-text-dim mb-1">
                  {modelName}
                </p>
                <p className="text-[10px] font-bold" style={{ color: cfg.color }}>
                  {label}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Connection Status ────────────────────────────────────────────────────────
export function ConnectionStatus({ connected }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest glass-card"
      style={{
        background: connected ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)",
        borderColor: connected ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
        color: connected ? "var(--green)" : "var(--red)",
      }}
    >
      <div className={connected ? "pulse-dot bg-emerald-500" : "w-2 h-2 rounded-full bg-red-500"} />
      {connected ? "Live System" : "Offline"}
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function Spinner({ size = 24, color = "var(--accent)" }) {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: size, height: size, border: `2px solid ${color}20`, borderTop: `2px solid ${color}`, borderRadius: "50%" }}
      />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ message = "No data yet", icon: Icon = Shield }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6 glass-card border-dashed">
      <div className="w-20 h-20 rounded-3xl bg-surface flex items-center justify-center border border-card-border">
        <Icon size={32} className="text-text-dim" />
      </div>
      <p className="text-sm font-medium text-text-muted">
        {message}
      </p>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight font-display">{title}</h2>
        {subtitle && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mt-1.5">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

