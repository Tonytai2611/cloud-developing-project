import React from 'react';
import { ChevronDown, Coffee, Edit3, ImageOff, Plus, Trash2, UtensilsCrossed } from 'lucide-react';

const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(price || 0));

export default function MenuCategoryCard({ category, expanded, onToggle, onEdit, onDelete }) {
  const dishCount = category.dishes?.length || 0;
  const CategoryIcon = /coffee|drink|beverage/i.test(category.title || '') ? Coffee : UtensilsCrossed;

  return (
    <article className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${expanded ? 'border-teal-300' : 'border-slate-200'}`}>
      <div className={`flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6 ${expanded ? 'bg-teal-50/60' : 'bg-white'}`}>
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-700"><CategoryIcon className="h-6 w-6" /></span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-3"><span className="truncate font-serif text-xl font-bold text-slate-950">{category.title}</span><span className="whitespace-nowrap rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">{dishCount} dishes</span></span>
            <span className="mt-1 block text-sm text-slate-500">Category ID: {category.id}</span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onEdit} aria-label={`Edit ${category.title}`} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 hover:bg-teal-100 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"><Edit3 className="h-4 w-4" /></button>
          <button type="button" onClick={onDelete} aria-label={`Delete ${category.title}`} className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"><Trash2 className="h-4 w-4" /></button>
          <button type="button" onClick={onToggle} aria-label={expanded ? 'Collapse category' : 'Expand category'} className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"><ChevronDown className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`} /></button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-teal-100 p-4 sm:p-5">
          {dishCount ? <div className="space-y-2">{category.dishes.map((dish, index) => (
            <div key={`${dish.name}-${index}`} className="grid min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[72px_minmax(0,1fr)_auto]">
              {dish.image ? <img src={dish.image} alt="" className="h-16 w-full rounded-lg object-cover sm:w-[72px]" /> : <span className="grid h-16 w-full place-items-center rounded-lg bg-slate-100 text-slate-400 sm:w-[72px]"><ImageOff className="h-5 w-5" /></span>}
              <div className="min-w-0"><p className="font-bold text-slate-900">{dish.name}</p><p className="mt-1 line-clamp-1 text-sm text-slate-500">{dish.description || 'No description added.'}</p></div>
              <p className="whitespace-nowrap font-black text-teal-800">{formatPrice(dish.price)}</p>
            </div>
          ))}</div> : <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">No dishes in this category yet.</div>}
          <button type="button" onClick={onEdit} className="mt-4 inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border border-teal-300 px-4 text-sm font-bold text-teal-800 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"><Plus className="h-4 w-4" /> Add or edit dishes</button>
        </div>
      )}
    </article>
  );
}
