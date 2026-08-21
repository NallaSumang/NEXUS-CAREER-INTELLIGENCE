import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutGrid,
  FileText,
  Briefcase,
  MessageSquare,
  LineChart,
  LogOut,
  Hexagon,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Command Center", icon: LayoutGrid },
  { path: "/resumes",   label: "Neural Hub",     icon: FileText   },
  { path: "/applications", label: "Active Targets", icon: Briefcase },
  { path: "/interview", label: "Combat Prep",    icon: MessageSquare },
  { path: "/analytics", label: "Trajectory",     icon: LineChart  },
];

export default function Layout({ onLogout }) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  /* ── Shared nav link renderer ──────────────────────────────── */
  const NavItem = ({ item, collapsed }) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={close}
        title={item.label}
        className={({ isActive }) =>
          `flex items-center gap-4 px-4 py-3 text-[10px] tracking-widest uppercase transition-colors ${
            collapsed ? "justify-center" : ""
          } ${
            isActive
              ? "bg-white text-black font-bold"
              : "text-[#888888] hover:bg-[#111111] hover:text-white"
          }`
        }
      >
        <Icon size={16} className="shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  /* ── Sidebar inner content ──────────────────────────────────── */
  const SidebarInner = ({ collapsed = false }) => (
    <>
      {/* Logo */}
      <div className={`border-b border-white/5 ${collapsed ? "p-4" : "p-8"}`}>
        {collapsed ? (
          <Hexagon className="text-sky-400 mx-auto" size={22} />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Hexagon className="text-sky-400" size={24} />
              <span className="text-xl font-bold tracking-tighter text-white font-serif">
                Nexus
              </span>
            </div>
            <p className="text-[10px] tracking-widest uppercase text-[#555555] mt-2 mb-4">
              v2.0.4 Online
            </p>
            <div className="flex flex-col gap-2 items-start">
              <span className="px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] tracking-widest uppercase rounded">
                Agentic Swarm
              </span>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] tracking-widest uppercase rounded">
                Sumang's Signature Edition
              </span>
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 flex flex-col gap-2 ${collapsed ? "py-6 px-1" : "py-8 px-4"}`}>
        {navItems.map((item) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Logout */}
      <div className={`border-t border-white/10 ${collapsed ? "p-2" : "p-8"}`}>
        <button
          onClick={onLogout}
          title="Disconnect"
          className={`flex items-center gap-4 w-full px-4 py-3 text-[10px] tracking-widest uppercase text-slate-500 hover:bg-white/5 hover:text-white transition-colors text-left ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && "Disconnect"}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen text-slate-300 font-sans overflow-hidden selection:bg-amber-500/30 selection:text-white">

      {/* ── MOBILE: backdrop ─────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={close}
        />
      )}

      {/* ── MOBILE: slide-in full drawer ─────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col
          bg-slate-950/95 border-r border-white/5 backdrop-blur-md
          transform transition-transform duration-300 ease-in-out
          lg:hidden
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Close button inside drawer */}
        <button
          onClick={close}
          className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
        <SidebarInner collapsed={false} />
      </aside>

      {/* ── MOBILE: collapsed icon rail (always visible on mobile) ── */}
      <aside className="flex flex-col w-14 shrink-0 border-r border-white/5 bg-slate-950/40 backdrop-blur-md lg:hidden">
        {/* Hamburger toggle */}
        <button
          onClick={() => setOpen(true)}
          className="p-4 text-slate-500 hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Icon-only nav */}
        <nav className="flex-1 flex flex-col gap-1 py-4">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} collapsed={true} />
          ))}
        </nav>

        {/* Logout icon */}
        <div className="pb-4">
          <button
            onClick={onLogout}
            title="Disconnect"
            className="flex justify-center w-full px-4 py-3 text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── DESKTOP: full static sidebar ─────────────────────────── */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/5 bg-slate-950/40 backdrop-blur-md">
        <SidebarInner collapsed={false} />
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0A0A0A] relative min-w-0">
        <Outlet />
      </main>

    </div>
  );
}

