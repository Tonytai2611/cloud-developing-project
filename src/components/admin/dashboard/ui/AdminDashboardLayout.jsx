/* Hallmark · pre-emit critique: P4 H5 E4 S5 R5 V5 */
/* Hallmark · admin dashboard · genre: modern-minimal · theme: BrewCraft teal */
import React from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import WelcomeBanner from './WelcomeBanner';
import StatsGrid from './StatsGrid';
import QuickActions from './QuickActions';
import DashboardPanels from './DashboardPanels';

export default function AdminDashboardLayout(props) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AdminSidebar currentPath={props.currentPath} navigate={props.navigate} />
      <div className="min-w-0 lg:pl-64">
        <AdminTopbar user={props.user} query={props.query} setQuery={props.setQuery} onLogout={props.onLogout} />
        <main className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6 lg:p-7">
          <WelcomeBanner user={props.user} />
          {props.dashboardError ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p className="font-bold">Unable to load dashboard data.</p><p className="mt-1">{props.dashboardError.message}</p><button type="button" onClick={props.retryDashboard} className="mt-3 rounded-lg bg-red-700 px-3 py-2 font-bold text-white">Retry</button></div> : null}
          <StatsGrid summary={props.summary} loading={props.dashboardLoading} />
          <QuickActions actions={props.actions} navigate={props.navigate} query={props.query} />
          <DashboardPanels summary={props.summary} loading={props.dashboardLoading} />
        </main>
      </div>
    </div>
  );
}
