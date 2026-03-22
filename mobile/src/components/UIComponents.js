/**
 * Shared mobile UI components
 */

import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { colors, LABEL_COLORS, SEVERITY_COLORS, SEVERITY_ICONS } from "./theme";

// ─── Alert Badge ──────────────────────────────────────────────────────────────
export function AlertBadge({ label }) {
  const color = LABEL_COLORS[label] || colors.muted;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: `${color}44` }]}>
      <Text style={[styles.badgeText, { color }]}>{label?.toUpperCase()}</Text>
    </View>
  );
}

// ─── Severity Badge ───────────────────────────────────────────────────────────
export function SeverityBadge({ severity }) {
  const color = SEVERITY_COLORS[severity] || colors.muted;
  const icon = SEVERITY_ICONS[severity] || "⚪";
  return (
    <View style={[styles.badge, { backgroundColor: `${color}18`, borderColor: `${color}33` }]}>
      <Text style={[styles.badgeText, { color }]}>
        {icon} {severity?.toUpperCase()}
      </Text>
    </View>
  );
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────
export function ConfidenceBar({ value, label }) {
  const pct = Math.round((value || 0) * 100);
  const color = LABEL_COLORS[label] || colors.accent;
  return (
    <View style={styles.confContainer}>
      <View style={styles.confHeader}>
        <Text style={styles.confLabel}>Confidence</Text>
        <Text style={[styles.confValue, { color }]}>{pct}%</Text>
      </View>
      <View style={styles.confTrack}>
        <View style={[styles.confFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ title, value, color, icon }) {
  return (
    <View style={[styles.statCard, { borderColor: `${color}33` }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────
export function AlertCard({ alert }) {
  const sevColor = SEVERITY_COLORS[alert.severity] || colors.muted;
  const time = new Date(alert.timestamp).toLocaleTimeString();

  return (
    <View style={[styles.alertCard, { borderColor: `${sevColor}44`, backgroundColor: `${sevColor}0f` }]}>
      <View style={styles.alertHeader}>
        <View style={styles.alertBadges}>
          <AlertBadge label={alert.label} />
          <View style={{ width: 6 }} />
          <SeverityBadge severity={alert.severity} />
        </View>
        <View style={styles.alertRight}>
          <Text style={styles.alertTime}>{time}</Text>
          <Text style={[styles.alertConf, { color: sevColor }]}>
            {Math.round((alert.confidence || 0) * 100)}%
          </Text>
        </View>
      </View>

      {(alert.source_ip || alert.destination_ip) && (
        <View style={styles.alertMeta}>
          {alert.source_ip && (
            <Text style={styles.alertMetaText}>SRC: {alert.source_ip}</Text>
          )}
          {alert.destination_ip && (
            <Text style={styles.alertMetaText}>DST: {alert.destination_ip}</Text>
          )}
          {alert.protocol && (
            <Text style={styles.alertMetaText}>{alert.protocol}</Text>
          )}
        </View>
      )}

      {/* Mini ensemble votes */}
      {alert.ensemble_votes && (
        <View style={styles.votesRow}>
          {[
            ["RF", alert.ensemble_votes.random_forest],
            ["IF", alert.ensemble_votes.isolation_forest],
            ["LSTM", alert.ensemble_votes.lstm_autoencoder],
          ].map(([name, vote]) => (
            <View key={name} style={styles.voteItem}>
              <Text style={styles.voteName}>{name}</Text>
              <Text style={[styles.voteLabel, { color: LABEL_COLORS[vote?.label] || colors.muted }]}>
                {vote?.label?.slice(0, 3) || "—"}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function LoadingSpinner({ size = "large" }) {
  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size} color={colors.accent} />
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ message = "No data yet", icon = "🛡️" }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  confContainer: { marginVertical: 4 },
  confHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  confLabel: { fontSize: 11, fontFamily: "monospace", color: colors.muted },
  confValue: { fontSize: 11, fontFamily: "monospace", fontWeight: "700" },
  confTrack: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: "hidden" },
  confFill: { height: "100%", borderRadius: 2 },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    marginHorizontal: 4,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 24, fontFamily: "monospace", fontWeight: "700" },
  statTitle: { fontSize: 10, fontFamily: "monospace", color: colors.muted, marginTop: 2, textAlign: "center" },
  alertCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  alertHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  alertBadges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  alertRight: { alignItems: "flex-end" },
  alertTime: { fontSize: 10, fontFamily: "monospace", color: colors.muted },
  alertConf: { fontSize: 13, fontFamily: "monospace", fontWeight: "700", marginTop: 2 },
  alertMeta: { flexDirection: "row", gap: 10, marginTop: 8 },
  alertMetaText: { fontSize: 10, fontFamily: "monospace", color: colors.muted },
  votesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: `${colors.border}66`,
  },
  voteItem: { alignItems: "center" },
  voteName: { fontSize: 9, fontFamily: "monospace", color: colors.muted },
  voteLabel: { fontSize: 10, fontFamily: "monospace", fontWeight: "700", marginTop: 2 },
  spinnerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 13, fontFamily: "monospace", color: colors.muted, textAlign: "center" },
  sectionHeader: { marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  sectionSubtitle: { fontSize: 11, fontFamily: "monospace", color: colors.muted, marginTop: 2 },
});
