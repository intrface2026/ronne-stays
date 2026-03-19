'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowUpRight } from 'lucide-react';

const PHONE = '+91 98765 43210';

function navigateOrScroll(
  href: string,
  pathname: string,
  router: ReturnType<typeof useRouter>
) {
  if (pathname !== '/') {
    router.push(`/${href === '#home' ? '' : href.replace(/^#/, '') ? `#${href.replace(/^#/, '')}` : ''}`);
    return;
  }

  if (href === '#home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const target = document.querySelector(href);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 py-3'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-6 lg:px-12 flex justify-between items-center">
          <button
            type="button"
            onClick={() => navigateOrScroll('#home', pathname, router)}
            className="text-2xl font-serif font-bold text-gray-900 tracking-tight hover:opacity-80 transition-opacity duration-200"
          >
          Ronne Stays
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-10">
          <button
            type="button"
            onClick={() => navigateOrScroll('#home', pathname, router)}
            className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => navigateOrScroll('#properties-section', pathname, router)}
            className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >
            Villas & Apartments
          </button>
          <button
            type="button"
            onClick={() => navigateOrScroll('#experience', pathname, router)}
            className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >
            Experience
          </button>
          <button
            type="button"
            onClick={() => navigateOrScroll('#contact', pathname, router)}
            className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >
            Contact
          </button>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <a
            href={`tel:${PHONE.replace(/\s/g, '')}`}
            className="text-sm font-medium text-gray-900"
          >
            {PHONE}
          </a>
          <div className="h-8 w-[1px] bg-gray-300" />
          <button
            type="button"
            onClick={() => navigateOrScroll('#properties-section', pathname, router)}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-all"
          >
            Book Now
            <div className="bg-white/20 rounded-full p-0.5">
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-gray-900"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              <button
                type="button"
                onClick={() => {
                  navigateOrScroll('#home', pathname, router);
                  setIsOpen(false);
                }}
                className="text-left text-gray-600 hover:text-black font-medium"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => {
                  navigateOrScroll('#properties-section', pathname, router);
                  setIsOpen(false);
                }}
                className="text-left text-gray-600 hover:text-black font-medium"
              >
                Stays
              </button>
              <button
                type="button"
                onClick={() => {
                  navigateOrScroll('#properties-section', pathname, router);
                  setIsOpen(false);
                }}
                className="w-full py-3 bg-black text-white rounded-full font-medium"
              >
                Book Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
