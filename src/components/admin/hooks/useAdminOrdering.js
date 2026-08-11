import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { bookingApi } from '../../booking/services/bookingApi';
import { tableApi } from '../../table/services/tableApi';

export function useAdminOrdering() {
  const [bookings, setBookings] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const bookingsRes = await bookingApi.list();
      setBookings(bookingsRes.data || []);

      const tablesRes = await tableApi.list();
      setTables(tablesRes.data || []);
    } catch (err) {
      toast.error("Failed to load data", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId) => {
    if (!window.confirm('Approve this booking?')) return;

    setLoading(true);
    try {
      const response = await bookingApi.updateStatus(bookingId, 'CONFIRMED');
      setBookings(bookings.map(b => b.id === bookingId ? response.data : b));
      toast.success("Booking confirmed successfully");
      fetchData();
    } catch (err) {
      toast.error("Failed to confirm booking", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject this booking?')) return;

    setLoading(true);
    try {
      await bookingApi.updateStatus(bookingId, 'REJECTED');
      setBookings(bookings.filter(b => b.id !== bookingId));
      toast.success("Booking rejected");
      fetchData();
    } catch (err) {
      toast.error("Failed to reject booking", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;

    setLoading(true);
    try {
      await bookingApi.delete(bookingId);
      setBookings(bookings.filter(b => b.id !== bookingId));
      toast.success("Booking deleted successfully");
    } catch (err) {
      toast.error("Failed to delete booking", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = filter === 'ALL'
    ? bookings
    : bookings.filter(b => b.status === filter);

  const tableOnlyBookings = bookings.filter(b => {
    const price = b.totalPrice || b.total || 0;
    return price === 0;
  });

  const foodBookings = bookings.filter(b => {
    const price = b.totalPrice || b.total || 0;
    return price > 0;
  });

  return {
    bookings,
    filter,
    filteredBookings,
    foodBookings,
    handleApprove,
    handleDelete,
    handleReject,
    loading,
    setFilter,
    tableOnlyBookings,
    tables
  };
}
