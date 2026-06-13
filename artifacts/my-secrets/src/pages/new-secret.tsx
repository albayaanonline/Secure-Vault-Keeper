import React from "react";
import { Sidebar } from "@/components/layout/sidebar";

export default function NewSecret() {
  return (
    <div className="min-h-screen bg-[#050A14] text-white flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Create Secret</h1>
          <p className="text-slate-400 mt-2">Add a new item to your vault.</p>
        </header>
        
        <div className="bg-[#0D1526] border border-cyan-900/30 rounded-xl p-6 max-w-2xl">
          <p className="text-slate-500 text-center py-8">Form goes here.</p>
        </div>
      </main>
    </div>
  );
}