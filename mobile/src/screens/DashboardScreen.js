/**
 * Mobile Dashboard Screen
 * Clean, editorial-style interface for the Cybershield command center.
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
      <Text style={styles.loadingText}>INITIALIZING COMMAND CENTER</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* Editorial Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Command Center</Text>
          <Text style={styles.subtitle}>NEURAL DEFENSE SYSTEM V1.0</Text>
        </div>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: health?.model_loaded ? colors.green : colors.red }]} />
          <Text style={[styles.statusText, { color: health?.model_loaded ? colors.green : colors.red }]}>
            {health?.model_loaded ? "SECURED" : "OFFLINE"}
          </Text>
        </View>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>CONNECTIVITY ERROR — {error.toUpperCase()}</Text>
        </View>
      )}

      {/* Model Health Banner */}
      {health && (
        <View style={[styles.banner, {
          backgroundColor: health.model_loaded ? `${colors.green}08` : `${colors.red}08`,
          borderColor: health.model_loaded ? `${colors.green}25` : `${colors.red}25`,
        }]}>
          <Text style={[styles.bannerText, { color: health.model_loaded ? colors.green : colors.red }]}>
            {health.model_loaded ? "ENCRYPTION ACTIVE" : "THREAT SHIELD DEGRADED"} • {health.model_type.toUpperCase()}
          </Text>
        </View>
      )}

      {/* Large Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard title="Packets" value={stats?.total_analyzed ?? 0} color={colors.accent} icon="📊" />
          <StatCard title="Threats" value={stats?.malicious_count ?? 0} color={colors.red} icon="🚨" />
        </View>
        <View style={[styles.statsRow, { marginTop: 8 }]}>
          <StatCard title="Suspicious" value={stats?.suspicious_count ?? 0} color={colors.yellow} icon="⚠️" />
          <StatCard title="Normal" value={stats?.normal_count ?? 0} color={colors.green} icon="🛡️" />
        </View>
      </View>

      {/* Recent Alerts Section */}
      <View style={styles.section}>
        <SectionHeader 
          title="Live Signal Feed" 
          subtitle={`${recentAlerts.length} PULSES CAPTURED`} 
        />
        {recentAlerts.length === 0
          ? <EmptyState message="System clear. Awaiting signals..." icon="📡" />
          : recentAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
        }
      </View>

      {/* Footer Branding */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>CYBERSHIELD AI • ENTERPRISE CORE</Text>
      </div>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 60 },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "flex-end", 
    marginBottom: 24,
    marginTop: 10 
  },
  title: { fontSize: 32, fontWeight: "800", color: colors.text, letterSpacing: -1 },
  subtitle: { fontSize: 9, fontFamily: "monospace", color: colors.muted, marginTop: 4, letterSpacing: 1, fontWeight: "700" },
  statusContainer: { alignItems: "flex-end" },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  banner: { 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderWidth: 1, 
    marginBottom: 20,
    alignItems: "center"
  },
  bannerText: { fontSize: 8, fontFamily: "monospace", fontWeight: "800", letterSpacing: 0.5 },
  errorBanner: { backgroundColor: `${colors.red}15`, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: `${colors.red}30`, marginBottom: 20 },
  errorText: { color: colors.red, fontFamily: "monospace", fontSize: 9, fontWeight: "800", textAlign: "center" },
  statsGrid: { marginBottom: 12 },
  statsRow: { flexDirection: "row" },
  section: { marginTop: 20 },
  footer: { marginTop: 40, alignItems: "center", opacity: 0.3 },
  footerText: { fontSize: 8, fontFamily: "monospace", color: colors.muted, fontWeight: "800", letterSpacing: 2 },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: colors.bg,
  },
  loadingText: { 
    color: colors.muted, 
    fontFamily: 'monospace', 
    fontSize: 10, 
    marginTop: 20,
    letterSpacing: 2,
    fontWeight: "800"
  },
});
   textAlign: 'center'
  },
});

