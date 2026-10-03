import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'indigo', subtitle, loading }) {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      ring: 'group-hover:ring-indigo-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      ring: 'group-hover:ring-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      ring: 'group-hover:ring-amber-100',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      ring: 'group-hover:ring-blue-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      ring: 'group-hover:ring-purple-100',
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            {loading ? (
              <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
            ) : (
              <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3.5 rounded-xl ${scheme.bg} ${scheme.text} border ${scheme.border} transition-transform group-hover:scale-105`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
