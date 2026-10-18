import React from 'react';
import { Inbox, AlertCircle, FileSearch } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionButton?: React.ReactNode;
  icon?: 'inbox' | 'search' | 'alert';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionButton,
  icon = 'inbox'
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
      <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
        {icon === 'search' && <FileSearch className="w-7 h-7" />}
        {icon === 'alert' && <AlertCircle className="w-7 h-7" />}
        {icon === 'inbox' && <Inbox className="w-7 h-7" />}
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      {actionButton}
    </div>
  );
};
