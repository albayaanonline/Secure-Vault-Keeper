import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AddSecretModal } from "@/components/AddSecretModal";
import { useListCategories, useCreateCategory, useDeleteCategory, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { Tag, Plus, Lock, Key, FileText, Database, Terminal, Shield, StickyNote, Server, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  lock: Lock, key: Key, "file-text": FileText, database: Database,
  terminal: Terminal, shield: Shield, "sticky-note": StickyNote, server: Server,
};

const COLOR_OPTIONS = ["#3B82F6", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#F97316", "#EC4899", "#6366F1"];

export default function Categories() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useListCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [showAdd, setShowAdd] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    createCategory.mutate({ data: { name: newName.trim(), icon: "key", color: newColor } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
        setNewName(""); setNewColor(COLOR_OPTIONS[0]); setShowAdd(false); setSaving(false);
      },
      onError: () => setSaving(false),
    });
  };

  const handleDelete = (id: number) => {
    deleteCategory.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() }),
    });
  };

  return (
    <div className="min-h-screen bg-[#050A14] text-white flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <Tag className="w-8 h-8 text-cyan-500" />
              <h1 className="text-3xl font-bold">Categories</h1>
            </div>
            <p className="text-slate-400 mt-2">Organize your secrets into groups.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSecretModal(true)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all"
            >
              <Plus className="w-4 h-4" /> New Secret
            </button>
            <button
              onClick={() => setShowAdd(v => !v)}
              className="bg-slate-800 hover:bg-slate-700 border border-cyan-900/30 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all"
            >
              <Tag className="w-4 h-4" /> New Category
            </button>
          </div>
        </header>

        {/* New Category Form */}
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-[#0D1526] border border-cyan-500/30 rounded-xl p-5 max-w-md"
          >
            <h3 className="text-sm font-semibold mb-4 text-cyan-400">Create Custom Category</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide mb-1 block">Name</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Work Credentials"
                  className="w-full bg-slate-900/50 border border-cyan-900/30 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide mb-2 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c} type="button" onClick={() => setNewColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${newColor === c ? "border-white scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving || !newName.trim()} className="flex-1 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold disabled:opacity-60 transition-colors">
                  {saving ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#0D1526] border border-cyan-900/20 rounded-xl p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories?.map(cat => {
              const Icon = ICON_MAP[cat.icon] ?? Key;
              return (
                <motion.div
                  key={cat.id}
                  whileHover={{ y: -2 }}
                  className="bg-[#0D1526] border border-cyan-900/20 hover:border-cyan-900/50 rounded-xl p-5 flex items-center gap-4 group transition-all relative overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-5 rounded-xl" style={{ background: `radial-gradient(circle at 0% 50%, ${cat.color}, transparent 70%)` }} />
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0"
                    style={{ backgroundColor: cat.color + "18", borderColor: cat.color + "40" }}
                  >
                    <Icon className="w-6 h-6" style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{cat.name}</div>
                    <div className="text-sm text-slate-400 mt-0.5">
                      {cat.secretCount} secret{cat.secretCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                  {!cat.isSystem && (
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {cat.isSystem && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">System</span>
                  )}
                </motion.div>
              );
            })}

            {/* Add Category Card */}
            <motion.button
              whileHover={{ y: -2 }}
              onClick={() => setShowAdd(true)}
              className="border-2 border-dashed border-cyan-900/40 hover:border-cyan-500/50 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-cyan-400 transition-all min-h-[88px]"
            >
              <Plus className="w-6 h-6" />
              <span className="text-sm font-medium">New Category</span>
            </motion.button>
          </div>
        )}
      </main>

      <AddSecretModal open={showSecretModal} onClose={() => setShowSecretModal(false)} />
    </div>
  );
}
