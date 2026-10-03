import React from 'react';
import { useApp } from '../../context/AppContext';
import ApiStatusBadge from './ApiStatusBadge';
import { Menu, Plus, RefreshCw } from 'lucide-react';

export default function Navbar({ onOpenMobile, onOpenNewTask }) {
  const { currentPage, refreshAll, apiStatus } = useApp();

  const titles = {
    dashboard: {
      title: 'Dashboard Overview',
      subtitle: 'Real-time performance, workload distribution and active assignments',
    },
    staff: {
      title: 'Staff Directory',
      subtitle: 'Employee profiles, roles, contact details, and hourly compensation',
    },
    projects: {
      title: 'Projects Portfolio',
      subtitle: 'Active initiatives and project assignments tracked across teams',
    },
    tasks: {
      title: 'Task Management',
      subtitle: 'Track work items, logged hours, Jira references, and computed earnings',
    },
  };

  const currentMeta = titles[currentPage] || titles.dashboard;

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between transition-all">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {currentMeta.title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right: API Status, Refresh, Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* API Status Badge */}
        <ApiStatusBadge />

        {/* Global New Task Action */}
        <button
          onClick={onOpenNewTask}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-all hover:shadow-indigo-500/20 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>
    </header>
  );
}
