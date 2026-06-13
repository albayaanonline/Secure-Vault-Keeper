import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useListSecrets } from "@workspace/api-client-react";
import { Lock, Search, Plus } from "lucide-react";
import { Link } from "wouter";

export default function Secrets() {
  const { data: secrets } = useListSecrets();

  return (
    <div className="min-h-screen bg-[#050A14] text-white flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Vault</h1>
            <p className="text-slate-400 mt-2">All your encrypted secrets.</p>
          </div>
          <Link href="/secrets/new" className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Secret
          </Link>
        </header>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search secrets..." 
            className="w-full bg-[#0D1526] border border-cyan-900/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {secrets?.map(secret => (
            <Link key={secret.id} href={`/secrets/${secret.id}`} className="bg-[#0D1526] border border-cyan-900/30 rounded-xl p-5 hover:border-cyan-500/50 transition-all hover:-translate-y-1 block relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500/50 group-hover:bg-cyan-400 transition-colors" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{secret.title}</h3>
                  <p className="text-sm text-slate-400">{secret.categoryName}</p>
                </div>
              </div>
            </Link>
          ))}
          {(!secrets || secrets.length === 0) && (
            <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-cyan-900/30 rounded-xl">
              No secrets found. Create one to get started.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}