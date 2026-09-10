import React from 'react';
import AdminDashboardLayout from '../../components/admin/dashboard/ui/AdminDashboardLayout';
import DashboardLoading from '../../components/admin/dashboard/ui/DashboardLoading';
import { useAdminDashboard } from '../../components/admin/dashboard/hooks/useAdminDashboard';

export default function Admin() {
  const dashboard = useAdminDashboard();

  if (dashboard.loading) return <DashboardLoading />;
  if (!dashboard.isAdmin) return null;

  return <AdminDashboardLayout {...dashboard} />;
}
