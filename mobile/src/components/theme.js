/**
 * Design system tokens for the mobile app.
 * Dark cyberpunk theme matching the web dashboard.
 */

export const colors = {
  bg: "#0a0e1a",
  surface: "#0f1629",
  card: "#131d35",
  border: "#1e2d4a",
  accent: "#00d4ff",
  green: "#00ff88",
  yellow: "#ffcc00",
  red: "#ff3860",
  orange: "#ff6b35",
  purple: "#7c3aed",
  text: "#e2e8f0",
  muted: "#64748b",
  white: "#ffffff",
};

export const typography = {
  mono: "monospace",
  sans: "System",
};

export const LABEL_COLORS = {
  Malicious: colors.red,
  Suspicious: colors.yellow,
  Normal: colors.green,
};

export const SEVERITY_COLORS = {
  critical: colors.red,
  high: colors.orange,
  medium: colors.yellow,
  low: colors.accent,
  none: colors.green,
};

export const SEVERITY_ICONS = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🔵",
  none: "🟢",
};
