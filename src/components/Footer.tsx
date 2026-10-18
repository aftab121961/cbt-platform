import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-slate-500 font-medium">
          Horizon CBT © 2026 — Smart Computer Based Testing Platform
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
          <span>Classes V–XII Engine</span>
          <span>•</span>
          <span>PYQ & Practice Analytics</span>
          <span>•</span>
          <span>Supabase Ready Architecture</span>
        </div>
      </div>
    </footer>
  );
};
