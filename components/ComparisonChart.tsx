'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Home, Hotel, Check, X } from 'lucide-react';

const ComparisonChart = () => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
           <div className="max-w-2xl">
             <div className="inline-block px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-medium mb-4">Why Us</div>
             <h2 className="text-4xl md:text-5xl font-serif text-gray-900 leading-tight">
               More Space, More Privacy <br/> Same Luxury
             </h2>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hotel Model */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[2rem] p-8 md:p-12 border border-gray-100 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                  <Hotel className="w-6 h-6" />
               </div>
               <h3 className="text-2xl font-medium">Standard Hotel</h3>
            </div>
            
            <ul className="space-y-6">
               <li className="flex items-center gap-4 text-gray-500">
                  <div className="w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0"><X className="w-3 h-3"/></div>
                  <span>Average 300 sq.ft room</span>
               </li>
               <li className="flex items-center gap-4 text-gray-500">
                  <div className="w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0"><X className="w-3 h-3"/></div>
                  <span>No Kitchen or Dining area</span>
               </li>
               <li className="flex items-center gap-4 text-gray-500">
                  <div className="w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0"><X className="w-3 h-3"/></div>
                  <span>Shared Pool with hundreds</span>
               </li>
               <li className="flex items-center gap-4 text-gray-500">
                  <div className="w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0"><X className="w-3 h-3"/></div>
                  <span>Strict Check-in/out times</span>
               </li>
            </ul>
          </motion.div>

          {/* Ronne Stays Model */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-black rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <Home className="w-6 h-6" />
               </div>
               <h3 className="text-2xl font-medium">Ronne Stays</h3>
            </div>

            <ul className="space-y-6 relative z-10">
               <li className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0"><Check className="w-3 h-3"/></div>
                  <span className="font-medium">Spacious 1000+ sq.ft Apartments</span>
               </li>
               <li className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0"><Check className="w-3 h-3"/></div>
                  <span className="font-medium">Full Kitchen & Living Room</span>
               </li>
               <li className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0"><Check className="w-3 h-3"/></div>
                  <span className="font-medium">Private/Semi-Private Pools</span>
               </li>
               <li className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0"><Check className="w-3 h-3"/></div>
                  <span className="font-medium">Flexible & Homely Vibe</span>
               </li>
            </ul>

             <div className="absolute top-0 right-0 w-64 h-64 bg-gray-800/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonChart;