import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  CheckSquare, 
  CalendarCheck,
  Server,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { currentPage, setCurrentPage, stats, apiStatus, apiUrl } = useApp();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'daily-report',
      label: 'Daily Report',
      icon: CalendarCheck,
      badge: 'Jira',
    },
    {
      id: 'staff',
      label: 'Staff',
      icon: Users,
      badge: stats.totalStaff > 0 ? stats.totalStaff : null,
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderKanban,
      badge: stats.totalProjects > 0 ? stats.totalProjects : null,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      badge: stats.totalTasks > 0 ? stats.totalTasks : null,
    },
  ];

  const handleNavClick = (pageId) => {
    setCurrentPage(pageId);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-base font-sans">StaffPulse</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-500">Staff & Task Hub</p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
            Management
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50/80 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null ? (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-indigo-200/60 text-indigo-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : isActive ? (
                  <ChevronRight className="w-4 h-4 text-indigo-400" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Backend Endpoint Status Card */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-600" />
                Web API Service
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  apiStatus.isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </div>
            <p className="text-[11px] font-mono text-slate-500 truncate" title={apiUrl}>
              {apiUrl}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Status:</span>
              <span
                className={`font-semibold ${
                  apiStatus.isOnline ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {apiStatus.isOnline ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
