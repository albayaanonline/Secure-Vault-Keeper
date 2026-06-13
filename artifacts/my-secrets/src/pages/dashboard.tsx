import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useGetMe, useGetDashboardStats, useGetSecurityScore } from "@workspace/api-client-react";
import { Shield, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: user } = useGetMe();
  // Using dummy data or skeletons if not loaded since APIs might not exist in the mockup yet
  // We'll build a skeleton-like view for the premium dashboard
  
  return (
    <div className="min-h-screen bg-[#050A14] text-white flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Command Center</h1>
          <p className="text-slate-400 mt-2">Welcome back to your vault{user?.displayName ? `, ${user.displayName}` : ''}.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#0D1526] border border-cyan-900/50 rounded-xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10"><Lock className="w-16 h-16" /></div>
            <div className="text-cyan-500 text-sm font-medium mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" /> Total Secrets
            </div>
            <div className="text-4xl font-bold">124</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-[#0D1526] border border-cyan-900/50 rounded-xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10"><Shield className="w-16 h-16 text-green-500" /></div>
            <div className="text-green-400 text-sm font-medium mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Security Score
            </div>
            <div className="text-4xl font-bold text-green-400">98<span className="text-xl text-green-400/50">/100</span></div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-[#0D1526] border border-red-900/50 rounded-xl p-6 relative overflow-hidden shadow-[0_0_15px_rgba(220,38,38,0.1)]"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="w-16 h-16 text-red-500" /></div>
            <div className="text-red-400 text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Action Required
            </div>
            <div className="text-4xl font-bold text-red-400">3</div>
            <div className="text-xs text-red-400/70 mt-1">Expiring soon or weak</div>
          </motion.div>
        </div>

        {/* Chart Area Mockup */}
        <div className="bg-[#0D1526] border border-cyan-900/30 rounded-xl p-6 h-64 flex items-center justify-center">
          <p className="text-slate-500">Vault Activity Chart (recharts integration ready)</p>
        </div>
      </main>
    </div>
  );
}