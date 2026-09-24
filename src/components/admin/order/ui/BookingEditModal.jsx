import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const inputClass = 'h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100';

export default function BookingEditModal({ booking, tables, loading, onClose, onSubmit }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!booking) return;
    setForm({
      customerName: booking.customerName || '',
      phone: booking.phone || '',
      email: booking.email || '',
      guests: booking.guests || 1,
      tableId: booking.tableId || '',
      tableNumber: booking.tableNumber || '',
      date: booking.date || '',
      time: booking.time || '',
      specialRequests: booking.specialRequests || '',
    });
  }, [booking]);

  if (!booking) return null;
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    const table = tables.find((item) => item.id === form.tableId);
    onSubmit({ ...form, guests: Number(form.guests), ...(table ? { tableNumber: table.tableNumber } : {}) });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-booking-title">
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div><h2 id="edit-booking-title" className="text-xl font-black text-slate-950">Edit Booking & Order</h2><p className="mt-1 text-sm text-slate-500">Update booking details for #{booking.id}.</p></div>
          <button type="button" onClick={onClose} aria-label="Close edit dialog" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </header>
        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Customer name<input name="customerName" value={form.customerName || ''} onChange={update} className={inputClass} required /></label>
          <label className="text-sm font-semibold text-slate-700">Phone<input name="phone" value={form.phone || ''} onChange={update} className={inputClass} /></label>
          <label className="text-sm font-semibold text-slate-700">Email<input type="email" name="email" value={form.email || ''} onChange={update} className={inputClass} /></label>
          <label className="text-sm font-semibold text-slate-700">Guests<input type="number" min="1" name="guests" value={form.guests || 1} onChange={update} className={inputClass} required /></label>
          <label className="text-sm font-semibold text-slate-700">Date<input type="date" name="date" value={form.date || ''} onChange={update} className={inputClass} required /></label>
          <label className="text-sm font-semibold text-slate-700">Time<input type="time" name="time" value={form.time || ''} onChange={update} className={inputClass} required /></label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Table<select name="tableId" value={form.tableId || ''} onChange={update} className={inputClass} required><option value="">Choose table</option>{tables.map((table) => <option key={table.id} value={table.id}>{table.tableNumber} · {table.seats} seats</option>)}</select></label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Special requests<textarea name="specialRequests" value={form.specialRequests || ''} onChange={update} rows="3" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></label>
        </div>
        <footer className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4"><button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200">Cancel</button><button type="submit" disabled={loading} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50">{loading ? 'Saving…' : 'Save changes'}</button></footer>
      </form>
    </div>
  );
}
