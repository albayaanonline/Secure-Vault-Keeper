import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AddSecretModal } from "@/components/AddSecretModal";
import { useGetMe, useListSecrets, useListVaultFiles, useListCategories } from "@workspace/api-client-react";
import { Shield, Lock, HardDrive, Tag, Plus, Key, StickyNote, Upload, ArrowRight, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

const QUICK_ACTIONS = [
  { label: "Add Password", type: "password", icon: Lock, color: "#3B82F6" },
  { label: "Add API Key", type: "api-key", icon: Key, color: "#8B5CF6" },
  { label: "Add Note", type: "note", icon: StickyNote, color: "#06B6D4" },
  { label: "Upload File", type: "file", icon: Upload, color: "#10B981" },
];

export default function Dashboard() {
  const { data: user } = useGetMe();
  const { data: secrets } = useListSecrets();
  const { data: vaultFiles } = useListVaultFiles();
  const { data: categories } = useListCategories();

  const [showModal, setShowModal] = useState(false);
  const [defaultType, setDefaultType] = useState("password");

  const openModal = (type: string) => { setDefaultType(type); setShowModal(true); };

  const favorites = secrets?.filter(s => s.isFavorite) ?? [];
  const recentSecrets = secrets?.slice(0, 5) ?? [];
  const totalSecrets = secrets?.length ?? 0;
  const totalFiles = vaultFiles?.length ?? 0;
  const totalCategories = categories?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#050A14] text-white flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Command Center</h1>
            <p className="text-slate-400 mt-1">
              Welcome back{user?.displayName ? `, ${user.displayName}` : ""}. Your vault is secure.
            </p>
          </div>
          <button
            onClick={() => openModal("password")}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all"
          >
            <Plus className="w-4 h-4" /> New Secret
          </button>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {[
            { label: "Total Secrets", value: totalSecrets, icon: Lock, color: "cyan" },
            { label: "Files Stored", value: totalFiles, icon: HardDrive, color: "purple" },
            { label: "Categories", value: totalCategories, icon: Tag, color: "green" },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-[#0D1526] border border-cyan-900/30 rounded-xl p-5 relative overflow-hidden"
            >
              <div className={`absolute top-3 right-3 opacity-10`}>
                <Icon className="w-14 h-14" />
              </div>
              <div className={`text-sm font-medium mb-1 ${color === "cyan" ? "text-cyan-400" : color === "purple" ? "text-purple-400" : "text-green-400"}`}>
                {label}
              </div>
              <div className="text-4xl font-bold">{value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-[#0D1526] border border-cyan-900/30 rounded-xl p-5">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" /> Quick Add
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map(({ label, type, icon: Icon, color }) => (
                <button
                  key={type}
                  onClick={() => openModal(type)}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-800 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-800/40 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 transition-colors"
                    style={{ backgroundColor: color + "18", borderColor: color + "40" }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{label}</div>
                    <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">Click to add</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Secrets */}
          <div className="bg-[#0D1526] border border-cyan-900/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" /> Recent Secrets
              </h2>
              <Link href="/secrets" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentSecrets.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-sm">
                No secrets yet.{" "}
                <button onClick={() => openModal("password")} className="text-cyan-400 hover:underline">Add one</button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSecrets.map(secret => (
                  <Link
                    key={secret.id}
                    href={`/secrets/${secret.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/40 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0"
                      style={{ backgroundColor: secret.categoryColor + "15", borderColor: secret.categoryColor + "40" }}>
                      <Lock className="w-4 h-4" style={{ color: secret.categoryColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{secret.title}</div>
                      <div className="text-xs text-slate-500">{secret.categoryName}</div>
                    </div>
                    {secret.isFavorite && <Star className="w-3.5 h-3.5 text-yellow-400 fill-current shrink-0" />}
                    <span className="text-xs text-slate-600 shrink-0">
                      {formatDistanceToNow(new Date(secret.createdAt), { addSuffix: true })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Favorites */}
          {favorites.length > 0 && (
            <div className="bg-[#0D1526] border border-yellow-900/20 rounded-xl p-5 lg:col-span-2">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" /> Favorites
              </h2>
              <div className="flex flex-wrap gap-3">
                {favorites.map(secret => (
                  <Link
                    key={secret.id}
                    href={`/secrets/${secret.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/15 hover:border-yellow-500/30 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-sm font-medium">{secret.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <AddSecretModal open={showModal} onClose={() => setShowModal(false)} defaultType={defaultType} />
    </div>
  );
}
