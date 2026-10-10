import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../../../hooks/useAuth';
import { dashboardActions, filterDashboardItems, requestAdminLogout } from '../services/adminDashboardService';
import { adminDashboardApi } from '../services/adminDashboardApi';
import { env } from '../../../../config/env';

export function useAdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [summary, setSummary] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

  const isAdmin = Boolean(user && (user.isAdmin || user.role === 'admin'));

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/', { replace: true });
  }, [isAdmin, loading, navigate]);

  const fetchSummary = useCallback(async () => {
    if (!isAdmin) return;
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      setSummary(await adminDashboardApi.summary());
    } catch (error) {
      setDashboardError(error);
    } finally {
      setDashboardLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (!isAdmin || !env.websocketUrl) return undefined;
    let active = true;
    let socket;
    let reconnectTimer;
    const refreshEvents = new Set(['reservation.created', 'reservation.updated', 'order.created', 'order.updated', 'dashboard.invalidate']);
    const connect = () => {
      const token = localStorage.getItem('accessToken') || '';
      if (!token || !active) return;
      socket = new WebSocket(`${env.websocketUrl}?userId=${encodeURIComponent(user?.email || user?.username || '')}&role=admin&accessToken=${encodeURIComponent(token)}`);
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (refreshEvents.has(message.type)) fetchSummary();
        } catch {}
      };
      socket.onclose = () => {
        if (active) reconnectTimer = window.setTimeout(connect, 5000);
      };
    };
    connect();
    return () => {
      active = false;
      window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [fetchSummary, isAdmin, user]);

  const actions = useMemo(
    () => (query ? filterDashboardItems(query) : dashboardActions),
    [query]
  );

  const onLogout = async () => {
    try {
      await requestAdminLogout();
      await logout();
      toast.success('Logged out successfully');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error('Logout failed', { description: error?.message || 'Please try again.' });
    }
  };

  return {
    loading,
    isAdmin,
    user,
    query,
    actions,
    currentPath: location.pathname,
    setQuery,
    navigate,
    onLogout,
    summary,
    dashboardLoading,
    dashboardError,
    retryDashboard: fetchSummary,
  };
}
