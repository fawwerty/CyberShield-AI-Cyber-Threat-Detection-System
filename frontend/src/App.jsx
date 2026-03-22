/**
 * App.js — Root component with React Router layout
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import AnalyzePage from "./pages/Analyze";
import AlertsPage from "./pages/Alerts";
import LogsPage from "./pages/Logs";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze" element={<AnalyzePage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
