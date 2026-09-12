import React, { useMemo, useState } from 'react';
import { CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Coins, Eye, Pencil, Search, Trash2, UtensilsCrossed, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminOrdering } from '../../hooks/useAdminOrdering';
import AdminWorkspaceShell from '../../shared/AdminWorkspaceShell';

const money = (value) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(value || 0)) + ' đ';

const statusStyle = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-blue-100 text-blue-700'
};

const statusDot = {
  PENDING: 'bg-amber-500',
  CONFIRMED: 'bg-emerald-500',
  REJECTED: 'bg-red-500',
  COMPLETED: 'bg-blue-500'
};

const typeStyle = {
  food: 'bg-emerald-100 text-emerald-700',
  table: 'bg-violet-100 text-violet-700'
};

const statTone = {
  teal: { icon: 'bg-emerald-100 text-emerald-600', art: 'from-emerald-200/70' },
  amber: { icon: 'bg-amber-100 text-amber-600', art: 'from-amber-200/70' },
  blue: { icon: 'bg-blue-100 text-blue-600', art: 'from-blue-200/70' },
  violet: { icon: 'bg-violet-100 text-violet-600', art: 'from-violet-200/70' },
  emerald: { icon: 'bg-teal-100 text-teal-600', art: 'from-teal-200/70' }
};

function OrderItems({ booking, compact = false }) {
  const items = booking.selectedItems || [];
  if (!items.length) {
    return (
      <>
        <p className="font-bold text-slate-700">Table reservation</p>
        <p className="text-sm text-slate-500">0 items</p>
      </>
    );
  }

  return (
    <>
      <p className={`font-bold text-slate-700 ${compact ? '' : 'truncate'}`}>
        {items.slice(0, 2).map((item) => `${item.quantity || 1} x ${item.name}`).join(', ')}
      </p>
      {items.length > 2 && <p className="text-sm text-slate-500">+{items.length - 2} more</p>}
    </>
  );
}

function OrderActions({ booking, expanded, loading, onToggle, onApprove, onReject, onDelete }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={onToggle} className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
        <Eye className="h-4 w-4" /> Details
      </button>
      {booking.status === 'PENDING' ? (
        <>
          <button onClick={onApprove} disabled={loading} aria-label="Approve order" className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
            <Check className="h-5 w-5" />
          </button>
          <button onClick={onReject} disabled={loading} aria-label="Reject order" className="grid h-10 w-10 place-items-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </>
      ) : (
        <button type="button" aria-label="Edit order" className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
          <Pencil className="h-5 w-5" />
        </button>
      )}
      <button onClick={onDelete} disabled={loading} aria-label="Delete order" className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
}

function ExpandedDetails({ booking }) {
  return (
    <div className="grid gap-4 border-t border-slate-100 bg-slate-50/70 px-5 py-5 lg:grid-cols-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Contact</p>
        <p className="mt-2 break-words text-sm text-slate-700">{booking.email || 'No email'}</p>
        <p className="mt-1 text-sm text-slate-700">{booking.phone || 'No phone'}</p>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Order items</p>
        <div className="mt-2 space-y-1">
          {booking.selectedItems?.length ? booking.selectedItems.map((item, index) => (
            <p key={index} className="flex justify-between gap-3 text-sm text-slate-700">
              <span>{item.quantity || 1} x {item.name}</span>
              <span>{money(Number(item.price || 0) * Number(item.quantity || 1))}</span>
            </p>
          )) : <p className="text-sm text-slate-500">No food items.</p>}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Special requests</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{booking.specialRequests || 'No special requests.'}</p>
      </div>
    </div>
  );
}

export default function OrderManagementPage() {
  const navigate = useNavigate();
  const orders = useAdminOrdering();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  const getTotal = (booking) => Number(booking.totalPrice || booking.total || 0);
  const stats = useMemo(() => ({
    revenue: orders.bookings.reduce((sum, booking) => sum + getTotal(booking), 0),
    pending: orders.bookings.filter((booking) => booking.status === 'PENDING').length,
    confirmed: orders.bookings.filter((booking) => booking.status === 'CONFIRMED').length,
    tableOnly: orders.tableOnlyBookings.length,
    food: orders.foodBookings.length
  }), [orders.bookings, orders.foodBookings.length, orders.tableOnlyBookings.length]);

  const visibleOrders = useMemo(() => orders.filteredBookings.filter((booking) => {
    const total = getTotal(booking);
    const typeMatches = typeFilter === 'ALL' || (typeFilter === 'TABLE' ? total === 0 : total > 0);
    const content = `${booking.id || ''} ${booking.customerName || ''} ${booking.email || ''} ${(booking.selectedItems || []).map((item) => item.name).join(' ')}`.toLowerCase();
    return typeMatches && content.includes(searchTerm.trim().toLowerCase());
  }), [orders.filteredBookings, searchTerm, typeFilter]);

  const statCards = [
    { label: 'Total Revenue', value: money(stats.revenue), icon: Coins, tone: 'teal' },
    { label: 'Pending Approval', value: stats.pending, icon: Clock3, tone: 'amber' },
    { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle2, tone: 'blue' },
    { label: 'Table Reservations', value: stats.tableOnly, icon: CalendarDays, tone: 'violet' },
    { label: 'Food Orders', value: stats.food, icon: UtensilsCrossed, tone: 'emerald' }
  ];

  const filters = [
    ['ALL', `All (${orders.bookings.length})`, () => { orders.setFilter('ALL'); setTypeFilter('ALL'); }],
    ['PENDING', `Pending (${stats.pending})`, () => { orders.setFilter('PENDING'); setTypeFilter('ALL'); }],
    ['CONFIRMED', `Confirmed (${stats.confirmed})`, () => { orders.setFilter('CONFIRMED'); setTypeFilter('ALL'); }],
    ['TABLE', `Table Only (${stats.tableOnly})`, () => setTypeFilter(typeFilter === 'TABLE' ? 'ALL' : 'TABLE')],
    ['FOOD', `Food + Table (${stats.food})`, () => setTypeFilter(typeFilter === 'FOOD' ? 'ALL' : 'FOOD')]
  ];

  const renderActions = (booking) => (
    <OrderActions
      booking={booking}
      expanded={expandedId === booking.id}
      loading={orders.loading}
      onToggle={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
      onApprove={() => orders.handleApprove(booking.id)}
      onReject={() => orders.handleReject(booking.id)}
      onDelete={() => orders.handleDelete(booking.id)}
    />
  );

  return (
    <AdminWorkspaceShell query={searchTerm} setQuery={setSearchTerm} searchPlaceholder="Search orders..." title="Order Management" subtitle="Review customer bookings and food orders.">
      <div className="space-y-5 lg:space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-sky-50/80 to-teal-50 p-5 sm:p-6">
          <div className="pointer-events-none absolute right-6 top-4 hidden text-right text-xl font-light italic text-slate-300 xl:block">
            Good Coffee<br />Brings People Together
          </div>
          <nav className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <button onClick={() => navigate('/admin')} className="hover:text-teal-700">Dashboard</button>
            <ChevronRight className="h-4 w-4" />
            <span className="font-bold text-teal-700">Orders</span>
          </nav>
          <h1 className="font-serif text-3xl font-black tracking-tight text-slate-950 sm:text-4xl xl:text-5xl">Manage Orders</h1>
          <p className="mt-2 max-w-2xl text-base text-slate-500 sm:text-lg">Review and manage customer bookings and food orders.</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {statCards.map(({ label, value, icon: Icon, tone }) => (
            <article key={label} className="relative min-h-32 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:min-h-36">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${statTone[tone].icon}`}><Icon className="h-6 w-6" /></span>
              <p className="mt-4 text-sm font-bold text-slate-500">{label}</p>
              <p className="mt-2 truncate text-3xl font-black text-slate-950">{value}</p>
              <span className={`absolute bottom-5 right-5 h-14 w-20 rounded-full bg-gradient-to-l ${statTone[tone].art} to-transparent opacity-60`} />
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center">
            <label className="relative min-w-0 flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by ID, customer or item..." className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 sm:text-base" />
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map(([value, label, onClick]) => {
                const active = value === 'TABLE' || value === 'FOOD' ? typeFilter === value : orders.filter === value && typeFilter === 'ALL';
                return <button key={value} onClick={onClick} className={`h-11 shrink-0 whitespace-nowrap rounded-xl px-4 text-sm font-bold transition-colors sm:px-5 ${active ? 'bg-teal-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}</button>;
              })}
            </div>
          </div>
        </section>

        {orders.loading && !orders.bookings.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center">
            <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
            <p className="mt-4 font-semibold text-slate-600">Loading orders...</p>
          </div>
        ) : visibleOrders.length ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-4 p-4 2xl:hidden">
              {visibleOrders.map((booking) => {
                const total = getTotal(booking);
                const hasFood = total > 0;
                const status = booking.status || 'UNKNOWN';
                const expanded = expandedId === booking.id;
                return (
                  <article key={booking.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="space-y-4 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="break-words text-lg font-black text-slate-950">#{booking.id || 'N/A'}</p>
                          <p className="text-sm text-slate-500">Booking ID</p>
                        </div>
                        <span className={`inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-black ${statusStyle[status] || 'bg-slate-100 text-slate-700'}`}>
                          <span className={`h-2.5 w-2.5 rounded-full ${statusDot[status] || 'bg-slate-400'}`} />{status}
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Customer</p><p className="mt-1 font-black text-slate-950">{booking.customerName || 'Customer'}</p><p className="break-words text-sm text-slate-500">{booking.email || 'No email'}</p></div>
                        <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Table</p><p className="mt-1 font-black text-teal-700">{booking.tableId || '-'}</p><p className="text-sm text-slate-500">{booking.guests || 0} guests</p></div>
                        <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Date & Time</p><p className="mt-1 font-semibold text-slate-700">{booking.date || '-'}</p><p className="text-sm text-slate-500">{booking.time || '-'}</p></div>
                        <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total</p><p className="mt-1 text-lg font-black text-slate-950">{hasFood ? money(total) : '-'}</p></div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`w-fit whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-black ${hasFood ? typeStyle.food : typeStyle.table}`}>{hasFood ? 'Food + Table' : 'Table Only'}</span>
                        <div className="min-w-0 text-sm"><OrderItems booking={booking} compact /></div>
                      </div>
                      {renderActions(booking)}
                    </div>
                    {expanded && <ExpandedDetails booking={booking} />}
                  </article>
                );
              })}
            </div>

            <div className="hidden 2xl:block">
              <div>
                <div className="grid grid-cols-[minmax(150px,1.05fr)_minmax(170px,1.2fr)_110px_125px_145px_minmax(170px,1.2fr)_100px_135px_190px] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-sm font-black uppercase tracking-wide text-slate-500">
                  <span>Order</span><span>Customer</span><span>Table</span><span>Type</span><span>Date & Time</span><span>Items</span><span>Total</span><span>Status</span><span>Actions</span>
                </div>
                {visibleOrders.map((booking) => {
                  const total = getTotal(booking);
                  const hasFood = total > 0;
                  const status = booking.status || 'UNKNOWN';
                  const expanded = expandedId === booking.id;
                  return (
                    <article key={booking.id} className="border-b border-slate-100 last:border-b-0">
                      <div className="grid grid-cols-[minmax(150px,1.05fr)_minmax(170px,1.2fr)_110px_125px_145px_minmax(170px,1.2fr)_100px_135px_190px] items-center gap-4 px-6 py-5">
                        <div><p className="truncate text-lg font-black text-slate-950">#{booking.id || 'N/A'}</p><p className="text-sm text-slate-500">Booking ID</p></div>
                        <div className="min-w-0"><p className="truncate text-base font-black text-slate-950">{booking.customerName || 'Customer'}</p><p className="truncate text-sm text-slate-500">{booking.email || 'No email'}</p></div>
                        <div><p className="font-black text-teal-700">{booking.tableId || '-'}</p><p className="text-sm text-slate-500">{booking.guests || 0} guests</p></div>
                        <span className={`w-fit whitespace-nowrap rounded-full px-4 py-2 text-sm font-black ${hasFood ? typeStyle.food : typeStyle.table}`}>{hasFood ? 'Food + Table' : 'Table Only'}</span>
                        <div className="text-sm text-slate-600"><p className="font-semibold">{booking.date || '-'}</p><p>{booking.time || '-'}</p></div>
                        <div className="min-w-0 text-sm"><OrderItems booking={booking} /></div>
                        <p className="text-lg font-black text-slate-950">{hasFood ? money(total) : '-'}</p>
                        <span className={`inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-black ${statusStyle[status] || 'bg-slate-100 text-slate-700'}`}><span className={`h-2.5 w-2.5 rounded-full ${statusDot[status] || 'bg-slate-400'}`} />{status}</span>
                        {renderActions(booking)}
                      </div>
                      {expanded && <ExpandedDetails booking={booking} />}
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <UtensilsCrossed className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-lg font-bold text-slate-800">No orders found</h2>
            <p className="mt-1 text-sm text-slate-500">Orders will appear here when customers make bookings.</p>
          </div>
        )}

        <footer className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Showing {visibleOrders.length} of {orders.bookings.length} orders</p>
          <div className="flex items-center gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400"><ChevronLeft className="h-5 w-5" /></button>
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-700 font-bold text-white">1</span>
            <button className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </footer>
      </div>
    </AdminWorkspaceShell>
  );
}
