import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, Plus, Minus, X, ChevronRight } from 'lucide-react';
import { useMenuCatalog } from '../hooks/useMenuCatalog';

export default function Menu() {
    const navigate = useNavigate();
    const {
        addToCart,
        cart,
        categories,
        error,
        filteredMenu,
        getTotalPrice,
        loading,
        removeFromCart,
        searchTerm,
        selectedCategory,
        setSearchTerm,
        setSelectedCategory,
        updateQuantity
    } = useMenuCatalog();

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
            {/* Header Section */}
            <div className="py-12">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-auto mb-8 max-w-5xl rounded-3xl border border-white/70 bg-white/70 px-6 py-7 text-center shadow-sm backdrop-blur"
                    >
                        <span className="text-teal-700 text-sm font-bold tracking-[0.3em] uppercase">Explore Our Menu</span>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-950 mt-2">
                            Our Delicious Menu
                        </h1>
                        <p className="mx-auto mt-3 max-w-2xl text-slate-600">Fresh ingredients. Great coffee. Memorable moments. Choose your favourite dishes and add them to a reservation in one smooth flow.</p>
                    </motion.div>

                    {/* Category Tabs */}
                    <div className="flex flex-wrap justify-center gap-3">
                        {categories.map((category, index) => (
                            <motion.button
                                key={category}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${selectedCategory === category
                                    ? 'bg-teal-700 text-white shadow-lg'
                                    : 'bg-white/80 text-slate-700 hover:bg-white border border-teal-100 shadow-sm'
                                    }`}
                            >
                                {category}
                            </motion.button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-md mx-auto mt-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search dishes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/95 border border-teal-100 rounded-full text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 shadow-lg transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto max-w-7xl px-4 pb-12">
                <div>
                    {/* Menu Grid */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full"
                    >
                        {filteredMenu.length === 0 ? (
                            <div className="rounded-3xl bg-white/80 py-20 text-center shadow-sm backdrop-blur">
                                <p className="text-xl text-gray-500">No dishes found</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                                <AnimatePresence>
                                    {filteredMenu.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-lg transition-all hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl backdrop-blur"
                                        >
                                            <div className="relative h-40 overflow-hidden bg-gray-100">
                                                <img
                                                    src={item.image || 'https://placehold.co/400x260/f3f4f6/0F4C4C?text=BrewCraft'}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-teal-800 shadow-sm">
                                                    {item.category || selectedCategory}
                                                </span>
                                            </div>
                                            <div className="p-5">
                                                <h3 className="text-lg font-black text-slate-950 transition-colors group-hover:text-teal-700">{item.name}</h3>
                                                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600 line-clamp-2">{item.description || 'Freshly prepared from the BrewCraft kitchen'}</p>
                                                <div className="mt-4 flex items-center justify-between gap-3">
                                                    <p className="text-lg font-black text-teal-700">{item.price?.toLocaleString('vi-VN')}₫</p>
                                                    {cart.find(i => i.id === item.id) ? (
                                                        <div className="flex items-center gap-2 rounded-full bg-teal-50 p-1">
                                                            <button onClick={() => updateQuantity(item.id, cart.find(i => i.id === item.id).quantity - 1)} className="grid h-8 w-8 place-items-center rounded-full bg-teal-100 text-teal-700 hover:bg-teal-600 hover:text-white"><Minus className="h-4 w-4" /></button>
                                                            <span className="w-7 text-center font-bold text-teal-800">{cart.find(i => i.id === item.id).quantity}</span>
                                                            <button onClick={() => updateQuantity(item.id, cart.find(i => i.id === item.id).quantity + 1)} className="grid h-8 w-8 place-items-center rounded-full bg-teal-600 text-white hover:bg-teal-700"><Plus className="h-4 w-4" /></button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => addToCart(item)} className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border border-teal-200 bg-teal-50 px-4 text-sm font-bold text-teal-700 hover:bg-teal-600 hover:text-white">
                                                            <Plus className="h-4 w-4" />
                                                            Add
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                </div>
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
