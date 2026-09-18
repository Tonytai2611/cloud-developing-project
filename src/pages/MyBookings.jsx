import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useMyBookings } from '../components/booking/hooks/useMyBookings';
import {
  AlertCircle, ArrowRight, Ban, BookOpen, Calendar, CheckCircle2,
  ChevronDown, ChevronRight, Clock, Headphones, Info, Loader2,
  MapPin, MoreHorizontal, Plus, SlidersHorizontal, Users, XCircle
} from 'lucide-react';

const statusConfig = {
  PENDING: { label: 'Pending', icon: Clock, badge: 'border-amber-300 bg-amber-50 text-amber-700', stat: 'bg-[#fff9ed]' },
  CONFIRMED: { label: 'Confirmed', icon: CheckCircle2, badge: 'border-emerald-300 bg-emerald-50 text-emerald-700', stat: 'bg-[#effbf6]' },
  REJECTED: { label: 'Rejected', icon: XCircle, badge: 'border-red-300 bg-red-50 text-red-700', stat: 'bg-[#fff4f4]' },
  CANCELLED: { label: 'Cancelled', icon: Ban, badge: 'border-slate-300 bg-slate-50 text-slate-600', stat: 'bg-[#f5f7fa]' }
};

const formatDate = (dateValue) => new Date(dateValue).toLocaleDateString('en-US', {
  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
});

const formatCreatedDate = (dateValue) => new Date(dateValue).toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric'
});

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${config.badge}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9f9f5] text-[#008f85]">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function BookingCard({ booking, onCancel, isCancelling }) {
  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status);
  const selectedItems = booking.selectedItems || [];
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="rounded-2xl border border-white/90 bg-white/95 p-5 shadow-[0_10px_30px_rgba(25,74,74,0.08)] backdrop-blur transition-shadow hover:shadow-[0_14px_34px_rgba(25,74,74,0.13)] sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-[#10243a]">Booking #{booking.id}</h2>
          <p className="mt-1 text-xs text-slate-500">Created: {formatCreatedDate(booking.createdAt)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={booking.status} />
          <button type="button" aria-label={`More options for booking ${booking.id}`} className="hidden h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 sm:flex">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Detail icon={Calendar} label="Date" value={formatDate(booking.date)} />
        <Detail icon={Clock} label="Time" value={booking.time} />
        <Detail icon={Users} label="Guests" value={`${booking.guests} ${booking.guests === 1 ? 'person' : 'people'}`} />
        <Detail icon={MapPin} label="Table" value={booking.tableNumber || 'To be assigned'} />
      </div>

      {booking.specialRequests && (
        <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">Special Requests</p>
          <p className="mt-1 text-sm text-slate-700">{booking.specialRequests}</p>
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="mt-4 rounded-lg bg-[#effaf7] px-4 py-3">
          <p className="text-xs font-semibold text-[#087f78]">Pre-ordered items</p>
          <p className="mt-1 text-sm text-slate-700">{selectedItems.map((item) => `${item.quantity} × ${item.name}`).join(', ')}</p>
        </div>
      )}

      {canCancel && (
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="hidden items-center gap-2 text-xs text-slate-500 sm:flex"><Info className="h-4 w-4 text-[#009d91]" />You can cancel while this booking is {booking.status.toLowerCase()}.</p>
          <button type="button" onClick={() => onCancel(booking.id)} disabled={isCancelling} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
            {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
            {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        </div>
      )}
    </motion.article>
  );
}

function QuickActions({ navigate }) {
  const actions = [
    { icon: Calendar, title: 'Make a New Reservation', subtitle: 'Book a table at BrewCraft', path: '/booking' },
    { icon: BookOpen, title: 'View Menu', subtitle: 'Explore our delicious dishes', path: '/menu' },
    { icon: Headphones, title: 'Contact Support', subtitle: 'Get help from our team', path: '/chat' }
  ];
  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border border-white/90 bg-white/95 p-6 shadow-[0_10px_30px_rgba(25,74,74,0.08)] backdrop-blur">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#10243a]"><SlidersHorizontal className="h-5 w-5 text-[#008f85]" />Quick Actions</h2>
        <div className="mt-5 divide-y divide-slate-100">
          {actions.map(({ icon: Icon, title, subtitle, path }) => (
            <button key={title} type="button" onClick={() => navigate(path)} className="flex w-full items-center gap-3 py-4 text-left first:pt-0 last:pb-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#edf7ff] text-[#1670c4]"><Icon className="h-[18px] w-[18px]" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#173149]">{title}</span><span className="mt-1 block text-xs text-slate-500">{subtitle}</span></span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-[#cbeee4] bg-[#edfaf6]/95 p-6 shadow-[0_10px_30px_rgba(25,74,74,0.06)] backdrop-blur">
        <h2 className="flex items-center gap-2 text-base font-bold text-[#10243a]"><span className="text-lg text-[#008f85]">♥</span>We&apos;re here for you</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">Need to change your reservation or have special requests? Feel free to contact us anytime.</p>
        <button type="button" onClick={() => navigate('/chat')} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#d8f3eb] px-4 py-2 text-sm font-bold text-[#087f78] hover:bg-[#c7ebe0]">Contact Support <ArrowRight className="h-4 w-4" /></button>
      </section>
      <section className="rounded-2xl border border-[#f4dfb9] bg-[#fff8e9]/95 p-6 shadow-[0_10px_30px_rgba(25,74,74,0.06)] backdrop-blur">
        <h2 className="text-base font-bold text-[#5b3b19]">Reservation Policy</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">Cancellations are free up to 2 hours before your booking time.</p>
        <button type="button" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#087f78]">View Full Policy <ArrowRight className="h-4 w-4" /></button>
      </section>
    </aside>
  );
}

export default function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings, cancellingId, handleCancelBooking, loading } = useMyBookings(user);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [sortNewest, setSortNewest] = useState(true);
  const pageBackground = { backgroundImage: "url('/background.png')", backgroundPosition: 'center top', backgroundSize: 'cover', backgroundAttachment: 'fixed' };

  const filteredBookings = useMemo(() => {
    const visible = activeFilter === 'ALL' ? [...bookings] : bookings.filter((booking) => booking.status === activeFilter);
    return visible.sort((a, b) => {
      const first = new Date(a.createdAt || a.date).getTime();
      const second = new Date(b.createdAt || b.date).getTime();
      return sortNewest ? second - first : first - second;
    });
  }, [activeFilter, bookings, sortNewest]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#f7fbf9] pt-20" style={pageBackground}><div className="rounded-2xl bg-white/90 p-8 text-center shadow-xl"><Loader2 className="mx-auto mb-3 h-9 w-9 animate-spin text-[#009d91]" /><p className="text-sm text-slate-600">Loading your bookings...</p></div></div>;
  if (!user) return <div className="flex min-h-screen items-center justify-center bg-[#f7fbf9] px-4 pt-20" style={pageBackground}><div className="max-w-md rounded-2xl bg-white/95 p-8 text-center shadow-xl"><AlertCircle className="mx-auto mb-4 h-12 w-12 text-[#009d91]" /><h1 className="text-2xl font-bold text-slate-800">Please Login</h1><p className="mt-2 text-slate-600">You need to be logged in to view your bookings.</p><button type="button" onClick={() => navigate('/')} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0b8f84] px-5 py-3 text-sm font-bold text-white">Go to Home <ArrowRight className="h-4 w-4" /></button></div></div>;

  const statItems = [
    { key: 'PENDING', label: 'Pending', icon: Clock, color: 'text-amber-600', iconBg: 'bg-amber-100' },
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2, color: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    { key: 'CANCELLED', label: 'Cancelled', icon: Ban, color: 'text-red-600', iconBg: 'bg-red-100' },
    { key: 'ALL', label: 'Total Bookings', icon: Calendar, color: 'text-blue-600', iconBg: 'bg-blue-100' }
  ];
  const filterItems = [{ key: 'ALL', label: 'All Bookings' }, { key: 'PENDING', label: 'Pending' }, { key: 'CONFIRMED', label: 'Confirmed' }, { key: 'CANCELLED', label: 'Cancelled' }];

  return (
    <main className="min-h-screen bg-[#f7fbf9] px-4 pb-16 pt-28 sm:px-6" style={pageBackground}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#008f85]">Customer Portal</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-[#0b1730] sm:text-5xl">My Bookings</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">Manage your reservations at BrewCraft Restaurant</p>
        </header>

        <section className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statItems.map(({ key, label, icon: Icon, color, iconBg }) => {
            const count = key === 'ALL' ? bookings.length : bookings.filter((booking) => booking.status === key).length;
            return <button type="button" key={label} onClick={() => setActiveFilter(key)} className={`flex items-center gap-3 rounded-2xl border border-white/90 p-4 text-left shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md ${statusConfig[key]?.stat || 'bg-[#f0f6ff]'} ${activeFilter === key ? 'ring-2 ring-[#0fae9f]/40' : ''}`}><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} ${color}`}><Icon className="h-6 w-6" /></span><span><span className="block text-2xl font-black text-[#10243a]">{count}</span><span className="text-sm text-slate-600">{label}</span></span></button>;
          })}
        </section>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-white/75 p-1 shadow-sm backdrop-blur">
            {filterItems.map(({ key, label }) => <button type="button" key={key} onClick={() => setActiveFilter(key)} className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-bold transition sm:text-sm ${activeFilter === key ? 'bg-[#0b9a8e] text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}>{label} <span className="opacity-70">({key === 'ALL' ? bookings.length : bookings.filter((booking) => booking.status === key).length})</span></button>)}
          </div>
          <button type="button" onClick={() => setSortNewest((value) => !value)} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-full bg-white/85 px-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur hover:bg-white sm:self-auto"><SlidersHorizontal className="h-4 w-4 text-[#087f78]" />{sortNewest ? 'Newest First' : 'Oldest First'}<ChevronDown className="h-4 w-4" /></button>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
          <section className="space-y-5">
            <AnimatePresence mode="popLayout">
              {filteredBookings.map((booking) => <BookingCard key={booking.id} booking={booking} onCancel={handleCancelBooking} isCancelling={cancellingId === booking.id} />)}
            </AnimatePresence>
            {filteredBookings.length === 0 && <div className="rounded-2xl bg-white/95 p-10 text-center shadow-sm"><Calendar className="mx-auto mb-3 h-10 w-10 text-[#009d91]" /><p className="font-semibold text-slate-700">No bookings in this category.</p><button type="button" onClick={() => setActiveFilter('ALL')} className="mt-3 text-sm font-bold text-[#087f78]">View all bookings</button></div>}
          </section>
          <QuickActions navigate={navigate} />
        </div>

        <div className="mt-8 text-center"><button type="button" onClick={() => navigate('/booking')} className="inline-flex items-center gap-2 rounded-xl bg-[#0b9d91] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#0b9d91]/20 transition hover:bg-[#087f78]">Make Another Booking <Plus className="h-4 w-4" /></button></div>
      </div>
    </main>
  );
}
