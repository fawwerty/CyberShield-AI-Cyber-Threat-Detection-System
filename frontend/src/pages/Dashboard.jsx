/**
 * Dashboard Page
 * Real-time stats, threat timeline chart, and live alert feed.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Shield, AlertTriangle, Activity, Zap, RefreshCw, Layers, TrendingUp } from "lucide-react";
import { getStats, getHealth } from "../services/api";
import { useRealTimeAlerts } from "../hooks/useRealTimeAlerts";
import {
  StatCard, AlertCard, ConnectionStatus, Spinner, EmptyState, SectionHeader,
} from "../components/UIComponents";

// Custom chart tooltip
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 border-accent/20 shadow-xl">
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <p className="text-xs font-bold" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        </div>
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
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const pieData = stats
    ? [
        { name: "Clean", value: stats.normal_count, color: "var(--green)" },
        { name: "Suspicious", value: stats.suspicious_count, color: "var(--yellow)" },
        { name: "Malicious", value: stats.malicious_count, color: "var(--red)" },
      ].filter((d) => d.value > 0)
    : [];

  const timelineData = stats?.timeline
    ? stats.timeline.map((t) => ({
        time: new Date(t.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        value: t.label === "Malicious" ? 3 : t.label === "Suspicious" ? 2 : 1,
      }))
    : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Spinner size={40} />
        <p className="text-xs font-bold uppercase tracking-widest text-text-dim animate-pulse">Initializing Neural Defense...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-8 max-w-[1600px] mx-auto"
    >
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-extrabold tracking-tight font-display">Command Center</h1>
            <div className="h-6 w-px bg-card-border mx-2 hidden md:block" />
            <ConnectionStatus connected={connected} />
          </div>
          <p className="text-sm font-medium text-text-muted">
            Ensemble AI Threat Detection Interface <span className="text-text-dim ml-2 opacity-50">v1.0.4</span>
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={fetchData}
            className="btn-primary py-2 text-xs"
          >
            <RefreshCw size={14} /> Refresh Node
          </button>
        </motion.div>
      </div>

      {health && !health.model_loaded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="glass-card mb-8 px-5 py-4 border-red-500/20 bg-red-500/5 flex items-center gap-4"
        >
          <AlertTriangle className="text-red-500" size={20} />
          <div>
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-0.5">Model Deployment Error</p>
            <p className="text-[11px] text-red-500/70 font-medium">Neural engine offline. Please verify deployment environment.</p>
          </div>
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Column: Stats & Main Chart */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* Stat Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Global Throttling"
              value={stats?.total_analyzed ?? 0}
              icon={Layers}
              color="var(--accent)"
              subtitle="packets analyzed"
            />
            <StatCard
              title="Threats Caught"
              value={stats?.malicious_count ?? 0}
              icon={AlertTriangle}
              color="var(--red)"
              subtitle="neutralized"
            />
            <StatCard
              title="Anomalies"
              value={stats?.suspicious_count ?? 0}
              icon={Zap}
              color="var(--yellow)"
              subtitle="pending review"
            />
          </div>

          {/* Large Timeline Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            <SectionHeader
              title="Detection Velocity"
              subtitle="Threat presence mapped over time"
              action={
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-full">
                  <TrendingUp size={12} /> Live Trend
                </div>
              }
            />
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="time" 
                    hide 
                  />
                  <YAxis 
                    domain={[0, 4]} 
                    ticks={[1, 2, 3]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "var(--text-dim)", fontWeight: 'bold' }}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--accent)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--accent)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Distribution & Feed */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          
          {/* Distribution Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8 min-h-[400px]"
          >
            <SectionHeader title="Label Integrity" subtitle="Model classification ratio" />
            <div className="h-[240px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Shield size={32} className="text-text-dim opacity-20 mb-1" />
                <span className="text-xl font-extrabold font-display">99.8%</span>
                <span className="text-[9px] font-bold uppercase tracking-tighter text-text-dim">Secured</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {pieData.map(d => (
                <div key={d.name} className="glass-card p-2 text-center border-none bg-surface/30">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-text-dim mb-0.5">{d.name}</p>
                  <p className="text-xs font-bold" style={{ color: d.color }}>{d.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Live Alert Feed */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 h-[600px] flex flex-col"
          >
            <SectionHeader
              title="Live Telemetry"
              subtitle={`${alerts.length} signals monitored`}
              action={
                alerts.length > 0 && (
                  <button
                    onClick={clearFeed}
                    className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-card-border hover:bg-red-500/10 hover:text-red-500 transition-all"
                  >
                    Wipe
                  </button>
                )
              }
            />
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {alerts.length === 0 ? (
                <EmptyState message="System secure. Awaiting signals..." icon={Activity} />
              ) : (
                <AnimatePresence mode="popLayout">
                  {alerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

