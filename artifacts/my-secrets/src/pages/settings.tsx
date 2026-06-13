import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useUser, useClerk } from "@clerk/react";
import { Shield, User, Bell, Lock, LogOut, ChevronRight, Check, Moon, Key } from "lucide-react";
import { motion } from "framer-motion";

const AUTOLOCK_KEY = "vault_autolock_minutes";

export default function Settings() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [autolock, setAutolock] = useState(() => localStorage.getItem(AUTOLOCK_KEY) || "15");
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState(() => localStorage.getItem("vault_notifications") === "true");
  const [twoFactor] = useState(false);

  const handleSaveAutolock = (val: string) => {
    setAutolock(val);
    localStorage.setItem(AUTOLOCK_KEY, val);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleToggleNotifications = () => {
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem("vault_notifications", String(next));
  };

  const sections = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "account", label: "Account", icon: Key },
  ];

  const [active, setActive] = useState("profile");

  return (
    <div className="min-h-screen bg-[#050A14] text-white flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-500" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <p className="text-slate-400 mt-2">Manage your vault preferences and account.</p>
        </header>

        <div className="flex gap-6 max-w-4xl">
          {/* Settings nav */}
          <div className="w-52 shrink-0">
            <nav className="space-y-1">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                    active === id
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {active === id && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              ))}
            </nav>
          </div>

          {/* Settings content */}
          <div className="flex-1 space-y-4">

            {active === "profile" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0D1526] border border-cyan-900/30 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-5">Profile Information</h2>
                {!isLoaded ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-14 w-14 rounded-full bg-slate-700" />
                    <div className="h-4 w-48 bg-slate-700 rounded" />
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      {user?.imageUrl ? (
                        <img src={user.imageUrl} alt="Avatar" className="w-14 h-14 rounded-full border-2 border-cyan-500/30" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-xl font-bold">
                          {user?.firstName?.[0] ?? "U"}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white">{user?.fullName || "—"}</div>
                        <div className="text-sm text-slate-400">{user?.primaryEmailAddress?.emailAddress || "—"}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400 uppercase tracking-wide mb-1 block">First Name</label>
                        <div className="bg-slate-900/50 border border-cyan-900/30 rounded-lg px-3 py-2 text-white text-sm">{user?.firstName || "—"}</div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 uppercase tracking-wide mb-1 block">Last Name</label>
                        <div className="bg-slate-900/50 border border-cyan-900/30 rounded-lg px-3 py-2 text-white text-sm">{user?.lastName || "—"}</div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wide mb-1 block">Email</label>
                      <div className="bg-slate-900/50 border border-cyan-900/30 rounded-lg px-3 py-2 text-white text-sm flex items-center justify-between">
                        {user?.primaryEmailAddress?.emailAddress || "—"}
                        <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">Verified</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wide mb-1 block">Member Since</label>
                      <div className="bg-slate-900/50 border border-cyan-900/30 rounded-lg px-3 py-2 text-white text-sm">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {active === "security" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0D1526] border border-cyan-900/30 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-5">Security Settings</h2>
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-slate-900/40 rounded-lg border border-cyan-900/20">
                    <div>
                      <div className="font-medium text-white">Auto-lock Vault</div>
                      <div className="text-sm text-slate-400 mt-0.5">Automatically lock after inactivity</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={autolock}
                        onChange={(e) => handleSaveAutolock(e.target.value)}
                        className="bg-slate-900 border border-cyan-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                      >
                        <option value="5">5 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="never">Never</option>
                      </select>
                      {saved && <Check className="w-4 h-4 text-green-400" />}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-900/40 rounded-lg border border-cyan-900/20">
                    <div>
                      <div className="font-medium text-white">Two-Factor Authentication</div>
                      <div className="text-sm text-slate-400 mt-0.5">Add an extra layer of security</div>
                    </div>
                    <span className="text-xs bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/20">
                      {twoFactor ? "Enabled" : "Not set up"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-900/40 rounded-lg border border-cyan-900/20">
                    <div>
                      <div className="font-medium text-white">Encryption</div>
                      <div className="text-sm text-slate-400 mt-0.5">AES-256-GCM client-side encryption</div>
                    </div>
                    <span className="text-xs bg-green-500/10 text-green-400 px-3 py-1 rounded-full border border-green-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {active === "notifications" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0D1526] border border-cyan-900/30 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-5">Notifications</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-900/40 rounded-lg border border-cyan-900/20">
                    <div>
                      <div className="font-medium text-white">Security Alerts</div>
                      <div className="text-sm text-slate-400 mt-0.5">Notify on suspicious activity</div>
                    </div>
                    <button
                      onClick={handleToggleNotifications}
                      className={`relative w-11 h-6 rounded-full transition-colors ${notifications ? "bg-cyan-600" : "bg-slate-700"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-900/40 rounded-lg border border-cyan-900/20">
                    <div>
                      <div className="font-medium text-white">New Login Alerts</div>
                      <div className="text-sm text-slate-400 mt-0.5">Get notified on new sign-ins</div>
                    </div>
                    <span className="text-xs bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20">Via Email</span>
                  </div>
                </div>
              </motion.div>
            )}

            {active === "account" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0D1526] border border-cyan-900/30 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-5">Account</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900/40 rounded-lg border border-cyan-900/20">
                    <div className="font-medium text-white mb-1">Vault ID</div>
                    <div className="text-sm text-slate-400 font-mono break-all">{user?.id || "—"}</div>
                  </div>
                  <div className="p-4 bg-slate-900/40 rounded-lg border border-cyan-900/20">
                    <div className="font-medium text-white mb-1">Connected Accounts</div>
                    <div className="mt-2 space-y-2">
                      {user?.externalAccounts?.length ? user.externalAccounts.map((acc) => (
                        <div key={acc.id} className="flex items-center gap-2 text-sm text-slate-300">
                          <Check className="w-4 h-4 text-green-400" />
                          {acc.provider} — {acc.emailAddress}
                        </div>
                      )) : (
                        <div className="text-sm text-slate-400">No external accounts connected.</div>
                      )}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-red-900/20">
                    <button
                      onClick={() => signOut({ redirectUrl: "/" })}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors text-sm font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out of vault
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
