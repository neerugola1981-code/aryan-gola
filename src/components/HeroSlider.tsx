import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag, Flame, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  price: string;
  image: string;
  colorClass: string;
}

const SLIDES: Slide[] = [
  {
    id: "prod-1",
    title: "Vision Pro Max 5G",
    subtitle: "Aerospace Titanium. 108MP Space Zoom. Peak Mobile Performance.",
    badge: "NEW RELEASE",
    price: "From ₹79,999",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=1200",
    colorClass: "from-purple-900/40 via-neutral-900/80 to-neutral-950"
  },
  {
    id: "prod-2",
    title: "Vision UltraBook 14",
    subtitle: "Unified Creators Beast. Intel Ultra 7 & 18-hour Battery.",
    badge: "CREATIVE POWERHOUSE",
    price: "From ₹99,999",
    image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=1200",
    colorClass: "from-blue-950/40 via-neutral-900/80 to-neutral-950"
  },
  {
    id: "prod-4",
    title: "Vision Watch Active Pro",
    subtitle: "Sapphire glass. ECG heart tracking. Continuous dual GPS.",
    badge: "50% OFF FLASH SALE",
    price: "From ₹19,999",
    image: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&q=80&w=1200",
    colorClass: "from-indigo-950/40 via-neutral-900/80 to-neutral-950"
  }
];

interface HeroSliderProps {
  onProductClick: (id: string) => void;
}

export default function HeroSlider({ onProductClick }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    setCurrent(prev => (prev + 1) % SLIDES.length);
  };

  const handlePrev = () => {
    setCurrent(prev => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  return (
    <div className="relative w-full h-[400px] lg:h-[520px] overflow-hidden bg-neutral-950 rounded-2xl md:rounded-[28px] border border-neutral-800 shadow-xl select-none group">
      <AnimatePresence mode="wait">
        {SLIDES.map((slide, i) => i === current && (
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Background Image */}
            <img 
              src={slide.image} 
              alt={slide.title} 
              className="w-full h-full object-cover object-center scale-105 filter brightness-95"
            />
            
            {/* Visual Gradient Mask */}
            <div className={`absolute inset-0 bg-gradient-to-tr ${slide.colorClass}`} />

            {/* Content overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 lg:p-16 max-w-3xl text-white">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-1.5 self-start px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-sm"
              >
                {slide.id === "prod-4" ? <Flame size={12} className="text-orange-400" /> : <Sparkles size={12} />}
                <span>{slide.badge}</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-3"
              >
                {slide.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm md:text-lg text-neutral-300 font-medium leading-relaxed max-w-xl mb-6"
              >
                {slide.subtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-4"
              >
                <button
                  onClick={() => onProductClick(slide.id)}
                  className="px-6 py-3.5 bg-white hover:bg-neutral-100 text-neutral-900 font-extrabold rounded-2xl text-xs md:text-sm tracking-wide transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  <ShoppingBag size={16} />
                  <span>Shop Now</span>
                  <span className="opacity-60 text-[10px] pl-1 font-mono">{slide.price}</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Manual Slide Controls */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-neutral-900/50 backdrop-blur-md text-white border border-neutral-800/40 hover:bg-neutral-900 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-neutral-900/50 backdrop-blur-md text-white border border-neutral-800/40 hover:bg-neutral-900 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg"
      >
        <ChevronRight size={20} />
      </button>

      {/* Progress Dots */}
      <div className="absolute bottom-4 right-4 md:right-12 flex gap-1.5 z-20">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${idx === current ? "w-6 bg-brand-500" : "w-2 bg-neutral-600 hover:bg-neutral-400"}`}
          />
        ))}
      </div>
    </div>
  );
}
