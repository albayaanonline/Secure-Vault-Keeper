import React from "react";
import { Shield, Lock, Activity, LayoutDashboard, Key, LogOut, HardDrive } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";

export function Sidebar() {
  const [location] = useLocation();
  const { signOut } = useClerk();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/secrets", label: "Vault", icon: Lock },
    { href: "/file-vault", label: "File Vault", icon: HardDrive },
    { href: "/categories", label: "Categories", icon: Key },
    { href: "/activity", label: "Activity", icon: Activity },
    { href: "/settings", label: "Settings", icon: Shield },
  ];

  return (
    <div className="w-64 bg-[#0D1526] border-r border-cyan-900/30 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3">
        <Shield className="w-8 h-8 text-cyan-500" />
        <span className="text-xl font-bold tracking-tight text-white">My Secrets</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || location.startsWith(link.href + "/");
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]" 
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-cyan-900/30">
        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Lock Vault
        </button>
      </div>
    </div>
  );
}