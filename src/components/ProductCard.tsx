import React from "react";
import { Star, Heart, ShoppingCart, Zap, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { Product } from "../types";

interface ProductCardProps {
  key?: string;
  product: Product;
  onViewDetails: (id: string) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onToggleWishlist: (id: string, e: React.MouseEvent) => void;
  isWishlisted: boolean;
}

export default function ProductCard({ product, onViewDetails, onAddToCart, onToggleWishlist, isWishlisted }: ProductCardProps) {
  const discount = product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      onClick={() => onViewDetails(product.id)}
      className="bg-white rounded-2xl border border-neutral-150 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full relative group"
    >
      {/* Absolute Badges */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none">
        {discount > 0 && (
          <span className="px-2.5 py-1 text-[10px] font-extrabold bg-red-500 text-white rounded-lg tracking-wide shadow-sm flex items-center gap-0.5">
            <Zap size={10} className="fill-white" />
            {discount}% OFF
          </span>
        )}
        {product.isFeatured && (
          <span className="px-2.5 py-1 text-[10px] font-extrabold bg-brand-500 text-white rounded-lg tracking-wide shadow-sm flex items-center gap-0.5">
            <Sparkles size={10} />
            FEATURED
          </span>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="px-2 py-0.5 text-[9px] font-extrabold bg-amber-500 text-white rounded-lg tracking-wide shadow-sm">
            ONLY {product.stock} LEFT
          </span>
        )}
        {product.stock === 0 && (
          <span className="px-2 py-0.5 text-[9px] font-extrabold bg-neutral-500 text-white rounded-lg tracking-wide shadow-sm">
            OUT OF STOCK
          </span>
        )}
      </div>

      {/* Wishlist Toggle Button */}
      <button
        onClick={(e) => onToggleWishlist(product.id, e)}
        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-xl bg-white/80 backdrop-blur-md text-neutral-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-md border border-neutral-200/40"
      >
        <Heart 
          size={16} 
          className={`${isWishlisted ? "fill-red-500 text-red-500" : "text-neutral-500"}`} 
        />
      </button>

      {/* Thumbnail Area */}
      <div className="aspect-square w-full relative bg-neutral-50 overflow-hidden shrink-0 border-b border-neutral-100">
        <img 
          src={product.images[0]} 
          alt={product.name} 
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Hover overlay mask */}
        <div className="absolute inset-0 bg-neutral-900/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Metadata Detail */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
            {product.category}
          </span>
          <h3 className="text-sm font-bold text-neutral-800 line-clamp-2 leading-snug group-hover:text-brand-600 transition-colors">
            {product.name}
          </h3>
          
          {/* Ratings display */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex text-amber-400">
              <Star size={12} className="fill-amber-400 text-amber-400" />
            </div>
            <span className="text-[11px] font-bold text-neutral-700">{product.rating}</span>
            <span className="text-[10px] text-neutral-400 font-medium">({product.ratingCount})</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-neutral-50">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-neutral-900 font-mono">
                ₹{product.price}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-neutral-400 line-through font-mono">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={(e) => onAddToCart(product, e)}
            disabled={product.stock === 0}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-95 ${
              product.stock === 0 
                ? "bg-neutral-100 text-neutral-450 cursor-not-allowed" 
                : "bg-brand-500 hover:bg-brand-600 text-white hover:shadow-md"
            }`}
          >
            <ShoppingCart size={15} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
