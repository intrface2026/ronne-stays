'use client';

// Design intent: Fixed glass navbar with a full-height mobile drawer overlay.
// Uses a scroll-locked AnimatePresence panel that slides down from the header,
// ensures all nav links + phone CTA are accessible on every viewport.

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowUpRight, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

const PHONE = '+91 98765 43210';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Villas & Apartments', href: '#properties-section' },
  { label: 'Experience', href: '#experience' },
  { label: 'Contact', href: '#contact' },
];

function navigateOrScroll(
  href: string,
  pathname: string,
  router: ReturnType<typeof useRouter>
) {
  if (pathname !== '/') {
    router.push(
      `/${href === '#home' ? '' : href.replace(/^#/, '') ? `#${href.replace(/^#/, '')}` : ''}`
    );
    return;
  }
  if (href === '#home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const target = document.querySelector(href);
  if (target) target.scrollIntoView({ behavior: 'smooth' });
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  /* ── Scroll detection ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Lock body scroll while mobile menu is open ── */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* ── Close drawer on route change ── */
  useEffect(() => { setIsOpen(false); }, [pathname]);

  const handleNavClick = (href: string) => {
    navigateOrScroll(href, pathname, router);
    setIsOpen(false);
  };

  return (
    <>
      {/* ── Main bar ── */}
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          'h-16 sm:h-20 md:h-28 flex items-center',
          scrolled || isOpen
            ? 'bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm'
            : 'bg-transparent'
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 flex justify-between items-center w-full">

          {/* Logo */}
          <button
            type="button"
            onClick={() => handleNavClick('#home')}
            className="flex items-center hover:opacity-80 transition-opacity duration-200 shrink-0"
            aria-label="Go to homepage"
          >
            <Image
              src="/7.png"
              alt="Ronne Stays Logo"
              width={240}
              height={240}
              className="w-auto h-14 sm:h-16 md:h-24 object-contain md:scale-[1.35] origin-left"
              priority
            />
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            {NAV_LINKS.map(({ label, href }) => (
              <button
                key={href}
                type="button"
                onClick={() => handleNavClick(href)}
                className="text-sm font-medium text-gray-600 hover:text-ronne-green-dark transition-colors whitespace-nowrap"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-6">
            <a
              href={`tel:${PHONE.replace(/\s/g, '')}`}
              className="text-sm font-medium text-gray-900 hover:text-ronne-green-dark transition-colors"
            >
              {PHONE}
            </a>
            <div className="h-8 w-[1px] bg-gray-300" />
            <button
              type="button"
              onClick={() => handleNavClick('#properties-section')}
              className="flex items-center gap-2 bg-ronne-green text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-ronne-green-dark transition-all"
            >
              Book Now
              <div className="bg-white/20 rounded-full p-0.5">
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            className="md:hidden flex items-center justify-center p-2 -mr-2 rounded-lg text-gray-900 hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isOpen ? 'close' : 'open'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'fixed z-40 left-0 right-0 md:hidden',
              'top-16 sm:top-20', // aligns flush below navbar height
              'bg-white border-b border-gray-100 shadow-lg',
              'overflow-y-auto max-h-[calc(100dvh-4rem)] sm:max-h-[calc(100dvh-5rem)]'
            )}
          >
            <div className="flex flex-col px-4 sm:px-6 py-6 gap-1">

              {/* Nav links */}
              {NAV_LINKS.map(({ label, href }) => (
                <button
                  key={href}
                  type="button"
                  onClick={() => handleNavClick(href)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl',
                    'text-base font-medium text-gray-700',
                    'hover:text-ronne-green-dark hover:bg-ronne-green/5',
                    'transition-colors duration-150'
                  )}
                >
                  {label}
                </button>
              ))}

              {/* Divider */}
              <div className="my-3 h-[1px] bg-gray-100" />

              {/* Phone */}
              <a
                href={`tel:${PHONE.replace(/\s/g, '')}`}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl',
                  'text-base font-medium text-gray-700',
                  'hover:text-ronne-green-dark hover:bg-ronne-green/5',
                  'transition-colors duration-150'
                )}
              >
                <Phone className="w-4 h-4 text-ronne-green shrink-0" />
                {PHONE}
              </a>

              {/* Book Now CTA */}
              <button
                type="button"
                onClick={() => handleNavClick('#properties-section')}
                className={cn(
                  'mt-2 w-full flex items-center justify-center gap-2',
                  'bg-ronne-green hover:bg-ronne-green-dark text-white',
                  'px-5 py-3.5 rounded-full text-base font-semibold',
                  'transition-all duration-200 active:scale-[0.98]'
                )}
              >
                Book Now
                <div className="bg-white/20 rounded-full p-0.5">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
