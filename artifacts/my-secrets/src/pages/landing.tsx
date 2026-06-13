import React from "react";
import { Link } from "wouter";
import { Shield, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050A14] text-white flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#050A14] to-[#050A14] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      
      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-cyan-400" />
          <span className="text-xl font-bold tracking-tight">My Secrets</span>
        </div>
        <div className="flex gap-4">
          <Link href="/sign-in" className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 transition-colors">
            Sign In
          </Link>
          <Link href="/sign-up" className="text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-lg transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            Create Vault
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-8">
            <Lock className="w-3 h-3" /> Military-Grade Encryption
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            A Fortress For Your <br className="hidden md:block" /> Digital Life.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            The encrypted vault for power users. Built with a clean cockpit aesthetic, AES-256-GCM client-side encryption, and absolutely zero compromises.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up" className="w-full sm:w-auto text-base font-semibold bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" /> Open Your Vault
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20" 
        style={{
          backgroundImage: `linear-gradient(to right, #06B6D4 1px, transparent 1px), linear-gradient(to bottom, #06B6D4 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem',
          maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
        }}
      />
    </div>
  );
}