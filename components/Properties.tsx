'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Wifi, Car, Tv, Utensils, Waves } from 'lucide-react';
import { RonneApi, type PropertyListItem, type PropertyType } from '@/lib/ronneApi';

const formatPricePerNight = (value: string | number) => {
  if (typeof value === 'string') return value.includes('₹') ? value : `₹${value}/night`;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value) + '/night';
};

const Properties = () => {
  const searchParams = useSearchParams();
  const [activeType, setActiveType] = React.useState<'ALL' | 'APARTMENTS' | PropertyType>('ALL');
  const [items, setItems] = React.useState<PropertyListItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const locationFilter = (searchParams.get('location') ?? '').trim();
  const guestsFilterRaw = searchParams.get('guests');
  const guestsFilter = guestsFilterRaw ? Number.parseInt(guestsFilterRaw, 10) : null;
  const checkIn = (searchParams.get('checkIn') ?? '').trim();
  const checkOut = (searchParams.get('checkOut') ?? '').trim();
  const guestsParam = typeof guestsFilter === 'number' && Number.isFinite(guestsFilter) && guestsFilter > 0 ? guestsFilter : undefined;

  React.useEffect(() => {
    let cancelled = false;
    setError(null);
    setItems(null);

    RonneApi.listProperties(
      activeType === 'ALL' || activeType === 'APARTMENTS'
        ? {
            guests: guestsParam,
            check_in: checkIn || undefined,
            check_out: checkOut || undefined,
          }
        : {
            type: activeType,
            guests: guestsParam,
            check_in: checkIn || undefined,
            check_out: checkOut || undefined,
          }
    )
      .then((res) => {
        if (cancelled) return;
        const filtered =
          activeType === 'APARTMENTS'
            ? res.items.filter((p) => p.type === 'BHK_1' || p.type === 'BHK_2')
            : res.items
        const byLocation = locationFilter
          ? filtered.filter((p) => p.location.toLowerCase().includes(locationFilter.toLowerCase()))
          : filtered;
        setItems(byLocation);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : 'Failed to load properties';
        setError(message);
        setItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [activeType, locationFilter, guestsFilterRaw, guestsParam, checkIn, checkOut]);

  return (
    <section id="properties-section" className="py-24 px-6 container mx-auto scroll-mt-24">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16">
        <div>
          <span className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-2 block">Our Collection</span>
          <h2 className="text-4xl md:text-5xl font-serif text-gray-900 leading-tight">
            Curated Stays <br/> Across Goa
          </h2>
          {locationFilter || guestsParam || checkIn || checkOut ? (
            <p className="mt-3 text-sm text-gray-600">
              Showing results
              {locationFilter ? (
                <>
                  {' '}
                  in <span className="font-semibold text-gray-900">{locationFilter}</span>
                </>
              ) : null}
              {guestsParam ? (
                <>
                  {' '}
                  for <span className="font-semibold text-gray-900">{guestsParam}</span> guests
                </>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 mt-6 md:mt-0">
          <motion.button
            className={`btn-outline px-6 py-2.5 ${activeType === 'ALL' ? 'active' : ''}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveType('ALL')}
          >
            All
          </motion.button>
          <motion.button
            className={`btn-outline px-6 py-2.5 ${activeType === 'VILLA' ? 'active' : ''}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveType('VILLA')}
          >
            Villas
          </motion.button>
          <motion.button
            className={`btn-outline px-6 py-2.5 ${activeType === 'APARTMENTS' ? 'active' : ''}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveType('APARTMENTS')}
          >
            Apartments
          </motion.button>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(items ?? Array.from({ length: 6 })).map((property, idx) => {
          const isSkeleton = typeof property !== 'object';
          if (isSkeleton) {
            return (
              <div key={idx} className="block group">
                <div className="cursor-pointer">
                  <div className="relative h-[400px] rounded-[2rem] overflow-hidden mb-6 bg-gray-100 animate-pulse" />
                  <div className="h-7 w-3/4 bg-gray-100 rounded animate-pulse mb-3" />
                  <div className="h-10 w-full bg-gray-100 rounded animate-pulse mb-4" />
                  <div className="h-6 w-2/3 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            );
          }

          const href = `/properties/${property.slug}`;
          return (
          <Link key={property.id} href={href} className="block group">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="cursor-pointer"
            >
              <div className="relative h-[400px] rounded-[2rem] overflow-hidden mb-6">
                <img 
                  src={property.primaryImageUrl || 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop'} 
                  alt={property.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
                  {property.location}
                </div>
                <div className="absolute bottom-4 right-4 bg-ronne-green/90 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-medium">
                  {formatPricePerNight(property.pricePerNight)}
                </div>
              </div>
              
              <h3 className="text-2xl font-serif font-medium text-gray-900 mb-2 group-hover:underline decoration-1 underline-offset-4">
                {property.name}
              </h3>
              <div className="flex items-start gap-2 text-gray-500 text-sm mb-4 h-10">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="line-clamp-2">{property.location}, Goa</p>
              </div>
              
              <div className="flex gap-4 border-t border-gray-100 pt-4">
                {property.amenities?.some((a) => a.name === 'Wifi') && <div className="flex items-center gap-1 text-xs font-medium text-gray-600"><Wifi className="w-3 h-3"/> Wifi</div>}
                {property.amenities?.some((a) => a.name === 'Pool') && <div className="flex items-center gap-1 text-xs font-medium text-gray-600"><Waves className="w-3 h-3"/> Pool</div>}
                {property.amenities?.some((a) => a.name === 'Kitchen') && <div className="flex items-center gap-1 text-xs font-medium text-gray-600"><Utensils className="w-3 h-3"/> Kitchen</div>}
                {property.amenities?.some((a) => a.name === 'Parking') && <div className="flex items-center gap-1 text-xs font-medium text-gray-600"><Car className="w-3 h-3"/> Parking</div>}
              </div>
            </motion.div>
          </Link>
        )})}
      </div>
    </section>
  );
};

export default Properties;