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
          <StatsGrid />
          <QuickActions actions={props.actions} navigate={props.navigate} query={props.query} />
          <DashboardPanels />
        </main>
      </div>
    </div>
  );
}
