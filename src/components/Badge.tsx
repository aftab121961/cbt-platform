import React from 'react';

interface BadgeProps {
  type: 'difficulty' | 'source' | 'type' | 'status';
  value: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ type, value, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';
  const lowerVal = value?.toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (type === 'difficulty') {
    if (lowerVal === 'easy') {
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (lowerVal === 'medium') {
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (lowerVal === 'hard') {
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    } else {
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  } else if (type === 'source') {
    if (lowerVal === 'pyq') {
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
    } else {
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    }
  } else if (type === 'type') {
    colorClasses = 'bg-slate-100 text-slate-800 border-slate-200';
  } else if (type === 'status') {
    if (lowerVal === 'completed') {
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else {
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    }
  }

  return (
    <span className={`inline-flex items-center rounded-md border capitalize font-medium ${sizeClasses} ${colorClasses}`}>
      {value}
    </span>
  );
};
