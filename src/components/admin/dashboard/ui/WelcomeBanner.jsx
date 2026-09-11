import React from 'react';
import { Coffee } from 'lucide-react';

export default function WelcomeBanner({ user }) {
  const name = user?.name?.split(' ')[0] || 'Admin';
  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-teal-100 bg-teal-50 px-6 py-7 sm:px-10">
      <img src={`${process.env.PUBLIC_URL}/admin.png`} alt="" aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 hidden h-full w-1/2 object-cover opacity-90 md:block" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-teal-50 via-teal-50/95 to-white/20" />
      <div className="max-w-xl"><p className="mb-2 flex items-center gap-2 text-sm font-bold text-teal-700"><Coffee className="h-4 w-4" /> Today at BrewCraft</p><h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Welcome back, <span className="text-teal-700">{name}</span></h2><p className="mt-2 text-slate-600">Here’s what’s happening in your restaurant today.</p><p className="mt-4 text-sm italic text-slate-500">“Good food, great people, amazing days.”</p></div>
    </section>
  );
}
