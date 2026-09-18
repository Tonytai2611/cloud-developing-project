import React from 'react';
import { Bell, ChevronDown, LogOut, Search } from 'lucide-react';

export default function AdminTopbar({ user, query = '', setQuery = () => {}, onLogout, searchPlaceholder = 'Search dashboard actions…', title = 'Admin Dashboard', subtitle = 'Manage your restaurant, delight your customers.' }) {
  const name = user?.name || user?.email || 'Admin';
  return (
    <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-7">
      <div className="hidden md:block"><h1 className="text-xl font-black text-slate-950">{title}</h1><p className="text-xs text-slate-500">{subtitle}</p></div>
      <label className="relative min-w-0 flex-1 md:max-w-md">
        <span className="sr-only">Search dashboard</span><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-2 outline-transparent outline-offset-1 placeholder:text-slate-400 focus-visible:border-teal-600 focus-visible:outline-teal-600" />
      </label>
      <div className="flex items-center gap-2 sm:gap-4">
        <button type="button" aria-label="Notifications" className="relative grid h-11 w-11 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"><Bell className="h-5 w-5" /><span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" /></button>
        <div className="hidden items-center gap-3 sm:flex"><span className="grid h-10 w-10 place-items-center rounded-full bg-teal-700 font-bold text-white">{name.charAt(0).toUpperCase()}</span><div className="max-w-28"><p className="truncate text-sm font-bold text-slate-900">{name}</p><p className="text-xs text-slate-500">Restaurant Manager</p></div><ChevronDown className="h-4 w-4 text-slate-400" /></div>
        <button type="button" onClick={onLogout} className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm hover:border-teal-700 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 sm:px-4"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Logout</span></button>
      </div>
    </header>
  );
}
