'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, MapPin, Loader2 } from 'lucide-react';
import { LoadingState, ConciergeResponse } from '@/types';

const AiConcierge = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<ConciergeResponse | null>(null);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setStatus(LoadingState.ANALYZING);
    try {
      const res = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error('Concierge request failed');
      const result = (await res.json()) as ConciergeResponse;
      setResponse(result);
      setStatus(LoadingState.COMPLETE);
    } catch (error) {
      console.error(error);
      setStatus(LoadingState.ERROR);
    }
  };

  return (
    <section className="py-20 px-6 bg-ronne-green-dark text-white overflow-hidden relative" id="ai-concierge">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gray-800 rounded-full blur-[120px] opacity-30 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900 rounded-full blur-[100px] opacity-20 translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

      <div className="container mx-auto relative z-10 max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-medium text-white/90">AI Powered Guide</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">
            Plan Your Goa Itinerary <br/> With Our Virtual Concierge
          </h2>
          <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto font-light">
            Ask about beaches near Arpora, places to eat around Crazy Crabs, or what to expect at our private pool villas in North Goa.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-2 md:p-4 backdrop-blur-xl">
            <form onSubmit={handleAsk} className="relative flex items-center">
              <input 
                type="text" 
                placeholder="Ex. Which stay is best for 4 adults near Arpora?"
                className="w-full bg-transparent border-none outline-none text-white placeholder:text-gray-500 px-6 py-4 text-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={status === LoadingState.ANALYZING}
                className="absolute right-2 bg-ronne-gold text-white p-3 rounded-full hover:brightness-110 transition-all disabled:opacity-50"
              >
                {status === LoadingState.ANALYZING ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>

          <AnimatePresence mode="wait">
            {status === LoadingState.COMPLETE && response && (
              <motion.div 
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 text-left bg-white/5 border border-white/20 rounded-2xl p-8"
              >
                <div className="flex gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white text-ronne-green-dark flex items-center justify-center shrink-0 font-serif font-bold">R</div>
                  <div>
                    <p className="text-gray-200 leading-relaxed text-lg">{response.answer}</p>
                  </div>
                </div>

                {response.suggestedLocations.length > 0 && (
                  <div className="pl-14">
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Suggested Spots</p>
                     <div className="flex flex-wrap gap-3">
                        {response.suggestedLocations.map((loc, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer border border-white/5">
                            <MapPin className="w-3 h-3 text-yellow-300" />
                            <span className="text-sm font-medium">{loc}</span>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default AiConcierge;