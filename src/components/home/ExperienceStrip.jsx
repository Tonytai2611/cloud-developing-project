import React from 'react';
import { CalendarCheck2, Coffee, UtensilsCrossed } from 'lucide-react';

const experiences = [
  { icon: Coffee, title: 'Specialty Coffee', description: 'Crafted with carefully selected beans.' },
  { icon: UtensilsCrossed, title: 'Fresh Cuisine', description: 'Quality ingredients prepared with care.' },
  { icon: CalendarCheck2, title: 'Easy Reservation', description: 'Choose your table and book in seconds.' },
];

export default function ExperienceStrip() {
  return (
    <section className="border-b border-teal-100 bg-[var(--color-page)] py-8" aria-label="BrewCraft experience">
      <div className="container grid gap-4 px-4 md:grid-cols-3">
        {experiences.map(({ icon: Icon, title, description }) => (
          <article key={title} className="flex items-center gap-4 border-teal-100 px-3 py-3 md:border-r md:last:border-r-0">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-800"><Icon className="h-6 w-6" /></span>
            <div><h2 className="font-bold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-600">{description}</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}
