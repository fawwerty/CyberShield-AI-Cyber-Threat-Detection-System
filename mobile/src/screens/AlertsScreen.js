/**
 * Mobile Alerts Screen
 * Full scrollable list of alerts with filter buttons and pull-to-refresh.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { getAlerts, clearAlerts } from "../services/api";
import { colors } from "../components/theme";
import {
  AlertCard,
  LoadingSpinner,
  EmptyState,
} from "../components/UIComponents";

const FILTERS = ["All", "Malicious", "Suspicious", "Normal"];

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const params = { limit: 100 };
      if (filter !== "All") params.label = filter;
      const data = await getAlerts(params);
      setAlerts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const handleClear = () => {
    Alert.alert(
      "Clear All Alerts",
      "Are you sure you want to delete all alerts?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAlerts();
              setAlerts([]);
            } catch (e) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ]
    );
  };

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={{ color: colors.text, fontFamily: 'monospace', marginTop: 12 }}>Loading alerts...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Sticky Filter Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterChip,
                filter === f && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {alerts.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
        </Text>
        <Text style={styles.refreshText}>Auto-refreshes every 10s</Text>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Alert List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {alerts.length === 0 ? (
          <EmptyState message="No alerts match the filter" icon="🔔" />
        ) : (
          alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterScroll: { gap: 8, paddingRight: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: `${colors.accent}18`,
    borderColor: `${colors.accent}44`,
  },
  filterText: { fontSize: 12, fontFamily: "monospace", color: colors.muted },
  filterTextActive: { color: colors.accent, fontWeight: "700" },
  clearBtn: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: `${colors.red}18`,
    borderWidth: 1,
    borderColor: `${colors.red}44`,
  },
  clearText: { fontSize: 12, fontFamily: "monospace", color: colors.red },
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  countText: { fontSize: 11, fontFamily: "monospace", color: colors.muted },
  refreshText: { fontSize: 10, fontFamily: "monospace", color: `${colors.muted}88` },
  errorBanner: {
    margin: 16,
    padding: 10,
    backgroundColor: `${colors.red}12`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.red}33`,
  },
  errorText: { color: colors.red, fontFamily: "monospace", fontSize: 11 },
  listContent: { padding: 16, paddingBottom: 32 },
});
