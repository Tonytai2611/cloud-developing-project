import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../../../hooks/useAuth';
import { dashboardActions, filterDashboardItems, requestAdminLogout } from '../services/adminDashboardService';
import { adminDashboardApi } from '../services/adminDashboardApi';

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
    const timer = window.setInterval(fetchSummary, 30000);
    return () => window.clearInterval(timer);
  }, [fetchSummary]);

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
