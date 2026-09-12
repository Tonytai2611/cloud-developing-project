import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Heart, Loader2, Search, Trash2 } from 'lucide-react';
import { useMenuCatalog } from '../components/menu/hooks/useMenuCatalog';
import { useAuth } from '../hooks/useAuth';

export default function MyFavourites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    addToCart, categories, error, favoriteIds, filteredMenu, loading,
    priceRange, searchTerm, setPriceRange, setSearchTerm, setSelectedCategory,
    selectedCategory, toggleFavorite, updateQuantity, cart
  } = useMenuCatalog(user);
  const favourites = filteredMenu.filter((item) => favoriteIds.includes(item.id));

  const pageBackground = {
    backgroundImage: "url('/background.png')",
    backgroundPosition: 'center top',
    backgroundSize: 'cover',
    backgroundAttachment: 'fixed'
  };

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#f7fbf9] pt-16" style={pageBackground}><Loader2 className="h-9 w-9 animate-spin text-teal-700" /></main>;
  if (error) return <main className="flex min-h-screen items-center justify-center bg-[#f7fbf9] px-4 pt-16" style={pageBackground}><p className="rounded-xl bg-white/90 px-6 py-4 text-red-600">Unable to load your favourites.</p></main>;

  return <main className="min-h-screen bg-[#f7fbf9] px-4 pb-16 pt-28 sm:px-6" style={pageBackground}>
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-teal-700">Your Collection</p>
        <h1 className="mt-2 flex items-center gap-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">My Favourites <Heart className="h-8 w-8 text-teal-700" fill="currentColor" /></h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Save favourite dishes and drinks, then add them to your next booking with one click.</p>
      </header>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex max-w-full gap-2 overflow-x-auto pb-1">{categories.filter((category) => category !== 'All' || categories.length === 1).map((category) => <button type="button" key={category} onClick={() => setSelectedCategory(category)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${selectedCategory === category ? 'border-teal-700 bg-teal-700 text-white' : 'border-white/80 bg-white/85 text-slate-700 hover:bg-white'}`}>{category}</button>)}</div>
        <div className="relative min-w-0 flex-1 lg:max-w-md"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search your favourites..." className="w-full rounded-full border border-white/90 bg-white/90 py-2.5 pl-11 pr-4 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-200" /></div>
        <select value={priceRange} onChange={(event) => setPriceRange(event.target.value)} className="rounded-full border border-white/90 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none"><option value="ALL">All prices</option><option value="UNDER_50">Under 50k</option><option value="50_100">50k - 100k</option><option value="ABOVE_100">Above 100k</option></select>
      </div>

      {favourites.length === 0 ? <section className="rounded-2xl border border-white/90 bg-white/85 px-6 py-16 text-center shadow-sm backdrop-blur"><Heart className="mx-auto mb-4 h-12 w-12 text-teal-700" /><h2 className="text-xl font-bold text-slate-900">No favourites yet?</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Keep exploring our menu and tap the heart on any dish or drink to save it here.</p><button type="button" onClick={() => navigate('/menu')} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-3 text-sm font-bold text-white">Browse Menu <ArrowRight className="h-4 w-4" /></button></section> : <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{favourites.map((item) => { const selected = cart.find((cartItem) => cartItem.id === item.id); return <article key={item.id} className="group overflow-hidden rounded-2xl border border-white/90 bg-white/95 shadow-md backdrop-blur"><div className="relative h-44 overflow-hidden"><img src={item.image || '/cafe.jpg'} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><button type="button" onClick={() => toggleFavorite(item.id)} aria-label={`Remove ${item.name} from favourites`} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-teal-700 shadow-sm"><Heart className="h-4 w-4" fill="currentColor" /></button><span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-teal-800">{item.category}</span></div><div className="p-5"><h2 className="text-lg font-black text-slate-950">{item.name}</h2><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{item.description || 'Freshly prepared from the BrewCraft kitchen.'}</p><div className="mt-5 flex items-center justify-between gap-2"><p className="whitespace-nowrap text-base font-black text-teal-700">{item.price?.toLocaleString('vi-VN')}₫</p>{selected ? <div className="flex items-center gap-1 rounded-full bg-teal-50 p-1"><button type="button" onClick={() => updateQuantity(item.id, selected.quantity - 1)} className="grid h-7 w-7 place-items-center rounded-full bg-teal-100 text-teal-700">−</button><span className="w-5 text-center text-sm font-bold">{selected.quantity}</span><button type="button" onClick={() => updateQuantity(item.id, selected.quantity + 1)} className="grid h-7 w-7 place-items-center rounded-full bg-teal-700 text-white">+</button></div> : <button type="button" onClick={() => addToCart(item)} className="inline-flex items-center gap-1.5 rounded-full bg-teal-700 px-3 py-2 text-xs font-bold text-white"><CalendarDays className="h-4 w-4" />Add</button>}</div><button type="button" onClick={() => toggleFavorite(item.id)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" />Remove from favourites</button></div></article>; })}</section>}
    </div>
  </main>;
}
