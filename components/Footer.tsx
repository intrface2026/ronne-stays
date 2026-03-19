import React from 'react';
import Image from 'next/image';
import { Twitter, Instagram, Linkedin, Globe, ArrowRight } from 'lucide-react';
import EnquiryForm from '@/components/EnquiryForm';

const Footer = () => {
  return (
    <footer id="contact" className="bg-white pt-20 pb-10 relative overflow-hidden scroll-mt-20">
      <div className="container mx-auto px-6">


        {/* Big Text */}
        <div className="relative py-12 border-t border-gray-100 flex flex-col items-center justify-center gap-6">
           <Image src="/7.png" alt="Ronne Stays Logo" width={200} height={200} className="w-32 h-32 md:w-48 md:h-48 object-contain" />
           <h1 className="text-[12vw] leading-[0.8] font-serif tracking-tighter text-center uppercase text-ronne-green opacity-90">
              Ronne Stays
           </h1>
           
           {/* Floating Image Over Text */}
           {/* Removed floating image as per request */}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 text-sm">
           <div className="col-span-2 md:col-span-1">
              <div className="text-2xl font-serif font-bold mb-4 text-ronne-green">Ronne Stays.</div>
              <p className="text-gray-500 w-3/4">North Goa, India</p>
           </div>
           
           <div className="flex flex-col gap-3">
              <a href="#properties-section" className="link-arrow group">Our Properties <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"/></a>
              <a href="#experience" className="link-arrow group">Goa Guide <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"/></a>
              <a href="#contact" className="link-arrow group">Contact us <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"/></a>
           </div>
           
           <div className="col-span-2 md:col-span-2">
              <p className="text-gray-500 text-center md:text-right w-full md:w-3/4 ml-auto">
                 Studio apartments, 1BHK & 2BHK stays in Arpora, plus 3BHK villas across North Goa — built for comfort, privacy, and convenience.
              </p>
           </div>
        </div>

        <EnquiryForm />

        <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex gap-4">
              <Linkedin className="w-4 h-4 text-gray-400 hover:text-gray-900 cursor-pointer transition-colors duration-200"/>
              <Instagram className="w-4 h-4 text-gray-400 hover:text-gray-900 cursor-pointer transition-colors duration-200"/>
              <Twitter className="w-4 h-4 text-gray-400 hover:text-gray-900 cursor-pointer transition-colors duration-200"/>
           </div>
           <p className="text-xs text-gray-400">© 2024 Ronne Stays. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;