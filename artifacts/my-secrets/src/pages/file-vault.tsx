import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import React, { useState, useRef } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import {
  useListVaultFiles,
  useCreateVaultFile,
  useDeleteVaultFile,
  useToggleFavoriteVaultFile,
  useUpdateVaultFile,
  getListVaultFilesQueryKey,
  requestUploadUrl,
} from "@workspace/api-client-react";
import { 
  HardDrive, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  File, 
  FileJson, 
  Star, 
  MoreVertical, 
  Download, 
  Edit2, 
  Trash2,
  UploadCloud
} from "lucide-react";
import { motion } from "framer-motion";
import { ObjectUploader } from "@workspace/object-storage-web";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function getFileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return ImageIcon;
  if (contentType === 'application/pdf') return FileText;
  if (contentType === 'application/json') return FileJson;
  if (contentType.includes('document')) return FileText;
  return File;
}

function getFileBadge(contentType: string) {
  if (contentType.startsWith('image/')) return 'IMAGE';
  if (contentType === 'application/pdf') return 'PDF';
  if (contentType.includes('document')) return 'DOC';
  if (contentType === 'application/json') return 'JSON';
  return 'FILE';
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function FileVault() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Images" | "Documents" | "PDFs" | "Other">("All");
  // Maps uppy file id → { objectPath, name, type, size } so onComplete can register files
  const pendingUploads = useRef<Map<string, { objectPath: string; name: string; type: string; size: number }>>(new Map());
  
  const { data: files } = useListVaultFiles({
    search: search ? search : undefined,
  });
  
  const createVaultFile = useCreateVaultFile();
  const toggleFavorite = useToggleFavoriteVaultFile();
  const deleteFile = useDeleteVaultFile();
  const updateFile = useUpdateVaultFile();

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [renameFile, setRenameFile] = useState<{id: number, name: string} | null>(null);

  const handleGetUploadParameters = async (file: import("@uppy/core").UppyFile<Record<string, unknown>, Record<string, unknown>>) => {
    const fileSize = file.size ?? 0;
    const res = await requestUploadUrl({
      name: file.name,
      size: fileSize,
      contentType: file.type || "application/octet-stream",
    });
    pendingUploads.current.set(file.id, {
      objectPath: res.objectPath,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: fileSize,
    });
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
          contentType: meta.type,
          size: meta.size,
          description: "",
          tags: [],
        },
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVaultFilesQueryKey() });
        },
      });
    }
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteFile.mutate({ id: deleteConfirmId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVaultFilesQueryKey() });
          setDeleteConfirmId(null);
        }
      });
    }
  };

  const handleRename = () => {
    if (renameFile) {
      updateFile.mutate({ id: renameFile.id, data: { name: renameFile.name } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVaultFilesQueryKey() });
          setRenameFile(null);
        }
      });
    }
  };

  const filteredFiles = files?.filter(f => {
    if (filterType === "All") return true;
    if (filterType === "Images") return f.contentType.startsWith("image/");
    if (filterType === "PDFs") return f.contentType === "application/pdf";
    if (filterType === "Documents") return f.contentType.includes("document") || f.contentType.includes("text");
    return !f.contentType.startsWith("image/") && f.contentType !== "application/pdf" && !f.contentType.includes("document");
  }) || [];

  const totalSize = files?.reduce((acc, f) => acc + f.size, 0) || 0;
  const favoritesCount = files?.filter(f => f.isFavorite).length || 0;

  return (
    <div className="min-h-screen bg-[#050A14] text-white flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <HardDrive className="w-8 h-8 text-cyan-500" />
              <h1 className="text-3xl font-bold">File Vault</h1>
            </div>
            <p className="text-slate-400 mt-2">All files encrypted client-side with AES-256-GCM.</p>
          </div>
          <ObjectUploader
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]"
          >
            <UploadCloud className="w-4 h-4" /> Upload File
          </ObjectUploader>
        </header>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search vault..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0D1526] border border-cyan-900/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="flex gap-2 p-1 bg-[#0D1526] border border-cyan-900/30 rounded-xl overflow-x-auto w-full md:w-auto">
            {["All", "Images", "Documents", "PDFs", "Other"].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterType === type ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {files && files.length > 0 && (
          <div className="flex items-center gap-6 mb-6 p-4 bg-[#0D1526] border border-cyan-900/30 rounded-xl text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Total Files:</span>
              <span className="font-semibold text-white">{files.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Storage Used:</span>
              <span className="font-semibold text-white">{formatBytes(totalSize)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Favorites:</span>
              <span className="font-semibold text-white">{favoritesCount}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map(file => {
            const Icon = getFileIcon(file.contentType);
            return (
              <motion.div 
                key={file.id} 
                whileHover={{ scale: 1.01 }}
                className="bg-slate-900/60 border border-white/5 rounded-xl p-5 relative overflow-hidden group flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-wider text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        {getFileBadge(file.contentType)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => toggleFavorite.mutate({ id: file.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListVaultFilesQueryKey() }) })}
                      className={`p-1.5 rounded-md transition-colors ${file.isFavorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}
                    >
                      <Star className={`w-4 h-4 ${file.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0D1526] border-cyan-900/50 text-white">
                        <DropdownMenuItem onClick={() => window.open('/api/storage' + file.objectPath, '_blank')} className="gap-2 cursor-pointer hover:bg-cyan-500/10 hover:text-cyan-400">
                          <Download className="w-4 h-4" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRenameFile({ id: file.id, name: file.name })} className="gap-2 cursor-pointer hover:bg-cyan-500/10 hover:text-cyan-400">
                          <Edit2 className="w-4 h-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteConfirmId(file.id)} className="gap-2 cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-300">
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <h3 className="font-semibold text-base mb-1 truncate" title={file.name}>{file.name}</h3>
                
                <div className="flex justify-between items-center mt-auto pt-4 text-xs text-slate-400 border-t border-white/5">
                  <span>{formatBytes(file.size)}</span>
                  <span>{formatDistanceToNow(new Date(file.createdAt))} ago</span>
                </div>
              </motion.div>
            );
          })}
          
          {files && files.length === 0 && !search && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-full bg-cyan-500/5 flex items-center justify-center mb-6 border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                <HardDrive className="w-10 h-10 text-cyan-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Your file vault is empty</h2>
              <p className="text-slate-400 mb-6 max-w-sm">Securely store your sensitive documents, keys, and files with client-side encryption.</p>
              
              <ObjectUploader
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
              >
                <UploadCloud className="w-5 h-5" /> Upload your first file
              </ObjectUploader>
            </div>
          )}
          
          {files && files.length > 0 && filteredFiles.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-cyan-900/30 rounded-xl">
              No files match your search or filter.
            </div>
          )}
        </div>

        <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
          <AlertDialogContent className="bg-[#0D1526] border-cyan-900/50 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                This action cannot be undone. This will permanently delete the file from your vault.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-slate-800 text-white hover:bg-slate-700 border-none">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-500 text-white">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={!!renameFile} onOpenChange={(open) => !open && setRenameFile(null)}>
          <DialogContent className="bg-[#0D1526] border-cyan-900/50 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rename File</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input 
                value={renameFile?.name || ''} 
                onChange={(e) => setRenameFile(prev => prev ? {...prev, name: e.target.value} : null)}
                className="bg-slate-900/50 border-cyan-500/20 text-white focus:border-cyan-500 focus:ring-cyan-500"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRenameFile(null)} className="hover:bg-slate-800 text-slate-300">Cancel</Button>
              <Button onClick={handleRename} className="bg-cyan-600 hover:bg-cyan-500 text-white">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
