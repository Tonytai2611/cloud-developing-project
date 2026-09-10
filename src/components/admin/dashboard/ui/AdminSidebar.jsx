import React from 'react';
import { Coffee } from 'lucide-react';
import { adminNavigation, secondaryNavigation } from '../services/adminDashboardService';

export default function AdminSidebar({ currentPath, navigate }) {
  const renderItem = (item) => {
    const Icon = item.icon;
    const active = item.route === '/admin' ? currentPath === item.route : currentPath.startsWith(item.route || '__');
    return (
      <button
        key={item.label}
        type="button"
        disabled={item.disabled}
        onClick={() => item.route && navigate(item.route)}
        className={`group flex min-h-11 w-full items-center gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 ${active ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
        aria-current={active ? 'page' : undefined}
      >
        <Icon className={`h-5 w-5 ${active ? 'text-teal-700' : 'text-slate-500 group-hover:text-teal-700'}`} />
        <span className="flex-1">{item.label}</span>
        {item.badge && <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs text-white">{item.badge}</span>}
      </button>
    );
  };

  return (
    <aside className="border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-5 lg:px-7">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-800 text-amber-200"><Coffee className="h-6 w-6" /></span>
        <div><p className="text-xl font-black tracking-tight text-slate-900">BrewCraft</p><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700">Restaurant & Cafe</p></div>
      </div>
      <nav className="flex gap-2 overflow-x-auto p-3 lg:block lg:space-y-1 lg:overflow-visible lg:p-5" aria-label="Admin navigation">
        {adminNavigation.map(renderItem)}
        <div className="hidden pt-4 lg:block"><div className="mb-3 h-px bg-slate-100" />{secondaryNavigation.map(renderItem)}</div>
      </nav>
      <div className="mx-5 mt-auto hidden rounded-2xl bg-gradient-to-br from-teal-50 to-amber-50 p-5 lg:absolute lg:bottom-6 lg:block lg:w-[calc(100%-2.5rem)]">
        <Coffee className="mb-3 h-8 w-8 text-teal-700" />
        <p className="font-bold text-slate-900">Great food brings people together.</p>
        <p className="mt-2 text-xs text-slate-500">BrewCraft admin workspace</p>
      </div>
    </aside>
  );
}
