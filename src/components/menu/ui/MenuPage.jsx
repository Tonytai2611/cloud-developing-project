import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, Plus, Minus, X, ChevronRight, Heart, CalendarDays } from 'lucide-react';
import { useMenuCatalog } from '../hooks/useMenuCatalog';
import { useAuth } from '../../../hooks/useAuth';
import './MenuPage.css';

function FavoriteButton({ item, favoriteIds, toggleFavorite }) {
    const isFavorite = favoriteIds.includes(item.id);
    return <button type="button" aria-label={`${isFavorite ? 'Remove' : 'Add'} ${item.name} ${isFavorite ? 'from' : 'to'} favorites`} onClick={() => toggleFavorite(item.id)} className={`grid h-9 w-9 place-items-center rounded-full shadow-sm transition ${isFavorite ? 'bg-teal-700 text-white' : 'bg-white/95 text-slate-800 hover:bg-white'}`}><Heart className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} /></button>;
}

function AddToBooking({ item, cart, addToCart, updateQuantity }) {
    const selected = cart.find((cartItem) => cartItem.id === item.id);
    if (selected) return <div className="flex items-center gap-1 rounded-full bg-teal-50 p-1"><button type="button" aria-label={`Remove one ${item.name}`} onClick={() => updateQuantity(item.id, selected.quantity - 1)} className="grid h-8 w-8 place-items-center rounded-full bg-teal-100 text-teal-700 hover:bg-teal-600 hover:text-white"><Minus className="h-4 w-4" /></button><span className="w-6 text-center text-sm font-bold text-teal-800">{selected.quantity}</span><button type="button" aria-label={`Add one ${item.name}`} onClick={() => updateQuantity(item.id, selected.quantity + 1)} className="grid h-8 w-8 place-items-center rounded-full bg-teal-700 text-white hover:bg-teal-800"><Plus className="h-4 w-4" /></button></div>;
    return <button type="button" onClick={() => addToCart(item)} aria-label={`Add ${item.name} to booking`} className="inline-flex h-10 min-w-0 shrink-0 items-center justify-center gap-1.5 rounded-full border border-teal-700 bg-teal-700 px-5 text-xs font-bold text-white transition hover:bg-teal-700 hover:text-white sm:text-sm"><CalendarDays className="h-4 w-4" />Add</button>;
}

function DishCard({ item, cart, favoriteIds, toggleFavorite, addToCart, updateQuantity }) {
    return <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/90 bg-white/95 shadow-md backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl">
        <div className="relative aspect-[2] overflow-hidden"><img src={item.image || '/cafe.jpg'} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute left-3 top-3 max-w-[calc(100%-4.5rem)] truncate rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-teal-800">{item.category || 'Chef selection'}</span><div className="absolute right-3 top-3"><FavoriteButton item={item} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite} /></div></div>
        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5"><h2 className="truncate text-lg font-black text-slate-950">{item.name}</h2><p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-slate-600">{item.description || 'Freshly prepared from the BrewCraft kitchen.'}</p><div className="mt-auto flex min-w-0 flex-wrap items-center justify-between gap-3 pt-4"><p className="shrink-0 whitespace-nowrap text-base font-black text-teal-700 sm:text-lg">{Number(item.price || 0).toLocaleString('vi-VN')}₫</p><AddToBooking item={item} cart={cart} addToCart={addToCart} updateQuantity={updateQuantity} /></div></div>
    </motion.article>;
}

const clampPrice = (value, min, max) => Math.min(Math.max(Number(value) || min, min), max);

export default function Menu() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const selectedTable = location.state?.selectedTable;
    const {
        addToCart,
        cart,
        categories,
        error,
        allDishes,
        favoriteIds,
        getTotalPrice,
        loading,
        removeFromCart,
        searchTerm,
        selectedCategory,
        setSearchTerm,
        setSelectedCategory,
        toggleFavorite,
        updateQuantity
    } = useMenuCatalog(user);

    const priceBounds = useMemo(() => {
        const prices = allDishes.map((item) => Number(item.price) || 0).filter((price) => price > 0);
        if (!prices.length) return { min: 0, max: 100000 };
        return {
            min: 0,
            max: Math.max(1000, Math.ceil(Math.max(...prices) / 1000) * 1000)
        };
    }, [allDishes]);
    const effectiveMaxPrice = Math.max(priceBounds.max || 0, 1000);
    const [sortBy, setSortBy] = useState('default');
    const [minPrice, setMinPrice] = useState(priceBounds.min);
    const [maxPrice, setMaxPrice] = useState(priceBounds.max);

    useEffect(() => {
        setMinPrice((current) => clampPrice(current, priceBounds.min, effectiveMaxPrice));
        setMaxPrice((current) => Math.max(clampPrice(current, priceBounds.min, effectiveMaxPrice), priceBounds.min));
    }, [effectiveMaxPrice, priceBounds.min]);

    useEffect(() => {
        if (allDishes.length) {
            setMinPrice(priceBounds.min);
            setMaxPrice(effectiveMaxPrice);
        }
    }, [allDishes.length, effectiveMaxPrice, priceBounds.min]);

    const displayedMenu = useMemo(() => allDishes.filter((item) => {
        const categoryMatches = selectedCategory === 'All' || item.category === selectedCategory;
        const searchMatches = !searchTerm.trim() || item.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) || (item.description || '').toLowerCase().includes(searchTerm.trim().toLowerCase());
        const price = Number(item.price) || 0;
        return categoryMatches && searchMatches && price >= minPrice && price <= maxPrice;
    }).sort((a, b) => {
        if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
        if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
    }), [allDishes, maxPrice, minPrice, searchTerm, selectedCategory, sortBy]);
    const rangeStart = Math.min(100, Math.max(0, (minPrice / effectiveMaxPrice) * 100));
    const rangeEnd = Math.min(100, Math.max(rangeStart, (maxPrice / effectiveMaxPrice) * 100));

    const priceFilter = (
        <fieldset className="menu-price">
            <legend className="text-sm font-semibold text-teal-900">Price Range</legend>
            <div className="flex flex-wrap justify-between gap-2 text-sm text-teal-800">
                <output>{minPrice.toLocaleString('vi-VN')}₫</output>
                <output>{maxPrice.toLocaleString('vi-VN')}₫</output>
            </div>
            <div className="menu-range" style={{ '--range-start': `${rangeStart}%`, '--range-end': `${rangeEnd}%` }}>
                <div className="menu-range-track" />
                <input aria-label="Minimum price" aria-valuetext={`${minPrice.toLocaleString('vi-VN')} dong`} type="range" min="0" max={effectiveMaxPrice} step="1000" value={minPrice} onChange={(event) => setMinPrice(Math.min(Number(event.target.value), maxPrice))} />
                <input aria-label="Maximum price" aria-valuetext={`${maxPrice.toLocaleString('vi-VN')} dong`} type="range" min="0" max={effectiveMaxPrice} step="1000" value={maxPrice} onChange={(event) => setMaxPrice(Math.max(Number(event.target.value), minPrice))} />
            </div>
        </fieldset>
    );

    const goToBooking = () => {
        navigate('/booking', { state: { selectedItems: cart, selectedTable } });
    };
    const pageBackground = {
        backgroundImage: "url('/background.png')",
        backgroundPosition: 'center top',
        backgroundSize: 'cover'
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl text-teal-600">Loading menu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-2xl font-semibold text-red-600">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="menu-page min-h-screen bg-[#f8fdfa] bg-fixed pt-20" style={pageBackground}>
            <div className="container mx-auto max-w-7xl px-4 pb-64 pt-5 sm:pt-6">
                <motion.section initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-5xl text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.35em] text-teal-700">Explore Our Menu</p>
                    <h1 className="menu-title mt-2 text-4xl font-bold text-slate-950 sm:text-5xl">Our Delicious Menu</h1>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Fresh ingredients. Great coffee. Memorable moments. Choose your favourite dishes and add them to a reservation in one smooth flow.</p>
                </motion.section>

                <div className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Dish categories">
                    {categories.map((category) => <button type="button" key={category} aria-pressed={selectedCategory === category} onClick={() => setSelectedCategory(category)} className={`rounded-full border px-5 py-2 text-sm font-semibold transition ${selectedCategory === category ? 'border-teal-700 bg-teal-700 text-white' : 'border-teal-100 bg-white/95 text-teal-900 hover:bg-teal-50'}`}>{category}</button>)}
                </div>
                <div className="relative mx-auto mt-5 w-full">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input aria-label="Search dishes" type="search" placeholder="Search dishes, coffee, or anything delicious..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full rounded-full border border-teal-100 bg-white/95 py-3 pl-12 pr-5 text-sm text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-teal-600" />
                </div>
                <div className="mt-5 grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_240px]">
                    {priceFilter}
                    <label className="flex items-center gap-3 text-sm text-teal-900">
                        <span className="shrink-0">Sort by</span>
                        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="min-w-0 flex-1 rounded-full border border-teal-100 bg-white px-4 py-3 focus:ring-2 focus:ring-teal-600">
                            <option value="default">Menu order</option>
                            <option value="price-asc">Price: low to high</option>
                            <option value="price-desc">Price: high to low</option>
                            <option value="name">Name: A to Z</option>
                        </select>
                    </label>
                </div>
                <p aria-live="polite" className="mt-2 text-xs text-slate-600">{displayedMenu.length} dishes · {minPrice.toLocaleString('vi-VN')}₫ - {maxPrice.toLocaleString('vi-VN')}₫</p>
                {displayedMenu.length === 0 ? <div className="py-16 text-center"><p className="text-lg text-slate-600">No dishes found</p><button type="button" className="mt-3 text-sm font-semibold text-teal-700 underline" onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setMinPrice(0); setMaxPrice(effectiveMaxPrice); }}>Reset filters</button></div> : <div className="menu-dish-grid mt-5">{displayedMenu.map((item) => <DishCard key={item.id} item={item} cart={cart} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite} addToCart={addToCart} updateQuantity={updateQuantity} />)}</div>}
            </div>
            {/* Floating Cart */}
            <AnimatePresence>
                {cart.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-50"
                    >
                        <div className="bg-white border-t-4 border-teal-500 shadow-2xl">
                            <div className="container mx-auto p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center shadow-lg">
                                            <ShoppingCart className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-gray-700 font-medium">
                                                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                                            </p>
                                            <p className="text-teal-600 font-bold text-xl">
                                                {getTotalPrice().toLocaleString('vi-VN')}₫
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={goToBooking}
                                        className="flex items-center gap-2 bg-teal-500 text-white font-bold py-3 px-8 rounded-full hover:bg-teal-600 transition-all shadow-lg hover:shadow-teal-500/30"
                                    >
                                        Book Now
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Cart Items Preview */}
                                <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {cart.map(item => (
                                        <div
                                            key={item.id}
                                            className="flex-shrink-0 flex items-center gap-3 bg-gray-50 rounded-xl p-2 pr-4 border border-gray-100"
                                        >
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-gray-800 text-sm font-medium truncate max-w-[120px]">
                                                    {item.name}
                                                </p>
                                                <p className="text-gray-500 text-xs">
                                                    x{item.quantity}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="ml-2 w-6 h-6 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
