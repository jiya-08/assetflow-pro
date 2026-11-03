import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = String(status).trim();

  // Status mapping to styles & dot colors
  const styles = {
    // Asset statuses
    Available: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    Assigned: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10',
    'Under Maintenance': 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
    Retired: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',

    // Booking & Maintenance statuses
    Pending: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    'In Progress': 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/10',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
    Cancelled: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',

    // Priorities
    Low: 'bg-slate-100 text-slate-700 border-slate-200',
    Medium: 'bg-blue-50 text-blue-700 border-blue-200',
    High: 'bg-amber-50 text-amber-700 border-amber-200',
    Critical: 'bg-rose-50 text-rose-700 border-rose-200',

    // Employee statuses
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Inactive: 'bg-slate-100 text-slate-600 border-slate-200',
    'On Leave': 'bg-amber-50 text-amber-700 border-amber-200'
  };

  const dotColors = {
    Available: 'bg-emerald-500',
    Assigned: 'bg-blue-500',
    'Under Maintenance': 'bg-amber-500',
    Retired: 'bg-rose-500',
    Pending: 'bg-amber-500',
    Approved: 'bg-emerald-500',
    'In Progress': 'bg-indigo-500 animate-pulse',
    Completed: 'bg-emerald-500',
    Rejected: 'bg-rose-500',
    Cancelled: 'bg-slate-400',
    Low: 'bg-slate-400',
    Medium: 'bg-blue-500',
    High: 'bg-amber-500',
    Critical: 'bg-rose-500 animate-ping',
    Active: 'bg-emerald-500',
    Inactive: 'bg-slate-400',
    'On Leave': 'bg-amber-500'
  };

  const styleClass = styles[normalized] || 'bg-slate-100 text-slate-700 border-slate-200';
  const dotColor = dotColors[normalized] || 'bg-slate-400';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styleClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {normalized}
    </span>
  );
};

export default StatusBadge;
