import React from 'react';
import { TrendingUp } from 'lucide-react';
import { dashboardStats } from '../services/adminDashboardService';

const tones = {
  teal: 'bg-teal-100 text-teal-700', amber: 'bg-amber-100 text-amber-700', emerald: 'bg-emerald-100 text-emerald-700', violet: 'bg-violet-100 text-violet-700',
};

export default function StatsGrid() {
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Restaurant statistics">{dashboardStats.map(({ label, value, change, icon: Icon, tone }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${tones[tone]}`}><Icon className="h-6 w-6" /></span><span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><TrendingUp className="h-4 w-4" />{change}</span></div><p className="mt-4 text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">vs. last month</p></article>)}</section>;
}
