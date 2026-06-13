import React from "react";
import { Sidebar } from "@/components/layout/sidebar";

export default function SecretDetail() {
  return (
    <div className="min-h-screen bg-[#050A14] text-white flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Secret Detail</h1>
          <p className="text-slate-400 mt-2">View and manage your secret.</p>
        </header>
        
        <div className="bg-[#0D1526] border border-cyan-900/30 rounded-xl p-6">
          <p className="text-slate-500 text-center py-8">Secret contents will be displayed here.</p>
        </div>
      </main>
    </div>
  );
}