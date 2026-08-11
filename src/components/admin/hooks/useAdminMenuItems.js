import { useEffect, useState } from 'react';
import { menuApi } from '../../menu/services/menuApi';

export function useAdminMenuItems() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Main Course',
    description: '',
    image: '',
    available: true
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const response = await menuApi.list();
      setMenu(response.data);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        price: '',
        category: 'Main Course',
        description: '',
        image: 'https://placehold.co/400x300/teal/white?text=New+Dish',
        available: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        price: parseInt(formData.price)
      };

      if (editingItem) {
        const response = await menuApi.update(editingItem.id, data);
        setMenu(menu.map(item => item.id === editingItem.id ? response.data : item));
        alert('Updated successfully!');
      } else {
        const response = await menuApi.create(data);
        setMenu([...menu, response.data]);
        alert('Dish added successfully!');
      }
      handleCloseModal();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dish?')) return;

    setLoading(true);
    try {
      await menuApi.delete(id);
      setMenu(menu.filter(item => item.id !== id));
      alert('Deleted successfully!');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredMenu = menu.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    editingItem,
    filteredMenu,
    formData,
    handleChange,
    handleCloseModal,
    handleDelete,
    handleOpenModal,
    handleSubmit,
    loading,
    searchTerm,
    setSearchTerm,
    setViewMode,
    showModal,
    viewMode
  };
}
