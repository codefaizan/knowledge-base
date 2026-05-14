"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useSubscriptions } from "@/hooks/use-subscriptions";

const links = [
  { href: "/", label: "Home", icon: (p: string) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={p} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z"/></svg>
  ) },
  { href: "/subscriptions", label: "Subscriptions", icon: (p: string) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={p} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="14" rx="2" ry="2"/><path d="M8 2v4M16 2v4"/></svg>
  ) },
];

export function Sidebar() {
  const pathname = usePathname() ?? "/";
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const { expiringSoonCount } = useSubscriptions(user?.id);

  return (
    <aside className={`h-screen sticky top-0 left-0 z-20 bg-zinc-950 border-r border-zinc-800 transition-all ${collapsed ? "w-16" : "w-64"}`}>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-3 py-3">
          {!collapsed ? (
            <div>
              <div className="text-sm font-semibold text-zinc-100">Knowledge</div>
              <div className="text-xs text-zinc-500">Personal</div>
            </div>
          ) : (
            <div className="text-sm font-semibold text-zinc-100">K</div>
          )}
          <button
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed((s) => !s)}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded"
          >
            {collapsed ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            )}
          </button>
        </div>

        <nav className="mt-3 px-2 flex-1">
          <ul className="space-y-1">
            {links.map((l) => {
              const active = pathname === l.href || (l.href !== "/" && pathname?.startsWith(l.href));
              const isSubscriptions = l.href === "/subscriptions";
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`relative flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-zinc-900 ${active ? "bg-zinc-900 text-zinc-100" : "text-zinc-400"}`}
                  >
                    <span className="flex-none text-zinc-300" aria-hidden>
                      {l.icon(active ? "#fff" : "#9ca3af")}
                    </span>
                    {!collapsed && <span className="text-sm flex-1">{l.label}</span>}
                    {!collapsed && isSubscriptions && expiringSoonCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[11px] font-medium bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
                        {expiringSoonCount}
                      </span>
                    )}
                    {collapsed && isSubscriptions && expiringSoonCount > 0 && (
                      <span className="absolute right-2 top-1.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-medium bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
                        {expiringSoonCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-3 py-3 space-y-2">
          <button
            type="button"
            onClick={signOut}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md border border-zinc-800 bg-zinc-900/70 hover:bg-zinc-900 transition-colors text-zinc-300 hover:text-zinc-100 ${collapsed ? "justify-center" : "justify-start"}`}
          >
            <span aria-hidden className="flex-none text-zinc-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/><path d="M13 5v-2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2"/></svg>
            </span>
            {!collapsed && <span className="text-sm">Sign out</span>}
          </button>

          {!collapsed ? (
            <div className="text-xs text-zinc-500">v1.0</div>
          ) : (
            <div className="text-xs text-zinc-500 text-center">v1</div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
