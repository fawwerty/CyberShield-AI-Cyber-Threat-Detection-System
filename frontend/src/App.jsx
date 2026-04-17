import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import AnalyzePage from "./pages/Analyze";
import AlertsPage from "./pages/Alerts";
import LogsPage from "./pages/Logs";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

/**
 * AppLayout — Conditional layout wrapper
 * Shows Sidebar only on authenticated-style dashboard routes.
 */
function AppLayout({ children }) {
  const location = useLocation();
  const publicPaths = ["/", "/login", "/register"];
  const isPublic = publicPaths.includes(location.pathname);

  if (isPublic) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      <div className="mesh-bg" />
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected-style Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/logs" element={<LogsPage />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

