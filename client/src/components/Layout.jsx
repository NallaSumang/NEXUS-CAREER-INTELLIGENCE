import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutGrid, FileText, Briefcase, MessageSquare, LineChart, LogOut } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Command Center', icon: LayoutGrid },
  { path: '/resumes', label: 'Neural Hub', icon: FileText },
  { path: '/applications', label: 'Active Targets', icon: Briefcase },
  { path: '/interview', label: 'Combat Prep', icon: MessageSquare },
  { path: '/analytics', label: 'Trajectory', icon: LineChart },
];

export default function Layout({ onLogout }) {
  return (
    <div className="flex h-screen bg-[#0A0A0A] text-[#888888] font-sans overflow-hidden selection:bg-[#333333] selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#222222] flex flex-col bg-[#0A0A0A]">
        <div className="p-8 border-b border-[#222222]">
          <span className="text-xl font-bold tracking-tighter text-white font-serif">PlaceIQ</span>
          <p className="text-[10px] tracking-widest uppercase text-[#555555] mt-2">v2.0.4 Online</p>
        </div>

        <nav className="flex-1 py-8 px-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 text-[10px] tracking-widest uppercase transition-colors ${
                    isActive 
                      ? 'bg-white text-black font-bold' 
                      : 'text-[#888888] hover:bg-[#111111] hover:text-white'
                  }`
                }
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-8 border-t border-[#222222]">
          <button 
            onClick={onLogout}
            className="flex items-center gap-4 w-full px-4 py-3 text-[10px] tracking-widest uppercase text-[#888888] hover:bg-[#111111] hover:text-white transition-colors text-left"
          >
            <LogOut size={16} />
            Disconnect
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0A0A0A] relative">
        <Outlet />
      </main>
    </div>
  );
}
