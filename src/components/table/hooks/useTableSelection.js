import { useEffect, useState } from 'react';
import { tableApi } from '../services/tableApi';

export function useTableSelection() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [filterSeats, setFilterSeats] = useState('all');

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await tableApi.list();
      setTables(response.data || []);
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (table) => {
    if (table.status === 'AVAILABLE') {
      setSelectedTable(table);
    }
  };

  const filteredTables = tables.filter(table => {
    if (filterSeats === 'all') return true;
    const seats = parseInt(filterSeats);
    return table.seats === seats;
  });

  const availableTables = tables.filter(t => t.status === 'AVAILABLE');

  return {
    availableTables,
    filterSeats,
    filteredTables,
    handleSelectTable,
    loading,
    selectedTable,
    setFilterSeats
  };
}
