/* Hallmark · pre-emit critique: P4 H5 E5 S5 R5 V4 */
/* Hallmark · admin workspace · genre: modern-minimal · theme: BrewCraft teal */
import React from 'react';
import AdminSidebar from '../dashboard/ui/AdminSidebar';
import AdminTopbar from '../dashboard/ui/AdminTopbar';
import DashboardLoading from '../dashboard/ui/DashboardLoading';
import { useAdminWorkspace } from '../hooks/useAdminWorkspace';

export default function AdminWorkspaceShell({ children, query, setQuery, searchPlaceholder, title, subtitle }) {
  const workspace = useAdminWorkspace();

  if (workspace.loading) return <DashboardLoading />;
  if (!workspace.isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AdminSidebar currentPath={workspace.currentPath} navigate={workspace.navigate} />
      <div className="min-w-0 lg:pl-64">
        <AdminTopbar user={workspace.user} query={query} setQuery={setQuery} onLogout={workspace.onLogout} searchPlaceholder={searchPlaceholder} title={title} subtitle={subtitle} />
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
