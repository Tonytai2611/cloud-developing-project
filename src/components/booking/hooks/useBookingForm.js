import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { bookingApi } from '../services/bookingApi';
import { tableApi } from '../../table/services/tableApi';

export function useBookingForm({ user, selectedItems, selectedTable }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: user?.email || user?.username || '',
    guests: selectedTable?.seats || 2,
    tableId: selectedTable?.id || '',
    specialRequests: ''
  });

  useEffect(() => {
    if (user) {
      const email = user.email || user.username || '';
      setFormData(prev => ({ ...prev, email }));
    }
  }, [user]);

  useEffect(() => {
    fetchAvailableTables();
  }, []);

  const fetchAvailableTables = async () => {
    try {
      const response = await tableApi.list();
      const availableTables = response.data.filter(t => t.status === 'AVAILABLE');
      setTables(availableTables);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getTotalPrice = () => {
    return selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = user?.email || user?.username || formData.email || 'guest';
      const bookingData = {
        ...formData,
        userId,
        date: formatDateLocal(selectedDate),
        time: selectedTime,
        selectedItems,
        total: getTotalPrice(),
        guests: parseInt(formData.guests)
      };

      await bookingApi.create(bookingData);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error("Booking failed", {
        description: err.message || "An error occurred"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    currentMonth,
    formData,
    handleChange,
    handleSubmit,
    loading,
    selectedDate,
    selectedTime,
    setCurrentMonth,
    setSelectedDate,
    setSelectedTime,
    setStep,
    step,
    success,
    tables,
    totalPrice: getTotalPrice()
  };
}
