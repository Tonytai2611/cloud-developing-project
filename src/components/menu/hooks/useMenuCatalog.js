import { useEffect, useState } from 'react';
import { menuApi } from '../services/menuApi';

export function useMenuCatalog() {
  const [menuCategories, setMenuCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchMenu();
  }, []);

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

  const filteredMenu = allDishes.filter(item => {
    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
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
    loading,
    removeFromCart,
    searchTerm,
    selectedCategory,
    setActiveImageIndex,
    setSearchTerm,
    setSelectedCategory,
    updateQuantity
  };
}
