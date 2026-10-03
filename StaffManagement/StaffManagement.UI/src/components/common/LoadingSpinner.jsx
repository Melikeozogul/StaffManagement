import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading data from API...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <div className="absolute inset-0 rounded-full border-2 border-indigo-200 opacity-25"></div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500 animate-pulse">{message}</p>
    </div>
  );
}
