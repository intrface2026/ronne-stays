'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CheckCircle2, MapPin, Users } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring', stiffness: 50, damping: 20 }
  }
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.9, filter: 'blur(10px)' },
  visible: { 
    opacity: 1, 
    scale: 1, 
    filter: 'blur(0px)',
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 } 
  }
};

const AboutSection = () => {
  return (
    <section className="w-full bg-[#FAF9F6] py-20 md:py-24 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24">
          
          {/* Left Content */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="w-full lg:w-1/2 space-y-8"
          >
            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-serif text-gray-900 leading-tight">
              About Ronne Stays
            </motion.h2>
            
            <motion.p variants={itemVariants} className="text-sm md:text-lg text-gray-600 font-light leading-relaxed">
              At Ronne Stays, we believe your accommodation is more than just a place to sleep—it's the heart of your travel experience. We specialize in providing high-quality, professionally managed villas and apartments across Goa's most desirable locations. Our curated collection is designed to offer the perfect blend of luxury, comfort, and local authenticity.
            </motion.p>
            
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 sm:gap-8 pt-6 w-full max-w-sm">
              {/* Feature 1 */}
              <motion.div 
                whileHover={{ y: -8, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="flex flex-col items-center gap-3 text-center pt-2 cursor-pointer group"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center justify-center text-ronne-green border border-gray-100/50 group-hover:shadow-lg group-hover:border-ronne-green/30 transition-all duration-500">
                  <CheckCircle2 strokeWidth={1.5} className="w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-1 leading-snug group-hover:text-ronne-green transition-colors duration-300">
                  Verified<br/>Listings
                </span>
              </motion.div>
              
              {/* Feature 2 */}
              <motion.div 
                whileHover={{ y: -8, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="flex flex-col items-center gap-3 text-center pt-2 cursor-pointer group"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center justify-center text-ronne-green border border-gray-100/50 group-hover:shadow-lg group-hover:border-ronne-green/30 transition-all duration-500">
                  <MapPin strokeWidth={1.5} className="w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-1 leading-snug group-hover:text-ronne-green transition-colors duration-300">
                  Prime<br/>Location
                </span>
              </motion.div>
              
              {/* Feature 3 */}
              <motion.div 
                whileHover={{ y: -8, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="flex flex-col items-center gap-3 text-center pt-2 cursor-pointer group"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center justify-center text-ronne-green border border-gray-100/50 group-hover:shadow-lg group-hover:border-ronne-green/30 transition-all duration-500">
                  <Users strokeWidth={1.5} className="w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-1 leading-snug group-hover:text-ronne-green transition-colors duration-300">
                  Professional<br/>Hosting
                </span>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Content - Graphic */}
          <motion.div 
            variants={imageVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="w-full lg:w-1/2 flex justify-center lg:justify-end shrink-0"
          >
            <div 
              className="relative w-full max-w-[400px] lg:max-w-[450px] aspect-square flex items-center justify-center"
            >
              <Image 
                src="/1.png" 
                alt="Ronne Stays Brand Graphic"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain drop-shadow-xl"
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;
