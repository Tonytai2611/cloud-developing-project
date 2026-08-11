import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { tableApi } from '../../table/services/tableApi';

export function useAdminTables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    tableNumber: '',
    seats: 4,
    status: 'AVAILABLE'
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await tableApi.list();
      setTables(response.data);
    } catch (err) {
      toast.error("Failed to load tables", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (table = null) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        tableNumber: table.tableNumber,
        seats: table.seats,
        status: table.status
      });
    } else {
      setEditingTable(null);
      setFormData({
        tableNumber: `Table ${tables.length + 1}`,
        seats: 4,
        status: 'AVAILABLE'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        seats: parseInt(formData.seats)
      };

      if (editingTable) {
        const response = await tableApi.update(editingTable.id, data);
        setTables(tables.map(t => t.id === editingTable.id ? response.data : t));
        toast.success("Table updated successfully");
      } else {
        const response = await tableApi.create(data);
        setTables([...tables, response.data]);
        toast.success("Table added successfully");
      }
      setShowModal(false);
    } catch (err) {
      toast.error("Failed to save table", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;

    setLoading(true);
    try {
      await tableApi.delete(id);
      setTables(tables.filter(t => t.id !== id));
      toast.success("Table deleted successfully");
    } catch (err) {
      toast.error("Failed to delete table", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    editingTable,
    formData,
    handleDelete,
    handleOpenModal,
    handleSubmit,
    loading,
    setFormData,
    setShowModal,
    showModal,
    tables
  };
}
