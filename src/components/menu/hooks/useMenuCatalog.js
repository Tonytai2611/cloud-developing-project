import { useEffect, useState } from 'react';
import { menuApi } from '../services/menuApi';
import { favoritesApi } from '../services/favoritesApi';

export function useMenuCatalog(user) {
  const [menuCategories, setMenuCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [priceRange, setPriceRange] = useState('ALL');
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('brewcraft-favorite-dishes') || '[]');
    } catch {
      return [];
    }
  });
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    if (!user) return;
    favoritesApi.list()
      .then((response) => {
        const ids = (response.data || []).map((item) => String(item.dishId));
        setFavoriteIds(ids);
        localStorage.setItem('brewcraft-favorite-dishes', JSON.stringify(ids));
      })
      .catch((error) => console.warn('Favorites API unavailable, using local favourites:', error.message));
  }, [user]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const response = await menuApi.list();
      setMenuCategories(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const allDishes = menuCategories.flatMap(category =>
    category.dishes?.map(dish => ({
      ...dish,
      category: category.title,
      id: `${category.id}-${dish.name}`
    })) || []
  );

  const categories = ['All', ...new Set(menuCategories.map(cat => cat.title))];

  const addToCart = (item) => {
    const existingItem = cart.find(i => i.id === item.id);
    if (existingItem) {
      setCart(cart.map(i =>
        i.id === item.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(i =>
        i.id === itemId
          ? { ...i, quantity: newQuantity }
          : i
      ));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const toggleFavorite = async (itemId) => {
    const item = allDishes.find((dish) => dish.id === itemId);
    const wasFavorite = favoriteIds.includes(itemId);
    const next = wasFavorite
      ? favoriteIds.filter((id) => id !== itemId)
      : [...favoriteIds, itemId];
    setFavoriteIds(next);
    localStorage.setItem('brewcraft-favorite-dishes', JSON.stringify(next));

    if (user && item) {
      try {
        if (wasFavorite) await favoritesApi.remove(itemId);
        else await favoritesApi.save(item);
      } catch (error) {
        setFavoriteIds(favoriteIds);
        localStorage.setItem('brewcraft-favorite-dishes', JSON.stringify(favoriteIds));
        console.error('Failed to update favourite:', error);
      }
    }
  };

  const filteredMenu = allDishes.filter(item => {
    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const price = Number(item.price) || 0;
    const matchPrice = priceRange === 'ALL'
      || (priceRange === 'UNDER_50' && price < 50000)
      || (priceRange === '50_100' && price >= 50000 && price <= 100000)
      || (priceRange === 'ABOVE_100' && price > 100000);
    return matchCategory && matchSearch && matchPrice;
  });

  const featuredImages = filteredMenu.slice(0, 5).map(item => item.image).filter(Boolean);

  useEffect(() => {
    if (featuredImages.length > 1) {
      const interval = setInterval(() => {
        setActiveImageIndex((prev) => (prev + 1) % featuredImages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [featuredImages.length]);

  return {
    activeImageIndex,
    addToCart,
    cart,
    categories,
    error,
    featuredImages,
    filteredMenu,
    getTotalPrice,
    allDishes,
    favoriteIds,
    loading,
    removeFromCart,
    priceRange,
    searchTerm,
    selectedCategory,
    setActiveImageIndex,
    setSearchTerm,
    setSelectedCategory,
    setPriceRange,
    toggleFavorite,
    updateQuantity
  };
}
