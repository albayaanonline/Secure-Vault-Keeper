import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AddSecretModal } from "@/components/AddSecretModal";
import { useListSecrets, useDeleteSecret, useToggleFavoriteSecret, getListSecretsQueryKey } from "@workspace/api-client-react";
import { Lock, Search, Plus, Star, Trash2, MoreVertical, Eye, Key, StickyNote } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  lock: Lock, key: Key, "sticky-note": StickyNote,
};

export default function Secrets() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { data: secrets } = useListSecrets({ search: search || undefined });
  const deleteSecret = useDeleteSecret();
  const toggleFavorite = useToggleFavoriteSecret();

  const handleDelete = (id: number) => {
    deleteSecret.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSecretsQueryKey() }),
    });
  };

  const handleFavorite = (id: number) => {
    toggleFavorite.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSecretsQueryKey() }),
    });
  };

  return (
    <div className="min-h-screen bg-[#050A14] text-white flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <Lock className="w-8 h-8 text-cyan-500" />
              <h1 className="text-3xl font-bold">Vault</h1>
            </div>
            <p className="text-slate-400 mt-2">All your encrypted secrets.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all"
          >
            <Plus className="w-4 h-4" /> New Secret
          </button>
        </header>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search secrets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0D1526] border border-cyan-900/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {secrets?.map(secret => {
            const Icon = ICON_MAP[secret.categoryIcon] ?? Lock;
            return (
              <motion.div
                key={secret.id}
                whileHover={{ y: -2 }}
                className="bg-[#0D1526] border border-cyan-900/30 rounded-xl p-5 relative overflow-hidden group hover:border-cyan-500/40 transition-colors"
                style={{ borderLeft: `3px solid ${secret.categoryColor}33` }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all"
                  style={{ backgroundColor: secret.categoryColor + "80" }} />
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center border"
                      style={{ backgroundColor: secret.categoryColor + "15", borderColor: secret.categoryColor + "40" }}>
                      <Icon className="w-5 h-5" style={{ color: secret.categoryColor }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base leading-tight">{secret.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{secret.categoryName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleFavorite(secret.id)} className={`p-1.5 rounded-md transition-colors ${secret.isFavorite ? "text-yellow-400" : "text-slate-500 hover:text-white"}`}>
                      <Star className={`w-3.5 h-3.5 ${secret.isFavorite ? "fill-current" : ""}`} />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0D1526] border-cyan-900/50 text-white">
                        <DropdownMenuItem asChild className="gap-2 cursor-pointer hover:bg-cyan-500/10">
                          <Link href={`/secrets/${secret.id}`}><Eye className="w-4 h-4" /> View</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(secret.id)} className="gap-2 cursor-pointer text-red-400 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {secret.tags && secret.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {secret.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{tag}</span>
                    ))}
                  </div>
                )}
                <Link href={`/secrets/${secret.id}`} className="absolute inset-0" />
              </motion.div>
            );
          })}

          {/* Add New Card */}
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => setShowModal(true)}
            className="border-2 border-dashed border-cyan-900/40 hover:border-cyan-500/50 rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-cyan-400 transition-all min-h-[110px]"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-current flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Add New Secret</span>
          </motion.button>

          {(!secrets || secrets.length === 0) && !search && null}
        </div>

        {secrets && secrets.length === 0 && !search && (
          <div className="py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-9 h-9 text-cyan-400/50" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your vault is empty</h2>
            <p className="text-slate-400 mb-6">Add your first secret — password, API key, or note.</p>
            <button onClick={() => setShowModal(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Plus className="w-4 h-4 inline mr-2" />Add First Secret
            </button>
          </div>
        )}
      </main>

      <AddSecretModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
