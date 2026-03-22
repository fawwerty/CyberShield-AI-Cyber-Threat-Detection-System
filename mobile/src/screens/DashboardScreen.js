/**
 * Mobile Dashboard Screen
 * Uses simple React Native Views for charts instead of react-native-chart-kit
 * to avoid native module dependencies.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from "react-native";
import { getStats, getHealth, getAlerts } from "../services/api";
import { colors } from "../components/theme";
import {
  StatCard, AlertCard, EmptyState, SectionHeader,
} from "../components/UIComponents";

// Simple bar component — no native deps
function SimpleBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[barStyles.count, { color }]}>{value}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  label: { width: 72, fontSize: 11, fontFamily: "monospace", color: colors.muted },
  track: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden", marginHorizontal: 10 },
  fill: { height: "100%", borderRadius: 4 },
  count: { fontSize: 12, fontFamily: "monospace", fontWeight: "700", width: 40, textAlign: "right" },
});

export default function DashboardScreen() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [statsData, healthData, alertsData] = await Promise.all([
        getStats(), getHealth(), getAlerts({ limit: 5 }),
      ]);
      setStats(statsData);
      setHealth(healthData);
      setRecentAlerts(Array.isArray(alertsData) ? alertsData : []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.loadingText}>Loading CyberShield Dashboard...</Text>
    </View>
  );

  const total = stats?.total_analyzed || 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Real-time threat monitoring</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: health?.model_loaded ? colors.green : colors.red }]} />
      </View>

      {/* Health Banner */}
      {health && (
        <View style={[styles.banner, {
          backgroundColor: health.model_loaded ? `${colors.green}12` : `${colors.red}12`,
          borderColor: health.model_loaded ? `${colors.green}33` : `${colors.red}33`,
        }]}>
          <Text style={{ color: health.model_loaded ? colors.green : colors.red, fontFamily: "monospace", fontSize: 11 }}>
            {health.model_loaded ? "✅ MODEL LOADED" : "⚠️ MODEL NOT LOADED"} — {health.status.toUpperCase()}
          </Text>
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ Cannot reach backend: {error}</Text>
          <Text style={styles.errorHint}>Make sure backend is running on port 8000</Text>
        </View>
      )}

      {/* Stat Cards */}
      <View style={styles.statsRow}>
        <StatCard title="Total" value={stats?.total_analyzed ?? 0} color={colors.accent} icon="📊" />
        <StatCard title="Malicious" value={stats?.malicious_count ?? 0} color={colors.red} icon="🚨" />
      </View>
      <View style={[styles.statsRow, { marginTop: 8 }]}>
        <StatCard title="Suspicious" value={stats?.suspicious_count ?? 0} color={colors.yellow} icon="⚠️" />
        <StatCard title="Normal" value={stats?.normal_count ?? 0} color={colors.green} icon="✅" />
      </View>

      {/* Traffic Distribution */}
      {stats && total > 0 && (
        <View style={styles.card}>
          <SectionHeader title="Traffic Distribution" subtitle="by classification label" />
          <SimpleBar label="Normal" value={stats.normal_count || 0} total={total} color={colors.green} />
          <SimpleBar label="Suspicious" value={stats.suspicious_count || 0} total={total} color={colors.yellow} />
          <SimpleBar label="Malicious" value={stats.malicious_count || 0} total={total} color={colors.red} />
        </View>
      )}

      {/* Severity Breakdown */}
      {stats && (
        <View style={styles.card}>
          <SectionHeader title="Severity Breakdown" />
          {[
            { label: "Critical", count: stats.critical_count, color: colors.red },
            { label: "High",     count: stats.high_count,     color: colors.orange },
            { label: "Medium",   count: stats.medium_count,   color: colors.yellow },
            { label: "Low",      count: stats.low_count,      color: colors.accent },
          ].map(({ label, count, color }) => (
            <SimpleBar key={label} label={label} value={count || 0} total={total || 1} color={color} />
          ))}
        </View>
      )}

      {/* Recent Alerts */}
      <View style={styles.card}>
        <SectionHeader title="Recent Alerts" subtitle={`${recentAlerts.length} most recent`} />
        {recentAlerts.length === 0
          ? <EmptyState message="No alerts yet" icon="🛡️" />
          : recentAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
        }
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 24, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 12, fontFamily: "monospace", color: colors.muted, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  banner: { borderRadius: 10, padding: 10, borderWidth: 1, marginBottom: 14 },
  errorBanner: { backgroundColor: `${colors.red}12`, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: `${colors.red}33`, marginBottom: 14 },
  errorText: { color: colors.red, fontFamily: "monospace", fontSize: 11, fontWeight: "700" },
  errorHint: { color: colors.muted, fontFamily: "monospace", fontSize: 10, marginTop: 4 },
  statsRow: { flexDirection: "row" },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 14 },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: colors.bg,
    padding: 40
  },
  loadingText: { 
    color: colors.text, 
    fontFamily: 'monospace', 
    fontSize: 14, 
    marginTop: 12,
    textAlign: 'center'
  },
});

