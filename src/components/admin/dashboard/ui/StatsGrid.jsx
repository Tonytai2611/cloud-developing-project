import React from 'react';
import { CalendarCheck2, CircleDollarSign, ShoppingBag, TrendingUp, UtensilsCrossed } from 'lucide-react';

const tones = {
  teal: 'bg-teal-100 text-teal-700', amber: 'bg-amber-100 text-amber-700', emerald: 'bg-emerald-100 text-emerald-700', violet: 'bg-violet-100 text-violet-700',
};

export default function StatsGrid({ summary, loading }) {
  const stats = [
    { label: 'Total Bookings', value: summary?.stats?.totalBookings, change: summary?.stats?.ordersChangePercent, icon: ShoppingBag, tone: 'teal' },
    { label: 'Food Orders', value: summary?.stats?.foodOrders, change: null, icon: UtensilsCrossed, tone: 'amber' },
    { label: 'Revenue', value: summary?.stats?.revenue, change: summary?.stats?.revenueChangePercent, icon: CircleDollarSign, tone: 'violet' },
    { label: "Today's Reservations", value: summary?.stats?.todayReservations, change: null, icon: CalendarCheck2, tone: 'emerald' },
  ];
  const displayValue = (stat) => stat.value === undefined || stat.value === null ? '—' : stat.label === 'Total Revenue' ? `${Number(stat.value).toLocaleString()}đ` : Number(stat.value).toLocaleString();
  const displayChange = (change) => change === null || change === undefined ? '—' : `${change >= 0 ? '+' : ''}${change}%`;
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Restaurant statistics">{stats.map((stat) => { const { label, icon: Icon, tone } = stat; return <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${tones[tone]}`}><Icon className="h-6 w-6" /></span><span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><TrendingUp className="h-4 w-4" />{loading ? '…' : displayChange(stat.change)}</span></div><p className="mt-4 text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{loading ? '—' : displayValue(stat)}</p><p className="mt-1 text-xs text-slate-400">vs. last month</p></article>; })}</section>;
}
