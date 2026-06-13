import React, { useState, useRef, useEffect } from "react";
import { X, Lock, Key, StickyNote, Upload, Eye, EyeOff, Plus, HardDrive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCreateSecret,
  useListCategories,
  getListSecretsQueryKey,
  requestUploadUrl,
  useCreateVaultFile,
  getListVaultFilesQueryKey,
} from "@workspace/api-client-react";
import { ObjectUploader } from "@workspace/object-storage-web";
import { useQueryClient } from "@tanstack/react-query";

const SECRET_TYPES = [
  { id: "password", label: "Password", icon: Lock, placeholder: "Enter password or secret value..." },
  { id: "api-key", label: "API Key", icon: Key, placeholder: "sk-xxxxxxxxxxxxxxxxxxxx" },
  { id: "note", label: "Private Note", icon: StickyNote, placeholder: "Write your private note here..." },
  { id: "file", label: "File Upload", icon: HardDrive, placeholder: "" },
];

interface AddSecretModalProps {
  open: boolean;
  onClose: () => void;
  defaultType?: string;
}

export function AddSecretModal({ open, onClose, defaultType = "password" }: AddSecretModalProps) {
  const queryClient = useQueryClient();
  const [type, setType] = useState(defaultType);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [tags, setTags] = useState("");
  const [showValue, setShowValue] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pendingUploads = useRef<Map<string, { objectPath: string; name: string; contentType: string; size: number }>>(new Map());

  const { data: categories } = useListCategories();
  const createSecret = useCreateSecret();
  const createVaultFile = useCreateVaultFile();

  // Every time the modal opens OR categories finish loading, sync the selected category
  useEffect(() => {
    if (open && categories && categories.length > 0 && selectedCategoryId === null) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [open, categories]);

  const reset = () => {
    setTitle("");
    setValue("");
    setDescription("");
    setSelectedCategoryId(null);
    setTags("");
    setError("");
    setSaving(false);
    setShowValue(false);
    setType(defaultType);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleGetUploadParameters = async (file: import("@uppy/core").UppyFile<Record<string, unknown>, Record<string, unknown>>) => {
    const fileSize = file.size ?? 0;
    const res = await requestUploadUrl({ name: file.name, size: fileSize, contentType: file.type || "application/octet-stream" });
    pendingUploads.current.set(file.id, { objectPath: res.objectPath, name: file.name, contentType: file.type || "application/octet-stream", size: fileSize });
    return { method: "PUT" as const, url: res.uploadURL, headers: { "Content-Type": file.type || "application/octet-stream" } };
  };

  const handleUploadComplete = (result: import("@uppy/core").UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    for (const uppyFile of result.successful ?? []) {
      const meta = pendingUploads.current.get(uppyFile.id);
      if (!meta) continue;
      pendingUploads.current.delete(uppyFile.id);
      createVaultFile.mutate({
        data: {
          name: meta.name,
          originalName: meta.name,
          objectPath: meta.objectPath,
          contentType: meta.contentType,
          size: meta.size,
          description,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVaultFilesQueryKey() });
          handleClose();
        },
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    if (type !== "file" && !value.trim()) { setError("Value is required"); return; }

    // Resolve categoryId: use selected, or fall back to first available category
    const catId = selectedCategoryId ?? categories?.[0]?.id ?? null;
    if (!catId) {
      setError("Categories are loading, please wait a second and try again.");
      return;
    }

    setSaving(true);
    setError("");

    createSecret.mutate({
      data: {
        title: title.trim(),
        encryptedValue: value,
        categoryId: catId,
        description: description.trim(),
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSecretsQueryKey() });
        setSaving(false);
        handleClose();
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error || err?.message || "Failed to save. Please try again.";
        setError(msg);
        setSaving(false);
      },
    });
  };

  const selectedType = SECRET_TYPES.find(t => t.id === type) || SECRET_TYPES[0];
  const categoriesReady = !!categories?.length;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-[#0D1526] border border-cyan-900/40 rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(6,182,212,0.15)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <selectedType.icon className="w-4 h-4 text-cyan-400" />
                </div>
                <h2 className="text-base font-semibold text-white">Add New Secret</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type Selector */}
            <div className="px-6 pt-4">
              <div className="grid grid-cols-4 gap-2">
                {SECRET_TYPES.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setType(id)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                      type === id
                        ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400"
                        : "bg-slate-900/40 border-slate-700/40 text-slate-400 hover:text-white hover:border-slate-600"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide mb-1.5 block">Title *</label>
                <input
                  autoFocus
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={
                    type === "password" ? "e.g. Gmail Password"
                    : type === "api-key" ? "e.g. OpenAI API Key"
                    : type === "note" ? "e.g. Bank PIN"
                    : "e.g. My Resume"
                  }
                  className="w-full bg-slate-900/50 border border-cyan-900/30 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                />
              </div>

              {/* Value / File */}
              {type === "file" ? (
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wide mb-1.5 block">File from Device *</label>
                  <div className="border border-dashed border-cyan-900/40 rounded-lg p-4 text-center">
                    <ObjectUploader
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete}
                      maxFileSize={52428800}
                      buttonClassName="w-full bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-400 px-4 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                    >
                      <Upload className="w-4 h-4" /> Choose File from Device
                    </ObjectUploader>
                    <p className="text-xs text-slate-500 mt-2">Any file type • Max 50MB</p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wide mb-1.5 block">
                    {type === "note" ? "Content *" : "Secret Value *"}
                  </label>
                  <div className="relative">
                    {type === "note" ? (
                      <textarea
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        placeholder={selectedType.placeholder}
                        rows={4}
                        className="w-full bg-slate-900/50 border border-cyan-900/30 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 resize-none"
                      />
                    ) : (
                      <>
                        <input
                          type={showValue ? "text" : "password"}
                          value={value}
                          onChange={e => setValue(e.target.value)}
                          placeholder={selectedType.placeholder}
                          className="w-full bg-slate-900/50 border border-cyan-900/30 rounded-lg px-3 py-2.5 pr-10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowValue(v => !v)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                        >
                          {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Category + Tags */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wide mb-1.5 block">Category</label>
                  {!categoriesReady ? (
                    <div className="w-full bg-slate-900/50 border border-cyan-900/30 rounded-lg px-3 py-2.5 text-slate-500 text-sm flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-slate-600 border-t-cyan-500 rounded-full animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    <select
                      value={selectedCategoryId ?? ""}
                      onChange={e => setSelectedCategoryId(Number(e.target.value))}
                      className="w-full bg-slate-900/50 border border-cyan-900/30 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                    >
                      {categories?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wide mb-1.5 block">Tags</label>
                  <input
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="work, personal..."
                    className="w-full bg-slate-900/50 border border-cyan-900/30 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Description <span className="text-slate-600 normal-case">(optional)</span>
                </label>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief note about this secret..."
                  className="w-full bg-slate-900/50 border border-cyan-900/30 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              {type !== "file" && (
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors shadow-[0_0_12px_rgba(6,182,212,0.3)] disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {saving
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Plus className="w-4 h-4" />
                    }
                    {saving ? "Saving..." : "Save to Vault"}
                  </button>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
