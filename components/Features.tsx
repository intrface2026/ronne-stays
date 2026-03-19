'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Utensils, Wifi, Waves, Car, Leaf, Home } from 'lucide-react';

const locationData = {
  Arpora: {
    title: (
      <>
        Vibrant Nightlife. <br/> Pristine Beaches.
      </>
    ),
    images: [
      "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop",
      "https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop"
    ],
    features: [
      {
        icon: <Waves className="w-5 h-5 text-gray-700"/>,
        title: "Close to Beaches",
        desc: "Just a short drive to the famous Goan beaches and vibrant nightlife."
      },
      {
        icon: <Utensils className="w-5 h-5 text-gray-700"/>,
        title: "Culinary Hotspots",
        desc: "Surrounded by some of the best cafes and restaurants in North Goa."
      }
    ]
  },
  Sangolda: {
    title: (
      <>
        Premium Amenities. <br/> Unmatched Locations.
      </>
    ),
    images: [
      "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop",
      "https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop"
    ],
    features: [
      {
        icon: <Wifi className="w-5 h-5 text-gray-700"/>,
        title: "High Speed Wifi",
        desc: "Stay connected with dedicated fiber lines for work or streaming."
      },
      {
        icon: <Car className="w-5 h-5 text-gray-700"/>,
        title: "Free Parking",
        desc: "Secure parking premises available for your rental cars or bikes."
      }
    ]
  },
  Verla: {
    title: (
      <>
        Serene Village Life. <br/> Authentic Charm.
      </>
    ),
    images: [
      "https://images.pexels.com/photos/237272/pexels-photo-237272.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop",
      "https://images.pexels.com/photos/3225531/pexels-photo-3225531.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop"
    ],
    features: [
      {
        icon: <Leaf className="w-5 h-5 text-gray-700"/>,
        title: "Lush Greenery",
        desc: "Wake up to birdsong and stunning views of the Goan countryside."
      },
      {
        icon: <Home className="w-5 h-5 text-gray-700"/>,
        title: "Heritage Homes",
        desc: "Experience the unique architecture and culture of traditional Goa."
      }
    ]
  }
};

type LocationKey = keyof typeof locationData;

const Features = () => {
  const [activeLocation, setActiveLocation] = useState<LocationKey>('Sangolda');

  return (
    <div id="experience" className="py-20 px-6 container mx-auto scroll-mt-20">
      
      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-32 items-center">
        <div className="lg:col-span-4 pr-8">
          <div className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium mb-6">Experience</div>
          <h2 className="text-4xl font-serif text-gray-900 mb-6 leading-tight">
            Designed for Comfort. Curated for You.
          </h2>
          <motion.button
            type="button"
            onClick={() => document.getElementById('properties-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn-primary px-8 py-3.5 text-sm group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Book Now</span>
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors duration-300">
              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </span>
          </motion.button>
        </div>

        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1 */}
          <div className="relative h-[400px] rounded-[2rem] overflow-hidden group cursor-pointer bg-gray-100">
            <img 
              src="https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop" 
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors"></div>
            <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                <Utensils className="w-3 h-3"/> Full Kitchen
            </div>
          </div>

          {/* Card 2 */}
          <div className="relative h-[400px] rounded-[2rem] overflow-hidden group cursor-pointer bg-gray-100">
            <img 
              src="https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop" 
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors"></div>
            <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                <Waves className="w-3 h-3"/> Swimming Pool
            </div>
             <div className="absolute bottom-6 left-6 text-white max-w-[80%]">
               <p className="text-lg font-medium leading-snug">Relax in our crystal clear pools after a beach day.</p>
             </div>
          </div>
        </div>
      </div>

      {/* Second Section - Feature Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
         
         {/* Left Side: Images */}
         <div className="relative w-full h-full min-h-[350px]">
            <div className="grid grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                 <motion.div 
                    key={`img1-${activeLocation}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="relative h-[300px] rounded-[2rem] overflow-hidden"
                 >
                   <img
                     src={locationData[activeLocation].images[0]}
                     alt=""
                     className="w-full h-full object-cover"
                   />
                 </motion.div>
                 <motion.div 
                     key={`img2-${activeLocation}`}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     transition={{ duration: 0.5, delay: 0.1 }}
                     className="relative h-[300px] rounded-[2rem] overflow-hidden mt-12"
                 >
                   <img
                     src={locationData[activeLocation].images[1]}
                     alt=""
                     className="w-full h-full object-cover"
                   />
                 </motion.div>
              </AnimatePresence>
            </div>
         </div>

         {/* Right Side: Text */}
         <div>
            <div className="flex items-center gap-4 mb-6">
              {(Object.keys(locationData) as LocationKey[]).map((loc) => (
                <button
                  key={loc}
                  onClick={() => setActiveLocation(loc)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                    activeLocation === loc 
                      ? 'bg-black text-white shadow-md' 
                      : 'border border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
            
            <AnimatePresence mode="wait">
               <motion.div
                  key={`content-${activeLocation}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4 }}
               >
                  <h2 className="text-4xl md:text-5xl font-serif text-gray-900 mb-8 leading-tight">
                    {locationData[activeLocation].title}
                  </h2>
                  
                  <div className="space-y-6">
                     {locationData[activeLocation].features.map((feature, idx) => (
                       <div key={idx} className="flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                             {feature.icon}
                          </div>
                          <div>
                             <h4 className="font-bold text-lg">{feature.title}</h4>
                             <p className="text-gray-500 text-sm">{feature.desc}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </motion.div>
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
};

export default Features;