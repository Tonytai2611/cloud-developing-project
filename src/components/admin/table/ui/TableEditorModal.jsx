import React from 'react';
import { CheckCircle2, Clock3, LayoutGrid, Users, X } from 'lucide-react';

const controlClass = 'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100';

export default function TableEditorModal({ editingTable, formData, loading, onChange, onClose, onSubmit }) {
  const available = formData.status === 'AVAILABLE';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="table-modal-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between bg-teal-700 px-6 py-5 text-white"><div><h2 id="table-modal-title" className="font-serif text-2xl font-bold">{editingTable ? 'Edit Table' : 'Add New Table'}</h2><p className="mt-1 text-sm text-white/75">{editingTable ? 'Update table capacity and availability.' : 'Create a new table for your restaurant.'}</p></div><button type="button" onClick={onClose} aria-label="Close dialog" className="grid h-10 w-10 place-items-center rounded-xl hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><X className="h-5 w-5" /></button></header>
        <form onSubmit={onSubmit} className="grid min-w-0 gap-6 p-6 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-5">
            <label className="block"><span className="mb-2 block text-sm font-bold text-slate-800">Table Name <span className="text-red-500">*</span></span><input value={formData.tableNumber} onChange={(event) => onChange({ ...formData, tableNumber: event.target.value })} required placeholder="e.g. Table 01" className={controlClass} /></label>
            <label className="block"><span className="mb-2 block text-sm font-bold text-slate-800">Number of Seats <span className="text-red-500">*</span></span><select value={formData.seats} onChange={(event) => onChange({ ...formData, seats: event.target.value })} className={controlClass}>{[2, 4, 6, 8, 10, 12].map((seats) => <option key={seats} value={seats}>{seats} seats</option>)}</select></label>
            <label className="block"><span className="mb-2 block text-sm font-bold text-slate-800">Status <span className="text-red-500">*</span></span><select value={formData.status} onChange={(event) => onChange({ ...formData, status: event.target.value })} className={controlClass}><option value="AVAILABLE">Available</option><option value="RESERVED">Reserved</option></select></label>
          </div>
          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h3 className="font-bold text-slate-900">Table Preview</h3><span className={`mx-auto mt-5 grid h-24 w-24 place-items-center rounded-full ${available ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}><LayoutGrid className="h-10 w-10" /></span><p className="mt-4 text-center font-serif text-xl font-bold text-slate-950">{formData.tableNumber || 'New Table'}</p><div className="mt-5 space-y-2"><p className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700"><Users className="h-4 w-4" /> {formData.seats} seats</p><p className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">{available ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Clock3 className="h-4 w-4 text-amber-600" />}{available ? 'Available' : 'Reserved'}</p></div></aside>
          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end md:col-span-2"><button type="button" onClick={onClose} className="h-11 min-w-32 rounded-xl bg-slate-100 px-5 font-bold text-slate-700 hover:bg-slate-200">Cancel</button><button type="submit" disabled={loading} className="h-11 min-w-36 rounded-xl bg-teal-700 px-5 font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300">{loading ? 'Saving…' : editingTable ? 'Update Table' : 'Add Table'}</button></footer>
        </form>
      </div>
    </div>
  );
}
