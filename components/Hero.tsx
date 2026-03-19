'use client';

import React from 'react';
import { motion } from 'framer-motion';
import HeroSearchBar from '@/components/HeroSearchBar';

const Hero = () => {
  return (
    <div className="relative w-full px-4 md:px-8 pt-24 pb-12">
      <div className="relative h-[85vh] min-h-[600px] w-full">
        {/* Clipped hero (rounded + overflow hidden) */}
        <div className="absolute inset-0 rounded-4xl md:rounded-[2.5rem] overflow-hidden">
          {/* Background Image - Swimming Pool / Luxury Villa */}
          <img
            src="https://images.pexels.com/photos/1268871/pexels-photo-1268871.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"
            alt="Ronne Stays Villa Pool"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.8]"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none"></div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-start md:justify-center pt-20 md:pt-0 items-center text-center px-4 md:px-6 z-10 md:pb-48">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <span className="px-4 py-2 rounded-2xl border border-white/30 bg-white/10 backdrop-blur-md text-white text-xs md:text-sm font-medium tracking-wide">
                Welcome to Ronne Stays
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-white leading-tight max-w-5xl tracking-tight"
            >
              Your Home Away <br className="md:hidden" />
              <span className="italic font-light">From Home in Goa</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-4 md:mt-6 text-white/90 text-sm md:text-lg max-w-xl font-light px-2"
            >
              From budget studios to premium 2BHKs and private villas — curated stays across North Goa.
            </motion.p>
          </div>
        </div>

        {/* Floating Search Bar (outside clipped container so dropdowns aren't clipped) */}
        <div className="absolute bottom-6 md:bottom-16 left-0 right-0 px-4 flex justify-center z-30">
          <HeroSearchBar />
        </div>
      </div>
    </div>
  );
};

export default Hero;