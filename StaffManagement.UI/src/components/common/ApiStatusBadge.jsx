import React from 'react';
import { useApp } from '../../context/AppContext';
import { Activity, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ApiStatusBadge() {
  const { apiStatus, verifyApiHealth, refreshAll, apiUrl } = useApp();

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          apiStatus.checking
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : apiStatus.isOnline
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}
        title={`Target API: ${apiUrl}`}
      >
        <span className="relative flex h-2 w-2">
          {apiStatus.isOnline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              apiStatus.checking
                ? 'bg-amber-500'
                : apiStatus.isOnline
                ? 'bg-emerald-500'
                : 'bg-rose-500'
            }`}
          ></span>
        </span>

        <span className="font-semibold">
          {apiStatus.checking
            ? 'Connecting...'
            : apiStatus.isOnline
            ? 'API Online'
            : 'API Offline (5164)'}
        </span>
      </div>

      <button
        onClick={refreshAll}
        disabled={apiStatus.checking}
        title="Check connection and refresh API data"
        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${apiStatus.checking ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
