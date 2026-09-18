import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../../hooks/useAuth';
import { requestAdminLogout } from '../dashboard/services/adminDashboardService';

export function useAdminWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, logout } = useAuth();
  const isAdmin = Boolean(user && (user.isAdmin || user.role === 'admin'));

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/', { replace: true });
  }, [isAdmin, loading, navigate]);

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

  return { currentPath: location.pathname, isAdmin, loading, navigate, onLogout, user };
}
