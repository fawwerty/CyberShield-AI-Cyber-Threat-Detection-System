/**
 * Analyze Page
 * Two modes:
 *   1. Manual Feature Input — enter feature values and analyze one record
 *   2. CSV Batch Upload     — upload a preprocessed CSV for bulk analysis
 */

import React, { useState, useRef } from "react";
import { Upload, Zap, FileText, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { analyzeRecord, analyzeBatch } from "../services/api";
import {
  AlertCard, Spinner, ConfidenceBar, SectionHeader, AlertBadge, SeverityBadge,
} from "../components/UIComponents";

// Default feature template (matches the 20 FINAL_FEATURES from preprocessing)
const DEFAULT_FEATURES = {
  duration: 0.5,
  protocol_type: 1,
  src_bytes: 1024,
  dst_bytes: 512,
  land: 0,
  wrong_fragment: 0,
  urgent: 0,
  hot: 1,
  num_failed_logins: 0,
  logged_in: 1,
  num_compromised: 0,
  root_shell: 0,
  su_attempted: 0,
  num_root: 0,
  num_file_creations: 0,
  num_shells: 0,
  num_access_files: 1,
  count: 10,
  srv_count: 10,
  dst_host_count: 50,
};

// Quick-fill presets for testing
const PRESETS = {
  "Normal Traffic": {
    duration: 0.5, protocol_type: 1, src_bytes: 1024, dst_bytes: 2048,
    land: 0, wrong_fragment: 0, urgent: 0, hot: 1, num_failed_logins: 0,
    logged_in: 1, num_compromised: 0, root_shell: 0, su_attempted: 0,
    num_root: 0, num_file_creations: 0, num_shells: 0, num_access_files: 1,
    count: 10, srv_count: 10, dst_host_count: 50,
  },
  "Port Scan": {
    duration: 0.01, protocol_type: 0, src_bytes: 40, dst_bytes: 0,
    land: 0, wrong_fragment: 0, urgent: 0, hot: 0, num_failed_logins: 10,
    logged_in: 0, num_compromised: 0, root_shell: 0, su_attempted: 0,
    num_root: 0, num_file_creations: 0, num_shells: 0, num_access_files: 0,
    count: 511, srv_count: 1, dst_host_count: 255,
  },
  "DoS Attack": {
    duration: 0, protocol_type: 0, src_bytes: 0, dst_bytes: 0,
    land: 0, wrong_fragment: 3, urgent: 0, hot: 0, num_failed_logins: 0,
    logged_in: 0, num_compromised: 0, root_shell: 0, su_attempted: 0,
    num_root: 0, num_file_creations: 0, num_shells: 0, num_access_files: 0,
    count: 511, srv_count: 511, dst_host_count: 255,
  },
  "Root Exploit": {
    duration: 2.3, protocol_type: 1, src_bytes: 9879, dst_bytes: 8001,
    land: 0, wrong_fragment: 0, urgent: 0, hot: 28, num_failed_logins: 0,
    logged_in: 1, num_compromised: 235, root_shell: 1, su_attempted: 0,
    num_root: 235, num_file_creations: 1, num_shells: 2, num_access_files: 1,
    count: 1, srv_count: 1, dst_host_count: 1,
  },
};

// ─── Single Record Analysis Form ──────────────────────────────────────────────
function SingleAnalyzeForm() {
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [meta, setMeta] = useState({ source_ip: "", destination_ip: "", protocol: "TCP" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeRecord(features, meta);
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (presetName) => {
    setFeatures({ ...PRESETS[presetName] });
  };

  const featureEntries = Object.entries(features);
  const visibleFeatures = showAllFeatures ? featureEntries : featureEntries.slice(0, 8);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Input Form */}
      <div
        className="rounded-xl p-6 border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <SectionHeader title="Feature Input" subtitle="Enter network traffic features for analysis" />

        {/* Quick Presets */}
        <div className="mb-4">
          <p className="text-xs font-mono mb-2" style={{ color: "var(--muted)" }}>
            QUICK PRESETS
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(PRESETS).map((preset) => (
              <button
                key={preset}
                onClick={() => applyPreset(preset)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
                style={{
                  background: "var(--border)",
                  color: "var(--muted)",
                  border: "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                  e.target.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = "transparent";
                  e.target.style.color = "var(--muted)";
                }}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Meta Fields */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { key: "source_ip", label: "Source IP", placeholder: "192.168.1.5" },
            { key: "destination_ip", label: "Dest IP", placeholder: "10.0.0.1" },
            { key: "protocol", label: "Protocol", placeholder: "TCP" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-mono mb-1" style={{ color: "var(--muted)" }}>
                {label}
              </label>
              <input
                value={meta[key]}
                onChange={(e) => setMeta({ ...meta, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  outline: "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* Feature Fields */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {visibleFeatures.map(([key, val]) => (
            <div key={key}>
              <label className="block text-xs font-mono mb-1 truncate" style={{ color: "var(--muted)" }} title={key}>
                {key}
              </label>
              <input
                type="number"
                value={val}
                onChange={(e) =>
                  setFeatures({ ...features, [key]: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--accent)",
                  outline: "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* Toggle show more */}
        <button
          onClick={() => setShowAllFeatures(!showAllFeatures)}
          className="flex items-center gap-1 text-xs font-mono mb-4"
          style={{ color: "var(--muted)" }}
        >
          {showAllFeatures ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showAllFeatures ? "Show less" : `Show all ${featureEntries.length} features`}
        </button>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{
            background: loading ? "var(--border)" : "rgba(0,212,255,0.15)",
            border: `1px solid ${loading ? "transparent" : "rgba(0,212,255,0.4)"}`,
            color: loading ? "var(--muted)" : "var(--accent)",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? <Spinner size={16} /> : <Zap size={16} />}
          {loading ? "Analyzing..." : "Analyze Traffic"}
        </button>

        {error && (
          <p className="mt-3 text-xs font-mono text-center" style={{ color: "#ff3860" }}>
            ❌ {error}
          </p>
        )}
      </div>

      {/* Right: Result */}
      <div>
        {result ? (
          <div
            className="rounded-xl p-6 border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <SectionHeader title="Analysis Result" />

            <div className="flex items-center gap-3 mb-5">
              <AlertBadge label={result.label} />
              <SeverityBadge severity={result.severity} />
            </div>

            <ConfidenceBar value={result.confidence} label={result.label} />

            {/* Ensemble Votes Detail */}
            <div className="mt-5 space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                Ensemble Model Votes
              </p>
              {Object.entries(result.ensemble_votes || {})
                .filter(([k]) => k !== "ensemble_score")
                .map(([model, vote]) => (
                  <div
                    key={model}
                    className="flex items-center justify-between px-4 py-3 rounded-lg"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <span className="text-xs font-mono capitalize" style={{ color: "var(--muted)" }}>
                      {model.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-3">
                      <AlertBadge label={vote.label} />
                      <span className="text-xs font-mono" style={{ color: "var(--text)" }}>
                        {(vote.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              <div
                className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.2)" }}
              >
                <span className="text-xs font-mono" style={{ color: "var(--accent)" }}>
                  Ensemble Score
                </span>
                <span className="text-sm font-mono font-bold" style={{ color: "var(--accent)" }}>
                  {result.ensemble_votes?.ensemble_score}
                </span>
              </div>
            </div>

            {/* Meta */}
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs font-mono">
              <div style={{ color: "var(--muted)" }}>
                ID: <span style={{ color: "var(--text)" }}>{result.id?.slice(0, 12)}…</span>
              </div>
              <div style={{ color: "var(--muted)" }}>
                Time: <span style={{ color: "var(--text)" }}>{new Date(result.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl p-6 border h-full flex flex-col items-center justify-center gap-4"
            style={{ background: "var(--card)", borderColor: "var(--border)", minHeight: 400 }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)" }}
            >
              <Zap size={28} color="var(--accent)" />
            </div>
            <p className="text-sm font-mono text-center" style={{ color: "var(--muted)" }}>
              Fill in the features and click<br />"Analyze Traffic" to see results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Batch CSV Upload ──────────────────────────────────────────────────────────
function BatchUploadForm() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(10);

    try {
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 85));
      }, 800);
      const res = await analyzeBatch(file);
      clearInterval(progressInterval);
      setProgress(100);
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload Zone */}
      <div
        className="rounded-xl p-6 border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <SectionHeader title="Batch CSV Upload" subtitle="Upload a preprocessed traffic CSV (max 1000 rows)" />

        {/* Drop Zone */}
        <div
          className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 mb-4"
          style={{ borderColor: file ? "var(--accent)" : "var(--border)", background: file ? "rgba(0,212,255,0.04)" : "transparent" }}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile?.name.endsWith(".csv")) setFile(droppedFile);
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            hidden
            onChange={(e) => setFile(e.target.files[0])}
          />
          {file ? (
            <>
              <CheckCircle size={32} color="var(--accent)" className="mx-auto mb-3" />
              <p className="font-mono text-sm" style={{ color: "var(--accent)" }}>
                {file.name}
              </p>
              <p className="text-xs font-mono mt-1" style={{ color: "var(--muted)" }}>
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </>
          ) : (
            <>
              <Upload size={32} color="var(--muted)" className="mx-auto mb-3" />
              <p className="text-sm font-mono" style={{ color: "var(--muted)" }}>
                Drop CSV here or click to browse
              </p>
              <p className="text-xs font-mono mt-1" style={{ color: "var(--border)" }}>
                Accepts preprocessed CICIDS2017 or UNSW-NB15 CSV
              </p>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {loading && (
          <div className="mb-4">
            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: "var(--accent)" }}
              />
            </div>
            <p className="text-xs font-mono mt-1 text-center" style={{ color: "var(--muted)" }}>
              Analyzing… {progress}%
            </p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
          style={{
            background: !file || loading ? "var(--border)" : "rgba(0,212,255,0.15)",
            border: `1px solid ${!file || loading ? "transparent" : "rgba(0,212,255,0.4)"}`,
            color: !file || loading ? "var(--muted)" : "var(--accent)",
            cursor: !file || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? <Spinner size={16} /> : <Upload size={16} />}
          {loading ? "Processing..." : "Analyze Batch"}
        </button>

        {error && (
          <p className="mt-3 text-xs font-mono text-center" style={{ color: "#ff3860" }}>
            ❌ {error}
          </p>
        )}
      </div>

      {/* Batch Result */}
      {result && (
        <div
          className="rounded-xl p-6 border"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <SectionHeader title="Batch Results" subtitle={`${result.total_analyzed} records analyzed`} />
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Total", value: result.total_analyzed, color: "var(--accent)" },
              { label: "Threats", value: result.threats_detected, color: "#ff3860" },
              { label: "Normal", value: result.normal_count, color: "#00ff88" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-lg p-3 text-center"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <p className="text-2xl font-bold font-mono" style={{ color }}>
                  {value}
                </p>
                <p className="text-xs font-mono mt-1" style={{ color: "var(--muted)" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
          {/* Show first 5 threats */}
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {result.results
              .filter((r) => r.label !== "Normal")
              .slice(0, 10)
              .map((r) => (
                <AlertCard key={r.id} alert={r} />
              ))}
            {result.results.filter((r) => r.label !== "Normal").length === 0 && (
              <div
                className="flex items-center justify-center gap-2 py-8 text-sm font-mono"
                style={{ color: "#00ff88" }}
              >
                ✅ No threats detected in batch!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AnalyzePage() {
  const [tab, setTab] = useState("single");

  return (
    <div className="min-h-screen p-6 grid-bg" style={{ background: "var(--bg)" }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Traffic Analyzer</h1>
        <p className="text-sm font-mono mt-0.5" style={{ color: "var(--muted)" }}>
          Analyze network traffic for threats using the ensemble model
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "single", label: "Single Record", icon: Zap },
          { id: "batch", label: "Batch CSV Upload", icon: FileText },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: tab === id ? "rgba(0,212,255,0.12)" : "var(--card)",
              border: `1px solid ${tab === id ? "rgba(0,212,255,0.3)" : "var(--border)"}`,
              color: tab === id ? "var(--accent)" : "var(--muted)",
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "single" ? <SingleAnalyzeForm /> : <BatchUploadForm />}
    </div>
  );
}
