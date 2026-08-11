import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { menuApi } from '../../menu/services/menuApi';

const emptyDish = { name: '', description: '', price: '', image: '' };

export function useAdminMenuCategoryForm({ id, navigate }) {
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    dishes: []
  });
  const [dishes, setDishes] = useState([emptyDish]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState({});

  const handleDrag = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive({ ...dragActive, [index]: true });
    } else if (e.type === "dragleave") {
      setDragActive({ ...dragActive, [index]: false });
    }
  };

  const handleDrop = async (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive({ ...dragActive, [index]: false });

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleImageUpload(index, { target: { files: [e.dataTransfer.files[0]] } });
    }
  };

  const handleImageUpload = async (index, event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Invalid file type", {
        description: "Please select an image file"
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await menuApi.uploadImage(file);
      const newDishes = [...dishes];
      newDishes[index].image = result.url;
      setDishes(newDishes);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload image", {
        description: error.message
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index) => {
    const newDishes = [...dishes];
    newDishes[index].image = '';
    setDishes(newDishes);
  };

  const fetchMenuData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await menuApi.list();
      const menu = response.data.find(m => m.id === id);

      if (menu) {
        setFormData(menu);
        setDishes(menu.dishes || [emptyDish]);
        setIsEditMode(true);
      }
    } catch (error) {
      toast.error("Failed to load menu", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchMenuData();
    }
  }, [fetchMenuData, id]);

  const handleDishInputChange = (index, field, value) => {
    const newDishes = [...dishes];
    newDishes[index][field] = value;
    setDishes(newDishes);
  };

  const handleAddDish = () => {
    if (dishes.length < 6) {
      setDishes([...dishes, emptyDish]);
    } else {
      toast.warning("Maximum dishes reached", {
        description: "Cannot add more than 6 dishes per category"
      });
    }
  };

  const handleDeleteDish = (index) => {
    if (dishes.length > 1) {
      const newDishes = [...dishes];
      newDishes.splice(index, 1);
      setDishes(newDishes);
    } else {
      toast.warning("Cannot delete", {
        description: "At least one dish is required"
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.id || !formData.title) {
      toast.error("Missing required fields", {
        description: "Please fill in Menu ID and Title"
      });
      return;
    }

    const validDishes = dishes.filter(d => d.name && d.price);
    if (validDishes.length === 0) {
      toast.error("No valid dishes", {
        description: "Please add at least one dish with name and price"
      });
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        id: formData.id,
        title: formData.title,
        dishes: validDishes
      };

      if (isEditMode) {
        await menuApi.update(formData.id, requestData);
        toast.success("Menu updated successfully!");
      } else {
        await menuApi.create(requestData);
        toast.success("Menu created successfully!");
      }

      navigate('/admin/manage-menu');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error("Failed to save menu", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    dishes,
    dragActive,
    formData,
    handleAddDish,
    handleDeleteDish,
    handleDishInputChange,
    handleDrag,
    handleDrop,
    handleImageUpload,
    handleSubmit,
    isEditMode,
    isUploading,
    loading,
    removeImage,
    setFormData
  };
}
