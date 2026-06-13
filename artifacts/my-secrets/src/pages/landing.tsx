import React from "react";
import { Link } from "wouter";
import { Lock, Shield, FileText, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050A14] text-white flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#050A14] to-[#050A14] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

      <header className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2.5">
          <img src="/logo.jpg" alt="My Secrets" className="w-9 h-9 rounded-lg object-cover" />
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

          <div className="flex justify-center mb-8">
            <img
              src="/logo.jpg"
              alt="Vault"
              className="w-28 h-28 rounded-2xl object-cover shadow-[0_0_40px_rgba(6,182,212,0.4)] border border-cyan-500/30"
            />
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            A Fortress For Your <br className="hidden md:block" /> Digital Life.
          </h1>

          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            The encrypted vault for power users. Store passwords, files, and sensitive data with AES-256-GCM encryption and zero compromises.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/sign-up" className="w-full sm:w-auto text-base font-semibold bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" /> Create Free Vault
            </Link>
            <Link href="/sign-in" className="w-full sm:w-auto text-base font-medium text-slate-300 hover:text-white px-8 py-4 rounded-lg border border-cyan-900/40 hover:border-cyan-500/40 transition-all flex items-center justify-center gap-2">
              Sign In
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Lock, title: "Encrypted Vault", desc: "AES-256-GCM client-side" },
              { icon: FileText, title: "File Vault", desc: "Store any document safely" },
              { icon: Eye, title: "Zero Knowledge", desc: "Only you can read your data" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-4 rounded-xl bg-slate-900/40 border border-cyan-900/20 text-left">
                <Icon className="w-5 h-5 text-cyan-400 mb-2" />
                <div className="font-semibold text-sm text-white">{title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 text-center py-6 text-xs text-slate-600">
        © {new Date().getFullYear()} My Secrets — All data encrypted client-side.
      </footer>
    </div>
  );
}
