import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminDashboardApi } from '../dashboard/services/adminDashboardApi';
import { tableApi } from '../../table/services/tableApi';

export function useAdminOrdering() {
  const [bookings, setBookings] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const asList = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.items)) return value.items;
    return [];
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, reservationsRes] = await Promise.all([
        adminDashboardApi.orders(),
        adminDashboardApi.reservations(),
      ]);
      const merged = [...asList(ordersRes), ...asList(reservationsRes)]
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      setBookings(merged);

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
      const response = await adminDashboardApi.updateBookingStatus(bookingId, 'CONFIRMED');
      setBookings((current) => current.map(b => b.id === bookingId ? response : b));
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
      await adminDashboardApi.updateBookingStatus(bookingId, 'REJECTED');
      setBookings((current) => current.map(b => b.id === bookingId ? { ...b, status: 'REJECTED' } : b));
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
      await adminDashboardApi.deleteBooking(bookingId);
      setBookings((current) => current.filter(b => b.id !== bookingId));
      toast.success("Booking deleted successfully");
    } catch (err) {
      toast.error("Failed to delete booking", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (bookingId, data) => {
    setLoading(true);
    try {
      const updated = await adminDashboardApi.updateBooking(bookingId, data);
      setBookings((current) => current.map((booking) => booking.id === bookingId ? updated : booking));
      toast.success('Booking updated successfully');
      return updated;
    } catch (err) {
      toast.error('Failed to update booking', { description: err.message });
      throw err;
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
    handleUpdate,
    loading,
    setFilter,
    tableOnlyBookings,
    tables
  };
}
