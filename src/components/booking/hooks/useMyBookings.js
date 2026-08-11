import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { bookingApi } from '../services/bookingApi';

export function useMyBookings(user) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchUserBookings = useCallback(async () => {
    try {
      setLoading(true);
      const email = user?.email || user?.username || '';

      if (!email) {
        toast.error('User not authenticated');
        setLoading(false);
        return;
      }

      const response = await bookingApi.list(email);
      const sortedBookings = (response.data || []).sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setBookings(sortedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings', {
        description: error.message || 'Please try again later'
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserBookings();
    } else {
      setLoading(false);
    }
  }, [fetchUserBookings, user]);

  const handleCancelBooking = async (bookingId) => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setCancellingId(bookingId);
      await bookingApi.updateStatus(bookingId, 'CANCELLED');

      toast.success('Booking cancelled successfully', {
        description: 'Your table has been released'
      });

      await fetchUserBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking', {
        description: error.message || 'Please try again'
      });
    } finally {
      setCancellingId(null);
    }
  };

  return {
    bookings,
    cancellingId,
    handleCancelBooking,
    loading
  };
}
