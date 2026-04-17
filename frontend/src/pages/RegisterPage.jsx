import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, User, Github, Chrome, ArrowRight, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate reg
    setTimeout(() => {
      setIsLoading(false);
      navigate("/");
    }, 1500);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 py-12">
      <div className="mesh-bg" />
      
      {/* Back to Home */}
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-text-muted hover:text-accent transition-colors group">
        <Shield size={20} className="group-hover:rotate-12 transition-transform" />
        <span className="font-bold tracking-tight text-text">CyberShield</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="glass-card p-10 border-accent/10">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-extrabold mb-2 font-display">Create Account</h1>
            <p className="text-text-muted text-sm">Join the next generation of cybersecurity experts.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-dim ml-1">First Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
                  <input 
                    type="text" 
                    required
                    placeholder="John"
                    className="w-full bg-surface/50 border border-card-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/10 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-dim ml-1">Last Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
                  <input 
                    type="text" 
                    required
                    placeholder="Doe"
                    className="w-full bg-surface/50 border border-card-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/10 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-text-dim ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="john@example.com"
                  className="w-full bg-surface/50 border border-card-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-text-dim ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-surface/50 border border-card-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/10 transition-all"
                />
              </div>
              <p className="text-[10px] text-text-dim mt-2 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" /> Must be at least 8 characters long
              </p>
            </div>

            <div className="flex items-start gap-3 py-2">
              <input type="checkbox" required className="mt-1 accent-accent" id="terms" />
              <label htmlFor="terms" className="text-xs text-text-muted leading-relaxed">
                I agree to the <a href="#" className="text-accent hover:underline">Terms of Service</a> and <a href="#" className="text-accent hover:underline">Privacy Policy</a>.
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-card-border"></div>
              </div>
              <span className="relative px-4 bg-[#0a1124] text-xs font-bold uppercase tracking-widest text-text-dim">Or sign up with</span>
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
            Already have an account?{" "}
            <Link to="/login" className="text-accent font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
