/**
 * Dashboard Page
 * Real-time stats, threat timeline chart, and live alert feed.
 */

import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Shield, AlertTriangle, Activity, Zap, RefreshCw } from "lucide-react";
import { getStats, getHealth } from "../services/api";
import { useRealTimeAlerts } from "../hooks/useRealTimeAlerts";
import {
  StatCard, AlertCard, ConnectionStatus, Spinner, EmptyState, SectionHeader,
} from "../components/UIComponents";

// Custom chart tooltip
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs font-mono border"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <p className="mb-1" style={{ color: "var(--muted)" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { alerts, connected, clearFeed } = useRealTimeAlerts();

  const fetchData = async () => {
    try {
      const [statsData, healthData] = await Promise.all([getStats(), getHealth()]);
      setStats(statsData);
      setHealth(healthData);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh stats every 10 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Pie chart data
  const pieData = stats
    ? [
        { name: "Normal", value: stats.normal_count, color: "#00ff88" },
        { name: "Suspicious", value: stats.suspicious_count, color: "#ffcc00" },
        { name: "Malicious", value: stats.malicious_count, color: "#ff3860" },
      ].filter((d) => d.value > 0)
    : [];

  // Severity bar chart
  const severityData = stats
    ? [
        { name: "Critical", count: stats.critical_count, fill: "#ff3860" },
        { name: "High", count: stats.high_count, fill: "#ff6b35" },
        { name: "Medium", count: stats.medium_count, fill: "#ffcc00" },
        { name: "Low", count: stats.low_count, fill: "#00d4ff" },
      ]
    : [];

  // Timeline area chart
  const timelineData = stats?.timeline
    ? stats.timeline.map((t, i) => ({
        time: new Date(t.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        value: t.label === "Malicious" ? 3 : t.label === "Suspicious" ? 2 : 1,
        label: t.label,
      }))
    : [];

  return (
    <div className="min-h-screen p-6 grid-bg" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Threat Dashboard</h1>
          <p className="text-sm font-mono mt-0.5" style={{ color: "var(--muted)" }}>
            Real-time cybersecurity monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionStatus connected={connected} />
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-colors"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--muted)",
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Health Banner */}
      {health && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 text-sm font-mono"
          style={{
            background: health.model_loaded ? "rgba(0,255,136,0.06)" : "rgba(255,56,96,0.06)",
            border: `1px solid ${health.model_loaded ? "rgba(0,255,136,0.2)" : "rgba(255,56,96,0.2)"}`,
          }}
        >
          <span
            className="status-dot w-2 h-2 rounded-full inline-block"
            style={{ background: health.model_loaded ? "var(--green)" : "var(--red)" }}
          />
          <span style={{ color: health.model_loaded ? "var(--green)" : "var(--red)" }}>
            {health.status.toUpperCase()}
          </span>
          <span style={{ color: "var(--muted)" }}>—</span>
          <span style={{ color: "var(--muted)" }}>{health.model_type}</span>
          <span className="ml-auto" style={{ color: "var(--muted)" }}>
            {new Date(health.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}

      {error && (
        <div
          className="px-4 py-3 rounded-xl mb-6 text-sm font-mono"
          style={{ background: "rgba(255,56,96,0.1)", border: "1px solid rgba(255,56,96,0.3)", color: "#ff3860" }}
        >
          ⚠️ Backend unreachable: {error}. Make sure the backend is running on port 8000.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size={32} />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Analyzed"
              value={stats?.total_analyzed ?? 0}
              icon={Activity}
              color="var(--accent)"
              subtitle="all time"
            />
            <StatCard
              title="Malicious"
              value={stats?.malicious_count ?? 0}
              icon={AlertTriangle}
              color="#ff3860"
              subtitle="detected threats"
            />
            <StatCard
              title="Suspicious"
              value={stats?.suspicious_count ?? 0}
              icon={Zap}
              color="#ffcc00"
              subtitle="need investigation"
            />
            <StatCard
              title="Normal"
              value={stats?.normal_count ?? 0}
              icon={Shield}
              color="#00ff88"
              subtitle="clean traffic"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Timeline Area Chart */}
            <div
              className="lg:col-span-2 rounded-xl p-5 border"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <SectionHeader
                title="Threat Timeline"
                subtitle="Recent detection history (1=Normal, 2=Suspicious, 3=Malicious)"
              />
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="threatGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff3860" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff3860" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="time" stroke="var(--muted)" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                  <YAxis stroke="var(--muted)" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} domain={[0, 3]} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Threat Level"
                    stroke="#ff3860"
                    fill="url(#threatGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div
              className="rounded-xl p-5 border"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <SectionHeader title="Traffic Distribution" />
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      formatter={(value, entry) => (
                        <span style={{ color: entry.color, fontFamily: "IBM Plex Mono", fontSize: 11 }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No analysis data yet" />
              )}
            </div>
          </div>

          {/* Severity Bar + Live Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Severity Bar Chart */}
            <div
              className="rounded-xl p-5 border"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <SectionHeader title="Severity Breakdown" />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={severityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted)" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--muted)"
                    tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }}
                    width={60}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                    {severityData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Live Alert Feed */}
            <div
              className="rounded-xl p-5 border"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <SectionHeader
                title="Live Alert Feed"
                subtitle={`${alerts.length} alert(s)`}
                action={
                  alerts.length > 0 && (
                    <button
                      onClick={clearFeed}
                      className="text-xs font-mono px-2 py-1 rounded"
                      style={{ color: "var(--muted)", background: "var(--border)" }}
                    >
                      Clear
                    </button>
                  )
                }
              />
              <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {alerts.length === 0 ? (
                  <EmptyState message="No alerts yet — waiting for threats..." />
                ) : (
                  alerts.slice(0, 5).map((alert, i) => (
                    <AlertCard key={alert.id} alert={alert} isNew={i === 0} />
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
