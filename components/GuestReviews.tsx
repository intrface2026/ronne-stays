'use client';

import React from 'react';
import { motion } from 'framer-motion';

const reviews = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    location: 'London, UK',
    text: 'Absolutely unparalleled experience. The attention to detail in the property was stunning, and the concierge service made our Goa trip unforgettable.',
    image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: 2,
    name: 'Rahul Sharma',
    location: 'Bangalore, India',
    text: 'Our Candy Floss Blue Lagoon Villa stay was breathtaking. Ronne Stays made our Goa trip effortless with their seamless service.',
    image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: 3,
    name: 'Elena Rostova',
    location: 'Moscow, Russia',
    text: 'A hidden gem in Verla. Waking up to the lush greenery and birdsong was magical. True luxury combined with authentic Goan charm.',
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: 4,
    name: 'Michael Chang',
    location: 'Singapore',
    text: 'Impeccable service and beautifully designed interiors. We felt like royalty during our entire stay. Will definitely be returning next year.',
    image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: 5,
    name: 'Emma Thompson',
    location: 'Sydney, Australia',
    text: 'The best night sleep I\'ve had in months! The beds are incredibly comfortable and the serene environment is perfect for unwinding.',
    image: 'https://images.pexels.com/photos/3792581/pexels-photo-3792581.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: 6,
    name: 'Vikram Singh',
    location: 'Delhi, India',
    text: 'A true 5-star experience. The kitchen was fully equipped for our family needs, and the location is incredible. Highly recommended.',
    image: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  }
];

// Duplicate the array to create a seamless infinite loop
const duplicatedReviews = [...reviews, ...reviews];

export default function GuestReviews() {
  return (
    <section className="bg-white pt-20 pb-10 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex justify-center mb-12">
          <div className="relative w-full text-center">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 w-[600px] h-[300px] border-t border-gray-200 rounded-t-full opacity-50"></div>
             <p className="font-semibold text-sm mb-6 text-gray-900">Guest Review ☺</p>
          </div>
        </div>
      </div>

      <div className="relative flex overflow-x-hidden w-full group py-4">
        {/* Carousel tracking wrapper */}
        <motion.div
          className="flex gap-16 px-6 items-start"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 60,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {duplicatedReviews.map((review, idx) => (
            <div
              key={`${review.id}-${idx}`}
              className="relative w-[320px] md:w-[600px] shrink-0 text-center flex flex-col justify-start"
            >
              <h3 className="text-xl md:text-2xl text-gray-600 leading-relaxed font-serif italic mb-8">
                &ldquo;{review.text}&rdquo;
              </h3>
              
              <div className="mt-auto flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full mb-3 overflow-hidden">
                  <img
                    src={review.image}
                    alt={review.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="font-bold text-sm text-gray-900">{review.name}</p>
                <p className="text-gray-400 text-xs">{review.location}</p>
              </div>
            </div>
          ))}
        </motion.div>
        
        {/* Fade masks for smooth entry/exit seamlessly matching white background */}
        <div className="absolute inset-y-0 left-0 w-16 md:w-64 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 md:w-64 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
