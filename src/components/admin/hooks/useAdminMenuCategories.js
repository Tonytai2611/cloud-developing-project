import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { menuApi } from '../../menu/services/menuApi';

export function useAdminMenuCategories({ navigate }) {
  const [menuCategories, setMenuCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const response = await menuApi.list();
      setMenuCategories(response.data || []);
    } catch (err) {
      toast.error("Failed to load menu", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    setLoading(true);
    try {
      await menuApi.delete(id);
      setMenuCategories(menuCategories.filter(cat => cat.id !== id));
      toast.success("Category deleted successfully");
    } catch (err) {
      toast.error("Failed to delete category", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (category) => {
    navigate(`/admin/manage-menu/form?id=${category.id}`);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredMenu = menuCategories.filter((category) => {
    if (!normalizedSearch) return true;
    const dishContent = (category.dishes || [])
      .map((dish) => `${dish.name || ''} ${dish.description || ''}`)
      .join(' ');
    return `${category.title || ''} ${dishContent}`.toLowerCase().includes(normalizedSearch);
  });

  return {
    filteredMenu,
    handleDelete,
    handleUpdate,
    loading,
    menuCategories,
    searchTerm,
    setSearchTerm
  };
}
