import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, Plus, Minus, X, ChevronRight, Heart, CalendarDays } from 'lucide-react';
import { useMenuCatalog } from '../hooks/useMenuCatalog';
import { useAuth } from '../../../hooks/useAuth';

function FavoriteButton({ item, favoriteIds, toggleFavorite }) {
    const isFavorite = favoriteIds.includes(item.id);
    return <button type="button" aria-label={`${isFavorite ? 'Remove' : 'Add'} ${item.name} ${isFavorite ? 'from' : 'to'} favorites`} onClick={() => toggleFavorite(item.id)} className={`grid h-9 w-9 place-items-center rounded-full shadow-sm transition ${isFavorite ? 'bg-teal-700 text-white' : 'bg-white/95 text-slate-800 hover:bg-white'}`}><Heart className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} /></button>;
}

function AddToBooking({ item, cart, addToCart, updateQuantity }) {
    const selected = cart.find((cartItem) => cartItem.id === item.id);
    if (selected) return <div className="flex items-center gap-1 rounded-full bg-teal-50 p-1"><button type="button" aria-label={`Remove one ${item.name}`} onClick={() => updateQuantity(item.id, selected.quantity - 1)} className="grid h-8 w-8 place-items-center rounded-full bg-teal-100 text-teal-700 hover:bg-teal-600 hover:text-white"><Minus className="h-4 w-4" /></button><span className="w-6 text-center text-sm font-bold text-teal-800">{selected.quantity}</span><button type="button" aria-label={`Add one ${item.name}`} onClick={() => updateQuantity(item.id, selected.quantity + 1)} className="grid h-8 w-8 place-items-center rounded-full bg-teal-700 text-white hover:bg-teal-800"><Plus className="h-4 w-4" /></button></div>;
    return <button type="button" onClick={() => addToCart(item)} className="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-teal-200 bg-teal-50 px-3 text-xs font-bold text-teal-700 transition hover:bg-teal-700 hover:text-white sm:text-sm"><CalendarDays className="h-4 w-4" />Add to Booking</button>;
}

function PriceAndAction({ item, cart, addToCart, updateQuantity }) {
    return <div className="mt-4 flex min-w-0 items-center justify-between gap-2"><p className="whitespace-nowrap text-base font-black text-teal-700 sm:text-lg">{item.price?.toLocaleString('vi-VN')}₫</p><AddToBooking item={item} cart={cart} addToCart={addToCart} updateQuantity={updateQuantity} /></div>;
}

function FeaturedDish({ item, cart, favoriteIds, toggleFavorite, addToCart, updateQuantity }) {
    return <motion.article initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} className="group grid overflow-hidden rounded-2xl border border-white/90 bg-white/95 shadow-lg backdrop-blur sm:grid-cols-2 lg:min-h-[330px]">
        <div className="relative min-h-[230px] overflow-hidden sm:min-h-full"><img src={item.image || '/cafe.jpg'} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute left-4 top-4 rounded-full bg-teal-800/90 px-3 py-1 text-xs font-bold text-white">Featured</span><div className="absolute right-4 top-4"><FavoriteButton item={item} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite} /></div></div>
        <div className="flex flex-col justify-center p-6 sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">{item.category || 'Chef selection'}</p><h2 className="mt-2 text-2xl font-black text-slate-950">{item.name}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{item.description || 'Freshly prepared from the BrewCraft kitchen.'}</p><div className="mt-auto pt-6"><PriceAndAction item={item} cart={cart} addToCart={addToCart} updateQuantity={updateQuantity} /></div></div>
    </motion.article>;
}

function CompactDish({ item, cart, favoriteIds, toggleFavorite, addToCart, updateQuantity, compact = false }) {
    return <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`group grid min-w-0 overflow-hidden rounded-2xl border border-white/90 bg-white/95 shadow-md backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg ${compact ? 'sm:grid-cols-[112px_minmax(0,1fr)]' : 'sm:grid-cols-[112px_minmax(0,1fr)]'}`}>
        <div className="relative min-h-[112px] overflow-hidden"><img src={item.image || '/cafe.jpg'} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><div className="absolute right-2 top-2"><FavoriteButton item={item} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite} /></div></div>
        <div className="flex min-w-0 flex-col justify-center p-4"><p className="truncate text-base font-black text-slate-950">{item.name}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{item.description || 'Freshly prepared from the BrewCraft kitchen.'}</p><div className="mt-3 flex min-w-0 items-center justify-between gap-2"><p className="whitespace-nowrap text-sm font-black text-teal-700">{item.price?.toLocaleString('vi-VN')}₫</p><AddToBooking item={item} cart={cart} addToCart={addToCart} updateQuantity={updateQuantity} /></div></div>
    </motion.article>;
}

export default function Menu() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        addToCart,
        cart,
        categories,
        error,
        filteredMenu,
        favoriteIds,
        getTotalPrice,
        loading,
        removeFromCart,
        searchTerm,
        priceRange,
        selectedCategory,
        setSearchTerm,
        setPriceRange,
        setSelectedCategory,
        toggleFavorite,
        updateQuantity
    } = useMenuCatalog(user);

    const goToBooking = () => {
        navigate('/booking', { state: { selectedItems: cart } });
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
        <div className="min-h-screen bg-[#f8fdfa] bg-fixed pt-20" style={pageBackground}>
            <div className="container mx-auto max-w-7xl px-4 pb-12 pt-8 sm:pt-10">
                <motion.section initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-5xl text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.35em] text-teal-700">Explore Our Menu</p>
                    <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Our Delicious Menu</h1>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Fresh ingredients. Great coffee. Memorable moments. Choose your favourite dishes and add them to a reservation in one smooth flow.</p>
                </motion.section>

                <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-2">
                    {categories.map((category) => <button type="button" key={category} onClick={() => setSelectedCategory(category)} className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${selectedCategory === category ? 'border-teal-700 bg-teal-700 text-white shadow-md' : 'border-teal-100 bg-white/85 text-slate-700 hover:border-teal-300 hover:bg-white'}`}>{category}</button>)}
                </div>
                <div className="mx-auto mt-3 flex max-w-4xl flex-wrap items-center justify-center gap-2 text-sm">
                    <span className="mr-1 font-semibold text-slate-600">Price range</span>
                    {[['ALL', 'All'], ['UNDER_50', 'Under 50k'], ['50_100', '50k - 100k'], ['ABOVE_100', 'Above 100k']].map(([value, label]) => <button type="button" key={value} onClick={() => setPriceRange(value)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${priceRange === value ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-white'}`}>{label}</button>)}
                </div>
                <div className="mx-auto mt-5 max-w-xl"><div className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Search dishes, coffee, or anything delicious..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full rounded-full border border-teal-100 bg-white/95 py-3.5 pl-12 pr-5 text-sm text-slate-800 shadow-lg outline-none placeholder:text-slate-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-200" /></div></div>

                {filteredMenu.length === 0 ? <div className="mt-10 rounded-2xl bg-white/85 py-20 text-center shadow-sm"><p className="text-lg text-slate-500">No dishes found</p></div> : <>
                    <div className="mt-10 grid gap-5 lg:grid-cols-2">
                        <FeaturedDish item={filteredMenu[0]} cart={cart} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite} addToCart={addToCart} updateQuantity={updateQuantity} />
                        <div className="grid gap-5 sm:grid-cols-2">
                            {filteredMenu.slice(1, 5).map((item) => <CompactDish key={item.id} item={item} cart={cart} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite} addToCart={addToCart} updateQuantity={updateQuantity} />)}
                        </div>
                    </div>
                    {filteredMenu.length > 5 && <>
                        <div className="my-8 flex items-center justify-center gap-4 text-center"><span className="hidden h-px w-16 bg-teal-200 sm:block" /><h2 className="text-lg font-bold text-slate-900">More from Our Menu</h2><span className="hidden h-px w-16 bg-teal-200 sm:block" /></div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{filteredMenu.slice(5).map((item) => <CompactDish key={item.id} item={item} cart={cart} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite} addToCart={addToCart} updateQuantity={updateQuantity} compact />)}</div>
                    </>}
                </>}
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
