/* Hallmark · pre-emit critique: P5 H5 E4 S5 R5 V5 */
/* Hallmark · macrostructure: focused hospitality hero · tone: premium cafe · anchor hue: teal */
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck2, ChevronDown, Coffee, ShieldCheck } from 'lucide-react';

export default function Hero() {
  const landingHeroImage = `${process.env.PUBLIC_URL}/landingpage.png`;
  const scrollToContent = () => window.scrollTo({ top: window.innerHeight - 88, behavior: 'smooth' });

  return (
    <section className="relative h-screen min-h-[680px] w-full overflow-hidden">
      <div className="absolute inset-0">
        <img src={landingHeroImage} alt="BrewCraft cafe interior" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/10" />
      </div>

      <div className="relative z-10 flex h-full items-center pt-[88px]">
        <div className="container px-4">
          <div className="max-w-[620px]">
            <motion.p initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-amber-200">
              <Coffee className="h-4 w-4" /> Crafted at BrewCraft
            </motion.p>
            <motion.h1 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.08, duration: 0.55 }} className="mb-6 min-w-0 font-serif text-5xl font-semibold leading-[1.04] text-white [overflow-wrap:anywhere] md:text-7xl">
              Fresh coffee.<br />Warm tables.<br /><span className="text-teal-300">Memorable moments.</span>
            </motion.h1>
            <motion.p initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.16, duration: 0.55 }} className="mb-8 max-w-[480px] text-lg leading-8 text-white/80">
              Experience handcrafted coffee, fresh meals, and memorable moments at BrewCraft.
            </motion.p>
            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.24, duration: 0.55 }} className="flex flex-wrap items-center gap-4">
              <Link to="/booking" className="inline-flex h-[52px] items-center gap-2 whitespace-nowrap rounded-xl bg-teal-700 px-7 font-bold text-white shadow-lg shadow-black/20 transition-colors hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-950">
                Reserve a Table <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/menu" className="inline-flex h-[52px] items-center whitespace-nowrap rounded-xl border border-white/65 bg-white/10 px-7 font-bold text-white backdrop-blur-md transition-colors hover:bg-white hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Explore Menu
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.34, duration: 0.5 }} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/75">
              <span className="flex items-center gap-2"><CalendarCheck2 className="h-4 w-4 text-teal-300" /> Easy online reservation</span>
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-300" /> Secure account access</span>
            </motion.div>
          </div>
        </div>
      </div>

      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} onClick={scrollToContent} className="absolute bottom-6 left-1/2 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-2 text-white/70 transition-colors hover:text-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
        <span className="text-xs tracking-wider">SCROLL DOWN</span>
        <ChevronDown className="h-6 w-6" />
      </motion.button>
    </section>
  );
}
