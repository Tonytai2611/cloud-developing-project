import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChefHat,
  Coffee,
  HeartHandshake,
  Leaf,
  LayoutGrid,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';

const values = [
  {
    icon: Coffee,
    title: 'Quality Coffee',
    description: 'Carefully selected beans and handcrafted drinks, prepared with attention to every detail.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Fresh Cuisine',
    description: 'A thoughtful menu made with fresh ingredients and flavours worth coming back for.',
  },
  {
    icon: HeartHandshake,
    title: 'Warm Experience',
    description: 'A comfortable place for friends, families and meaningful conversations.',
  },
];

const highlights = [
  { icon: Leaf, eyebrow: '100%', label: 'Fresh ingredients' },
  { icon: ChefHat, eyebrow: 'Daily', label: 'Coffee & food preparation' },
  { icon: LayoutGrid, eyebrow: 'Flexible', label: 'Dining options' },
];

const reasons = [
  'Easy online table reservation',
  'Fresh menu prepared with care',
  'A more personal guest experience',
  'A warm, comfortable atmosphere',
];

export default function AboutSection() {
  return (
    <section id="about" className="scroll-mt-24 overflow-hidden bg-[#f6f4ee] py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65 }}
            className="relative min-h-[520px]"
          >
            <div className="absolute inset-0 overflow-hidden rounded-[2rem] bg-[#073d38] shadow-[0_28px_70px_rgba(4,45,41,0.2)]">
              <img
                src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1100"
                alt="Warm interior of BrewCraft café"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#032f2b]/80 via-[#032f2b]/10 to-transparent" />
            </div>

            <div className="absolute bottom-6 left-6 right-20 rounded-2xl border border-white/20 bg-[#063f3a]/80 p-5 text-white shadow-xl backdrop-blur-md sm:right-auto sm:max-w-[330px]">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/12 text-[#f2cb72]">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-serif text-xl font-semibold">Made for real moments</p>
                  <p className="mt-1 text-sm leading-6 text-white/75">
                    From a quiet morning coffee to dinner with the people who matter.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65, delay: 0.08 }}
          >
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#0b7f76]">About BrewCraft</p>
            <h2 className="mt-4 max-w-xl font-serif text-4xl font-bold leading-[1.06] text-[#092f2d] sm:text-5xl lg:text-[3.5rem]">
              More than coffee, it&apos;s a place to connect.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              BrewCraft is a modern café where handcrafted drinks, fresh food and warm conversations come together.
            </p>
            <p className="mt-4 max-w-xl leading-7 text-slate-600">
              We created a space that feels easy to return to—whether you are catching up with friends, sharing a meal or taking a quiet pause in your day.
            </p>

            <div className="mt-8 border-l-2 border-[#d4ae55] pl-6">
              <h3 className="font-serif text-2xl font-semibold text-[#092f2d]">Why BrewCraft?</h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-2.5 text-sm leading-6 text-slate-700">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dff1eb] text-[#087b70]">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        <div className="mt-20">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#0b7f76]">What matters to us</p>
            <h3 className="mt-3 font-serif text-3xl font-bold text-[#092f2d] sm:text-4xl">Good things, made with intention.</h3>
          </div>

          <div className="mt-9 grid overflow-hidden rounded-3xl border border-[#dce4df] bg-white shadow-[0_18px_50px_rgba(4,45,41,0.08)] md:grid-cols-3">
            {values.map(({ icon: Icon, title, description }, index) => (
              <article
                key={title}
                className={`p-7 sm:p-8 ${index > 0 ? 'border-t border-[#e3e9e5] md:border-l md:border-t-0' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e5f3ef] text-[#087b70]">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h4 className="font-serif text-xl font-bold text-[#092f2d]">{title}</h4>
                </div>
                <p className="mt-5 leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-8 grid rounded-3xl bg-[#0a4a45] px-6 py-7 text-white sm:grid-cols-3 sm:px-8">
          {highlights.map(({ icon: Icon, eyebrow, label }, index) => (
            <div
              key={label}
              className={`flex items-center gap-4 py-4 sm:px-6 ${index > 0 ? 'border-t border-white/15 sm:border-l sm:border-t-0' : ''}`}
            >
              <Icon className="h-7 w-7 shrink-0 text-[#f2cb72]" aria-hidden="true" />
              <div>
                <p className="font-serif text-2xl font-bold">{eyebrow}</p>
                <p className="text-sm text-white/70">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 overflow-hidden rounded-[2rem] bg-[#062f2c] text-white shadow-[0_26px_70px_rgba(4,45,41,0.18)]">
          <div className="grid items-center gap-8 px-7 py-10 sm:px-10 lg:grid-cols-[1fr_auto] lg:px-14 lg:py-12">
            <div>
              <div className="flex items-center gap-2 text-[#f2cb72]">
                <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold uppercase tracking-[0.18em]">Your table is waiting</span>
              </div>
              <h3 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">Ready for your next coffee moment?</h3>
              <p className="mt-3 max-w-2xl text-white/70">Discover something you love, then reserve a place to enjoy it.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/menu"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 px-6 font-semibold text-white hover:bg-white/10"
              >
                Explore Menu
              </Link>
              <Link
                to="/booking"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f2cb72] px-6 font-bold text-[#073d38] hover:bg-[#f7d98f]"
              >
                Reserve a Table <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
