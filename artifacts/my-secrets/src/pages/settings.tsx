import React from "react";
import { Sidebar } from "@/components/layout/sidebar";

export default function Settings() {
  return (
    <div className="min-h-screen bg-[#050A14] text-white flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-slate-400 mt-2">Manage your vault preferences.</p>
        </header>

        <div className="max-w-2xl bg-[#0D1526] border border-cyan-900/30 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Security</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto-lock Vault</div>
                <div className="text-sm text-slate-400">Lock the vault after inactivity.</div>
              </div>
              <select className="bg-slate-900/50 border border-cyan-900/50 rounded-lg px-3 py-2 text-white">
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}