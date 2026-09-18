/* Hallmark · pre-emit critique: P4 H5 E5 S5 R5 V4 */
import React, { useMemo, useState } from 'react';
import { ChefHat, ChevronRight, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminMenuCategories } from '../../hooks/useAdminMenuCategories';
import AdminWorkspaceShell from '../../shared/AdminWorkspaceShell';
import MenuCategoryCard from './MenuCategoryCard';

export default function MenuManagementPage() {
  const navigate = useNavigate();
  const menu = useAdminMenuCategories({ navigate });
  const [filter, setFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('az');
  const [expandedId, setExpandedId] = useState(null);
  const categories = useMemo(() => {
    const filtered = menu.filteredMenu.filter((category) => filter === 'with-dishes' ? category.dishes?.length > 0 : filter === 'empty' ? !category.dishes?.length : true);
    return [...filtered].sort((a, b) => (sortOrder === 'az' ? 1 : -1) * (a.title || '').localeCompare(b.title || ''));
  }, [filter, menu.filteredMenu, sortOrder]);
  const dishCount = menu.menuCategories.reduce((total, category) => total + (category.dishes?.length || 0), 0);

  return (
    <AdminWorkspaceShell query={menu.searchTerm} setQuery={menu.setSearchTerm} searchPlaceholder="Search categories or dishes…" title="Menu Management" subtitle="Organize categories, dishes and pricing.">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0"><nav className="mb-2 flex items-center gap-2 text-sm text-slate-500"><button onClick={() => navigate('/admin')} className="hover:text-teal-700">Dashboard</button><ChevronRight className="h-4 w-4" /><span className="text-teal-700">Menu Management</span></nav><h1 className="font-serif text-4xl font-bold text-slate-950">Manage Menu</h1><p className="mt-1 text-slate-500">Organize your menu by category and manage every dish.</p></div>
          <button onClick={() => navigate('/admin/manage-menu/form')} className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-teal-700 px-5 font-bold text-white shadow-sm hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"><Plus className="h-5 w-5" /> Add Category</button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="relative min-w-0 flex-1 xl:max-w-md"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input value={menu.searchTerm} onChange={(event) => menu.setSearchTerm(event.target.value)} placeholder="Search categories…" className="h-11 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></label>
          <div className="flex flex-wrap gap-2">{[['all', 'All Categories'], ['with-dishes', 'With Dishes'], ['empty', 'Empty']].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`h-10 whitespace-nowrap rounded-xl px-4 text-sm font-bold ${filter === value ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}</button>)}</div>
          <label className="ml-auto flex items-center gap-2 whitespace-nowrap text-sm text-slate-500"><SlidersHorizontal className="h-4 w-4" /><span>Sort</span><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-700 outline-none focus:border-teal-600"><option value="az">Name (A–Z)</option><option value="za">Name (Z–A)</option></select></label>
        </div></div>
        <div className="flex justify-end text-sm text-slate-500">Total: {menu.menuCategories.length} categories · {dishCount} dishes</div>
        {menu.loading && menu.menuCategories.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center"><span className="mx-auto block h-9 w-9 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" /><p className="mt-4 font-semibold text-slate-600">Loading menu…</p></div> : categories.length ? <div className="space-y-3">{categories.map((category, index) => <MenuCategoryCard key={category.id} category={category} expanded={expandedId === category.id || (expandedId === null && index === 0)} onToggle={() => setExpandedId((current) => current === category.id ? '' : category.id)} onEdit={() => menu.handleUpdate(category)} onDelete={() => menu.handleDelete(category.id)} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center"><ChefHat className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 text-lg font-bold text-slate-800">No categories found</h2><p className="mt-1 text-sm text-slate-500">Try another search or create a new category.</p></div>}
      </div>
    </AdminWorkspaceShell>
  );
}
