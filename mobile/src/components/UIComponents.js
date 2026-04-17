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
    <View style={[styles.badge, { backgroundColor: `${color}15`, borderColor: `${color}40` }]}>
      <Text style={[styles.badgeText, { color }]}>{label?.toUpperCase()}</Text>
    </View>
  );
}

// ─── Severity Badge ───────────────────────────────────────────────────────────
export function SeverityBadge({ severity }) {
  const color = SEVERITY_COLORS[severity] || colors.muted;
  const icon = SEVERITY_ICONS[severity] || "⚪";
  return (
    <View style={[styles.badge, { backgroundColor: `${color}10`, borderColor: `${color}30` }]}>
      <Text style={[styles.badgeText, { color }]}>
        {icon} {severity?.toUpperCase()}
      </Text>
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ title, value, color, icon }) {
  return (
    <View style={[styles.statCard, { borderColor: `${color}25` }]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statTitle}>{title.toUpperCase()}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────
export function AlertCard({ alert }) {
  const sevColor = SEVERITY_COLORS[alert.severity] || colors.muted;
  const time = new Date(alert.timestamp).toLocaleTimeString();

  return (
    <View style={[styles.alertCard, { borderLeftColor: sevColor, backgroundColor: colors.surface }]}>
      <View style={styles.alertHeader}>
        <View style={styles.alertBadges}>
          <AlertBadge label={alert.label} />
          <SeverityBadge severity={alert.severity} />
        </div>
        <View style={styles.alertRight}>
          <Text style={styles.alertTime}>{time}</Text>
        </View>
      </View>

      <View style={styles.alertMain}>
        <View style={styles.alertDetails}>
          <Text style={[styles.alertConfLabel, { color: colors.muted }]}>CONFIDENCE</Text>
          <Text style={[styles.alertConfValue, { color: sevColor }]}>
            {Math.round((alert.confidence || 0) * 100)}%
          </Text>
        </View>
        <View style={styles.alertDivider} />
        <View style={styles.alertDetails}>
          <Text style={[styles.alertConfLabel, { color: colors.muted }]}>PROTOCOL</Text>
          <Text style={styles.alertMetaText}>{alert.protocol || "TCP"}</Text>
        </View>
      </View>

      {alert.source_ip && (
        <View style={styles.ipContainer}>
          <Text style={styles.ipLabel}>IP SOURCE:</Text>
          <Text style={styles.ipValue}>{alert.source_ip}</Text>
        </View>
      )}

      {/* Mini ensemble votes */}
      {alert.ensemble_votes && (
        <View style={styles.votesRow}>
          {Object.entries(alert.ensemble_votes).map(([name, vote]) => {
            const shortName = name.split('_').map(w => w[0].toUpperCase()).join('');
            return (
              <View key={name} style={styles.voteItem}>
                <Text style={styles.voteName}>{shortName}</Text>
                <Text style={[styles.voteLabel, { color: LABEL_COLORS[vote?.label] || colors.muted }]}>
                  {vote?.label?.slice(0, 3) || "—"}
                </Text>
              </View>
            );
          })}
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: "monospace",
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    marginHorizontal: 4,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  statIcon: { fontSize: 18 },
  statInfo: { flex: 1 },
  statValue: { fontSize: 20, fontFamily: "monospace", fontWeight: "800", marginTop: 1 },
  statTitle: { fontSize: 8, fontFamily: "monospace", color: colors.muted, fontWeight: "700", letterSpacing: 0.5 },
  alertCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  alertHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  alertBadges: { flexDirection: "row", gap: 8 },
  alertRight: { alignItems: "flex-end" },
  alertTime: { fontSize: 9, fontFamily: "monospace", color: colors.muted, fontWeight: "700" },
  alertMain: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  alertDetails: { flex: 1 },
  alertConfLabel: { fontSize: 8, fontWeight: "800", letterSpacing: 0.5, marginBottom: 2 },
  alertConfValue: { fontSize: 18, fontFamily: "monospace", fontWeight: "800" },
  alertDivider: { width: 1, height: 24, backgroundColor: colors.border, marginHorizontal: 16 },
  ipContainer: { flexDirection: "row", alignItems: "center", gap: 8, opacity: 0.7 },
  ipLabel: { fontSize: 8, fontWeight: "800", color: colors.muted },
  ipValue: { fontSize: 10, fontFamily: "monospace", color: colors.text, fontWeight: "700" },
  metaRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  alertMetaText: { fontSize: 14, fontFamily: "monospace", color: colors.text, fontWeight: "700" },
  votesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: `${colors.border}66`,
  },
  voteItem: { alignItems: "center", flex: 1 },
  voteName: { fontSize: 8, fontFamily: "monospace", color: colors.muted, fontWeight: "700" },
  voteLabel: { fontSize: 10, fontFamily: "monospace", fontWeight: "800", marginTop: 2 },
  spinnerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, borderStyle: "dashed", borderWidth: 1, borderColor: colors.border, borderRadius: 20 },
  emptyIcon: { fontSize: 32, marginBottom: 12, opacity: 0.5 },
  emptyText: { fontSize: 12, fontFamily: "monospace", color: colors.muted, textAlign: "center", fontWeight: "600" },
  sectionHeader: { marginBottom: 16, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  sectionSubtitle: { fontSize: 9, fontFamily: "monospace", color: colors.muted, marginTop: 2, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
});

