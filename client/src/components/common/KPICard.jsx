import React from 'react';

export default function KPICard({ title, value, icon: Icon, color = 'blue', subtitle }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    yellow: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorClasses[color] || colorClasses.blue}`}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
