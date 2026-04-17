import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheck, Zap, Activity, Globe, Lock, Cpu, 
  ArrowRight, Shield, Play 
} from "lucide-react";
import Navbar from "../components/Navbar";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen selection:bg-accent/30">
      <div className="mesh-bg" />
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial="initial"
            animate="animate"
            variants={staggerChildren}
            className="flex flex-col items-start"
          >
            <motion.div 
              variants={fadeInUp}
              className="px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold tracking-widest uppercase mb-6"
            >
              Next-Gen Cyber Security
            </motion.div>
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6"
            >
              Detect Threats <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-emerald-400">
                In Real-Time
              </span>
            </motion.h1>
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-text-muted mb-8 max-w-lg leading-relaxed"
            >
              Enterprise-grade network anomaly detection powered by advanced Ensemble Machine Learning. 
              Protect your infrastructure with deep behavioral analysis.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate("/register")}
                className="btn-primary group"
              >
                Get Started Free <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-6 py-3 rounded-full font-semibold border border-card-border hover:bg-surface transition-all flex items-center gap-2">
                <Play size={18} fill="currentColor" /> Watch Demo
              </button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full" />
            <div className="glass-card p-2 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent" />
              <img 
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200" 
                alt="Cyber Dashboard" 
                className="rounded-lg shadow-2xl grayscale hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute top-4 right-4 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 px-3 py-1.5 rounded-full flex items-center gap-2">
                <div className="pulse-dot bg-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">System Live</span>
              </div>
            </div>
            
            {/* Floating Mini-cards */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 glass-card p-4 flex items-center gap-3 border-accent/30"
            >
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <ShieldCheck className="text-accent" size={20} />
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Detection Rate</p>
                <p className="text-lg font-bold">99.98%</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Unrivaled Intelligence</h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              Our ensemble architecture combines multiple AI models to eliminate false positives and catch zero-day exploits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: Zap, 
                title: "Ensemble Power", 
                desc: "Random Forest + Isolation Forest + LSTM models working in perfect harmony.",
                color: "indigo"
              },
              { 
                icon: Globe, 
                title: "Global Visibility", 
                desc: "Real-time traffic monitoring across all endpoints with zero performance overhead.",
                color: "emerald"
              },
              { 
                icon: Activity, 
                title: "Live Analysis", 
                desc: "WebSocket-driven alerts and live-streaming threat diagnostics directly to your app.",
                color: "amber"
              }
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="glass-card p-8 group overflow-hidden relative"
              >
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mb-16 group-hover:bg-accent/10 transition-colors" />
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-accent/10 border border-accent/20 text-accent`}>
                  <f.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-accent/5 flex items-center justify-center">
                   <div className="w-[1000px] h-[400px] bg-accent/10 blur-[150px] opacity-20" />
        </div>
        <div className="max-w-7xl mx-auto relative">
          <div className="glass-card p-12 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center border-accent/10">
            {[
              { label: "Alerts Blocked", value: "12M+" },
              { label: "Accuracy Rate", value: "99.9%" },
              { label: "Latency", value: "< 5ms" },
              { label: "Integrations", value: "250+" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-4xl font-extrabold mb-2 font-display text-accent">{stat.value}</p>
                <p className="text-xs uppercase tracking-widest text-text-muted font-bold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent pointer-events-none" />
            <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Ready to Secure <br /> Your Network?
            </h2>
            <p className="text-xl text-text-muted mb-10 max-w-xl mx-auto">
              Join 5,000+ security analysts using CyberShield to protect their mission-critical infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate("/register")}
                className="btn-primary px-10 py-4 text-lg"
              >
                Create Account <ArrowRight />
              </button>
              <button className="px-10 py-4 rounded-full font-bold border border-card-border hover:border-text/30 transition-all text-lg">
                Talk to Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-card-border px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Shield className="text-accent" size={20} />
            <span className="font-bold font-display">CyberShield</span>
          </div>
          <p className="text-sm text-text-dim">
            © 2026 CyberShield Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Twitter", "GitHub", "LinkedIn"].map(s => (
              <a key={s} href="#" className="text-sm text-text-muted hover:text-accent transition-colors">{s}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
