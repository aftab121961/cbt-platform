import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading Horizon CBT...' }) => {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center p-8">
      <Loader2 className="w-9 h-9 text-blue-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-600 animate-pulse">{message}</p>
    </div>
  );
};
