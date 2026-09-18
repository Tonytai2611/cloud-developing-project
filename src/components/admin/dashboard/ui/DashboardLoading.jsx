import React from 'react';

export default function DashboardLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50" aria-busy="true">
      <div className="text-center">
        <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" />
        <p className="font-semibold text-slate-700">Loading dashboard…</p>
      </div>
    </main>
  );
}
