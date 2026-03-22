/**
 * Mobile Analyze Screen
 * Enter feature values manually or use quick presets, then submit for analysis.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { analyzeRecord } from "../services/api";
import { colors } from "../components/theme";
import {
  AlertBadge,
  SeverityBadge,
  ConfidenceBar,
  LoadingSpinner,
} from "../components/UIComponents";

// Presets matching web frontend
const PRESETS = {
  "Normal": {
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
  "DoS": {
    duration: 0, protocol_type: 0, src_bytes: 0, dst_bytes: 0,
    land: 0, wrong_fragment: 3, urgent: 0, hot: 0, num_failed_logins: 0,
    logged_in: 0, num_compromised: 0, root_shell: 0, su_attempted: 0,
    num_root: 0, num_file_creations: 0, num_shells: 0, num_access_files: 0,
    count: 511, srv_count: 511, dst_host_count: 255,
  },
  "Exploit": {
    duration: 2.3, protocol_type: 1, src_bytes: 9879, dst_bytes: 8001,
    land: 0, wrong_fragment: 0, urgent: 0, hot: 28, num_failed_logins: 0,
    logged_in: 1, num_compromised: 235, root_shell: 1, su_attempted: 0,
    num_root: 235, num_file_creations: 1, num_shells: 2, num_access_files: 1,
    count: 1, srv_count: 1, dst_host_count: 1,
  },
};

const PRESET_ICONS = { Normal: "✅", "Port Scan": "🔍", DoS: "💥", Exploit: "🔓" };

const DEFAULT_FEATURES = PRESETS["Normal"];

export default function AnalyzeScreen() {
  const [features, setFeatures] = useState({ ...DEFAULT_FEATURES });
  const [sourceIp, setSourceIp] = useState("");
  const [destIp, setDestIp] = useState("");
  const [protocol, setProtocol] = useState("TCP");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const applyPreset = (name) => {
    setFeatures({ ...PRESETS[name] });
    setResult(null);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzeRecord(features, {
        source_ip: sourceIp || undefined,
        destination_ip: destIp || undefined,
        protocol: protocol || undefined,
      });
      setResult(res);
    } catch (e) {
      Alert.alert("Analysis Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateFeature = (key, val) => {
    setFeatures((prev) => ({ ...prev, [key]: parseFloat(val) || 0 }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Traffic Analyzer</Text>
        <Text style={styles.subtitle}>
          Enter features or choose a preset, then analyze
        </Text>

        {/* Presets */}
        <View style={styles.presetsRow}>
          {Object.keys(PRESETS).map((name) => (
            <TouchableOpacity
              key={name}
              onPress={() => applyPreset(name)}
              style={styles.presetChip}
            >
              <Text style={styles.presetText}>
                {PRESET_ICONS[name]} {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Meta inputs */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connection Info (Optional)</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaField}>
              <Text style={styles.fieldLabel}>Source IP</Text>
              <TextInput
                value={sourceIp}
                onChangeText={setSourceIp}
                placeholder="192.168.1.5"
                placeholderTextColor={colors.border}
                style={styles.input}
              />
            </View>
            <View style={styles.metaField}>
              <Text style={styles.fieldLabel}>Dest IP</Text>
              <TextInput
                value={destIp}
                onChangeText={setDestIp}
                placeholder="10.0.0.1"
                placeholderTextColor={colors.border}
                style={styles.input}
              />
            </View>
          </View>
          <View style={styles.metaField}>
            <Text style={styles.fieldLabel}>Protocol</Text>
            <TextInput
              value={protocol}
              onChangeText={setProtocol}
              placeholder="TCP"
              placeholderTextColor={colors.border}
              style={styles.input}
            />
          </View>
        </View>

        {/* Feature Inputs */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Network Features</Text>
          <View style={styles.featureGrid}>
            {Object.entries(features).map(([key, val]) => (
              <View key={key} style={styles.featureField}>
                <Text style={styles.fieldLabel} numberOfLines={1}>
                  {key}
                </Text>
                <TextInput
                  value={String(val)}
                  onChangeText={(t) => updateFeature(key, t)}
                  keyboardType="numeric"
                  style={[styles.input, styles.featureInput]}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Analyze Button */}
        <TouchableOpacity
          onPress={handleAnalyze}
          disabled={loading}
          style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.analyzeBtnText}>Analyzing...</Text>
            </View>
          ) : (
            <Text style={styles.analyzeBtnText}>⚡ Analyze Traffic</Text>
          )}
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.cardTitle}>Analysis Result</Text>

            <View style={styles.resultBadges}>
              <AlertBadge label={result.label} />
              <View style={{ width: 8 }} />
              <SeverityBadge severity={result.severity} />
            </View>

            <View style={{ marginTop: 12 }}>
              <ConfidenceBar value={result.confidence} label={result.label} />
            </View>

            {/* Ensemble Breakdown */}
            <Text style={[styles.cardTitle, { marginTop: 16, marginBottom: 10 }]}>
              Ensemble Votes
            </Text>
            {Object.entries(result.ensemble_votes || {})
              .filter(([k]) => k !== "ensemble_score")
              .map(([model, vote]) => (
                <View key={model} style={styles.voteRow}>
                  <Text style={styles.voteModel}>
                    {model.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Text>
                  <AlertBadge label={vote.label} />
                  <Text style={styles.voteConf}>
                    {(vote.confidence * 100).toFixed(1)}%
                  </Text>
                </View>
              ))}

            {/* Ensemble score */}
            <View style={styles.ensembleScoreRow}>
              <Text style={styles.ensembleScoreLabel}>Ensemble Score</Text>
              <Text style={styles.ensembleScoreValue}>
                {result.ensemble_votes?.ensemble_score}
              </Text>
            </View>

            <Text style={styles.resultMeta}>
              ID: {result.id?.slice(0, 16)}… •{" "}
              {new Date(result.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 12, fontFamily: "monospace", color: colors.muted, marginBottom: 16 },
  presetsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetText: { fontSize: 12, fontFamily: "monospace", color: colors.muted },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: "monospace",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  metaRow: { flexDirection: "row", gap: 10 },
  metaField: { flex: 1 },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  featureField: { width: "47%" },
  fieldLabel: {
    fontSize: 10,
    fontFamily: "monospace",
    color: colors.muted,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.accent,
    fontFamily: "monospace",
    fontSize: 12,
  },
  featureInput: { color: colors.accent },
  analyzeBtn: {
    backgroundColor: `${colors.accent}18`,
    borderWidth: 1,
    borderColor: `${colors.accent}44`,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  analyzeBtnDisabled: { opacity: 0.5 },
  analyzeBtnText: { fontSize: 15, fontWeight: "700", color: colors.accent, fontFamily: "monospace" },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
  },
  resultBadges: { flexDirection: "row", alignItems: "center" },
  voteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  voteModel: { fontSize: 11, fontFamily: "monospace", color: colors.muted, flex: 1 },
  voteConf: { fontSize: 11, fontFamily: "monospace", color: colors.text, marginLeft: 8 },
  ensembleScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: `${colors.accent}0f`,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: `${colors.accent}22`,
  },
  ensembleScoreLabel: { fontSize: 12, fontFamily: "monospace", color: colors.accent },
  ensembleScoreValue: { fontSize: 13, fontFamily: "monospace", fontWeight: "700", color: colors.accent },
  resultMeta: { fontSize: 10, fontFamily: "monospace", color: colors.muted, marginTop: 12 },
});
