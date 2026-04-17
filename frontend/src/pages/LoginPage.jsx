import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, Eye, EyeOff, Github, Chrome, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (e) {
      setError(e.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6">
      <div className="mesh-bg" />
      
      {/* Back to Home */}
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-text-muted hover:text-accent transition-colors group">
        <Shield size={20} className="group-hover:rotate-12 transition-transform" />
        <span className="font-bold tracking-tight">CyberShield</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-10 border-accent/10">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold mb-2 font-display">Welcome Back</h1>
            <p className="text-text-muted text-sm">Enter your credentials to access the command center.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
            >
              <AlertCircle className="text-red-500" size={18} />
              <p className="text-xs font-bold text-red-500">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-text-dim ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
                 <input 
                  type="email" 
                  required
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-surface/50 border border-card-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold uppercase tracking-widest text-text-dim">Password</label>
                <a href="#" className="text-xs font-medium text-accent hover:underline">Forgot?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
                 <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-surface/50 border border-card-border rounded-xl py-3 pl-12 pr-12 text-sm focus:outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/10 transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-text transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-card-border"></div>
              </div>
              <span className="relative px-4 bg-[#0a1124] text-xs font-bold uppercase tracking-widest text-text-dim">Or continue with</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-card-border hover:bg-surface transition-all font-medium text-sm">
                <Chrome size={18} /> Google
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-card-border hover:bg-surface transition-all font-medium text-sm">
                <Github size={18} /> GitHub
              </button>
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-text-muted">
            Don't have an account?{" "}
            <Link to="/register" className="text-accent font-bold hover:underline">Create one</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
