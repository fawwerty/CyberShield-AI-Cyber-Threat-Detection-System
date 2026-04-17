/**
 * Sidebar Component
 * Navigation menu for the web dashboard.
 */

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  Shield, LayoutDashboard, Brain, Bell, 
  Terminal, Settings, LogOut, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/analyze", label: "Analyze", icon: Brain },
  { path: "/alerts", label: "Alerts", icon: Bell },
  { path: "/logs", label: "System Logs", icon: Terminal },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-72 h-screen p-6 sticky top-0 border-r border-card-border flex flex-col">
      {/* Brand */}
      <div 
        onClick={() => navigate("/")}
        className="flex items-center gap-3 mb-12 cursor-pointer group px-2"
      >
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30 group-hover:scale-110 transition-transform">
          <Shield className="text-accent" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight font-display">
            Cyber<span className="text-accent">Shield</span>
          </h1>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-dim">Command Port</p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-2">
        <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-text-dim mb-4">Core Systems</p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300
              ${isActive 
                ? "bg-accent/10 border border-accent/20 text-accent" 
                : "text-text-muted hover:bg-surface hover:text-text border border-transparent"}
            `}
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} className="transition-colors" />
              <span className="text-sm font-semibold">{item.label}</span>
            </div>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </NavLink>
        ))}
      </nav>

      {/* Footer Nav */}
      <div className="pt-6 mt-6 border-t border-card-border space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-muted hover:bg-surface hover:text-text transition-all group border border-transparent">
          <Settings size={18} className="group-hover:rotate-45 transition-transform" />
          <span className="text-sm font-semibold">Settings</span>
        </button>
        <button 
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all border border-transparent"
        >
          <LogOut size={18} />
          <span className="text-sm font-semibold">Disconnect</span>
        </button>
      </div>

      {/* User Mini Profile */}
      <div className="mt-8 glass-card p-4 border-accent/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-emerald-400 p-[2px]">
            <div className="w-full h-full rounded-full bg-bg flex items-center justify-center">
              <span className="text-xs font-bold">KN</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">Kwafo Nathaniel</p>
            <p className="text-[10px] text-text-muted font-medium truncate">Principal Analyst</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

