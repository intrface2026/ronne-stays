'use client';

// Design intent: On mobile the hero is a tall card with text at top and the
// search bar flowing naturally below — no overlap. On md+ the card fills more
// vertical space and the bar is pinned near the bottom via absolute positioning,
// with enough pb on the text block to prevent collision.

import React from 'react';
import { motion } from 'framer-motion';
import HeroSearchBar from '@/components/HeroSearchBar';

const Hero = () => {
  return (
    <div className="relative w-full px-3 sm:px-4 md:px-8 pt-16 sm:pt-20 md:pt-32 pb-6 md:pb-12">

      {/* ── Mobile layout: stacked card + bar below ── */}
      <div className="md:hidden flex flex-col gap-4">
        {/* Card */}
        <div className="relative rounded-3xl overflow-hidden h-[52vh] min-h-[280px]">
          <img
            src="https://images.pexels.com/photos/1268871/pexels-photo-1268871.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop"
            alt="Ronne Stays Villa Pool"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.75]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

          <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-5 z-10">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl xs:text-4xl sm:text-5xl font-serif text-white leading-tight tracking-tight"
            >
              Your Home Away{' '}
              <span className="italic font-light">From Home in Goa</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-3 text-white/85 text-sm sm:text-base font-light max-w-xs sm:max-w-sm"
            >
              From budget studios to premium 2BHKs and private villas — curated stays across North Goa.
            </motion.p>
          </div>
        </div>

        {/* Search bar — sits naturally below, no overlap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="w-full"
        >
          <HeroSearchBar />
        </motion.div>
      </div>

      {/* ── Desktop layout: full-bleed card with floating bar ── */}
      <div className="hidden md:block relative h-[88vh] min-h-[600px] max-h-[860px] w-full">
        {/* Clipped hero */}
        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden">
          <img
            src="https://images.pexels.com/photos/1268871/pexels-photo-1268871.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"
            alt="Ronne Stays Villa Pool"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.8]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

          {/* Text — pb-56 clears the floating search bar */}
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 z-10 pb-52 lg:pb-56">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl lg:text-6xl xl:text-7xl font-serif text-white leading-tight max-w-5xl mx-auto tracking-tight"
            >
              Your Home Away{' '}
              <span className="italic font-light">From Home in Goa</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-5 text-white/90 text-base lg:text-lg max-w-xl font-light"
            >
              From budget studios to premium 2BHKs and private villas — curated stays across North Goa.
            </motion.p>
          </div>
        </div>

        {/* Floating search bar */}
        <div className="absolute bottom-10 lg:bottom-14 left-0 right-0 px-4 flex justify-center z-30">
          <HeroSearchBar />
        </div>
      </div>
    </div>
  );
};

export default Hero;