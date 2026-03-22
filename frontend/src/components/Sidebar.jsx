/**
 * Sidebar Navigation Component
 */
import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  ScrollText,
  Bell,
  Shield,
  Activity,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/analyze", icon: Upload, label: "Analyze" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
  { to: "/logs", icon: ScrollText, label: "Logs" },
];

export default function Sidebar() {
  return (
    <aside
      className="flex flex-col w-64 min-h-screen border-r"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-6 py-5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center glow-accent"
          style={{ background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)" }}
        >
          <Shield size={18} color="var(--accent)" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide" style={{ color: "var(--accent)" }}>
            CyberShield
          </p>
          <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>
            AI Threat Detector
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive ? "active-nav" : "hover:bg-white/5"
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? "rgba(0,212,255,0.1)" : undefined,
              color: isActive ? "var(--accent)" : "var(--muted)",
              border: isActive ? "1px solid rgba(0,212,255,0.2)" : "1px solid transparent",
            })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="px-6 py-4 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span className="status-dot w-2 h-2 rounded-full inline-block" style={{ background: "var(--green)" }} />
          <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
            Ensemble Model v1.0
          </span>
        </div>
      </div>
    </aside>
  );
}
