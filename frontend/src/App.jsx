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
import { AuthProvider, useAuth } from "./context/AuthContext";

/**
 * ProtectedRoute — Guards routes against unauthenticated users
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // Or a spinner
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * AppLayout — Conditional layout wrapper
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
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
            />
            <Route 
              path="/analyze" 
              element={<ProtectedRoute><AnalyzePage /></ProtectedRoute>} 
            />
            <Route 
              path="/alerts" 
              element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} 
            />
            <Route 
              path="/logs" 
              element={<ProtectedRoute><LogsPage /></ProtectedRoute>} 
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

