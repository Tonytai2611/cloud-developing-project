import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../../../hooks/useAuth';
import { dashboardActions, filterDashboardItems, requestAdminLogout } from '../services/adminDashboardService';

export function useAdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, logout } = useAuth();
  const [query, setQuery] = useState('');

  const isAdmin = Boolean(user && (user.isAdmin || user.role === 'admin'));

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/', { replace: true });
  }, [isAdmin, loading, navigate]);

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
  };
}
