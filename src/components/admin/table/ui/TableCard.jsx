import React from 'react';
import { Edit3, Trash2, Users } from 'lucide-react';

export default function TableCard({ table, onEdit, onDelete }) {
  const available = table.status === 'AVAILABLE';
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-12 w-12 place-items-center rounded-full ${available ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}><Users className="h-5 w-5" /></span>
        <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${available ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><span className={`h-2 w-2 rounded-full ${available ? 'bg-emerald-500' : 'bg-amber-500'}`} />{available ? 'Available' : 'Reserved'}</span>
      </div>
      <h2 className="mt-4 font-serif text-xl font-bold text-slate-950">{table.tableNumber}</h2>
      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500"><Users className="h-4 w-4" /> {table.seats} seats</p>
      <div className="mt-5 border-t border-slate-100 pt-4"><p className="min-h-10 text-sm leading-5 text-slate-500">{available ? 'Ready for the next reservation.' : 'Currently held for a reservation.'}</p><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={onEdit} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-800"><Edit3 className="h-4 w-4" /> Edit</button><button type="button" onClick={onDelete} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-bold text-red-600 hover:bg-red-100"><Trash2 className="h-4 w-4" /> Delete</button></div></div>
    </article>
  );
}
