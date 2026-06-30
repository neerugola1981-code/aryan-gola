import React, { useState } from "react";
import { X, Star, Heart, ShoppingBag, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, Review } from "../types";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, selectedColor?: string, selectedSize?: string) => void;
  onToggleWishlist: (id: string) => void;
  isWishlisted: boolean;
}

export default function ProductDetailModal({ product, isOpen, onClose, onAddToCart, onToggleWishlist, isWishlisted }: ProductDetailModalProps) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Dynamic review states
  const [reviews, setReviews] = useState<Review[]>([
    { id: "rev-1", userName: "Samir Patil", rating: 5, comment: "Absolutely incredible! The design, finish, and performance are top tier. Well worth every dollar.", date: "June 20, 2026" },
    { id: "rev-2", userName: "Elena Rostova", rating: 4, comment: "Very fast delivery. Product feels premium and sturdy. Display is gorgeous. Battery could be slightly better but charges fast.", date: "June 18, 2026" }
  ]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [reviewerName, setReviewerName] = useState("");

  React.useEffect(() => {
    if (product) {
      setSelectedImageIdx(0);
      setSelectedColor(product.variants?.colors?.[0] || "");
      setSelectedSize(product.variants?.sizes?.[0] || "");
      setQuantity(1);
      setAddedSuccess(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedColor, selectedSize);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
    }, 2500);
  };

  const handlePostReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !reviewerName.trim()) return;

    const newRev: Review = {
      id: "rev-" + Date.now(),
      userName: reviewerName,
      rating: newRating,
      comment: newComment,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };

    setReviews([newRev, ...reviews]);
    setNewComment("");
    setReviewerName("");
    setNewRating(5);
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 15 }}
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-neutral-150 relative text-neutral-800"
      >
        {/* Top Floating Controls */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Store</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleWishlist(product.id)}
              className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-500"
            >
              <Heart size={18} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-500"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Core Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
          {/* Left Column: Visual Showcase */}
          <div className="space-y-4">
            <div className="aspect-square bg-neutral-50 rounded-2xl overflow-hidden border border-neutral-100 relative">
              <img 
                src={product.images[selectedImageIdx]} 
                alt={product.name} 
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Alternates Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIdx(i)}
                    className={`w-16 h-16 rounded-xl border-2 overflow-hidden transition-all ${
                      selectedImageIdx === i ? "border-brand-500" : "border-neutral-200 opacity-60"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Product description */}
            <div className="pt-4 border-t border-neutral-100">
              <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider mb-2">Detailed Overview</h4>
              <p className="text-xs md:text-sm text-neutral-600 leading-relaxed font-normal">{product.description}</p>
            </div>
          </div>

          {/* Right Column: Customizer & Checkout Actions */}
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2.5 py-0.5 rounded-full inline-block mb-2">
                {product.category}
              </span>
              <h2 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight leading-tight">{product.name}</h2>
              
              <div className="flex items-center gap-2 mt-2">
                <div className="flex text-amber-400">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                </div>
                <span className="text-xs font-extrabold text-neutral-800">{product.rating} / 5.0</span>
                <span className="text-[10px] text-neutral-400">({product.ratingCount} Customer reviews)</span>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
              <span className="text-[10px] font-bold text-neutral-400 block mb-0.5">EXCLUSIVE PRICE</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-neutral-900 font-mono">₹{product.price}</span>
                {product.originalPrice > product.price && (
                  <span className="text-sm text-neutral-400 line-through font-mono">₹{product.originalPrice}</span>
                )}
              </div>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ In Stock & Ready to Ship (Est. Delivery 2 days)</p>
            </div>

            {/* Variants Picker */}
            {product.variants && (
              <div className="space-y-4">
                {/* Colors */}
                {product.variants.colors && product.variants.colors.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 tracking-wider block mb-2 uppercase">Select Color: {selectedColor}</span>
                    <div className="flex gap-2 flex-wrap">
                      {product.variants.colors.map(color => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                            selectedColor === color 
                              ? "border-brand-500 bg-brand-50 text-brand-700" 
                              : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes or Storages */}
                {product.variants.sizes && product.variants.sizes.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 tracking-wider block mb-2 uppercase">Select Variant: {selectedSize}</span>
                    <div className="flex gap-2 flex-wrap">
                      {product.variants.sizes.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                            selectedSize === size 
                              ? "border-brand-500 bg-brand-50 text-brand-700" 
                              : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector & Action Button */}
            <div className="pt-4 border-t border-neutral-100 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden shrink-0">
                  <button 
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="w-10 h-10 hover:bg-neutral-100 font-bold transition-colors"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="w-10 h-10 hover:bg-neutral-100 font-bold transition-colors"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 h-11 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={16} />
                  <span>{product.stock === 0 ? "Out of Stock" : "Add to Shopping Cart"}</span>
                </button>
              </div>

              {addedSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-1.5 justify-center">
                  <CheckCircle2 size={14} />
                  <span>Item successfully queued to your cart!</span>
                </div>
              )}
            </div>

            {/* Ratings and reviews section */}
            <div className="border-t border-neutral-100 pt-6">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Customer Reviews & Ratings</h4>
              
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {reviews.map(rev => (
                  <div key={rev.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-neutral-800">{rev.userName}</span>
                      <span className="text-[10px] text-neutral-400">{rev.date}</span>
                    </div>
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={10} className={i < rev.rating ? "fill-amber-400 text-amber-400" : "text-neutral-200"} />
                      ))}
                    </div>
                    <p className="text-neutral-600 leading-relaxed font-normal">{rev.comment}</p>
                  </div>
                ))}
              </div>

              {/* Submit Review Form */}
              <form onSubmit={handlePostReview} className="mt-4 bg-neutral-50/50 p-3 rounded-2xl border border-neutral-100 space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 tracking-wider block uppercase">Post a Review</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    placeholder="Your Name"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    required
                    className="bg-white border border-neutral-200 rounded-xl p-2 text-xs focus:outline-none focus:border-brand-500"
                  />
                  <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-xl px-2">
                    <span className="text-[10px] text-neutral-400 font-bold shrink-0">Rating:</span>
                    <select
                      value={newRating}
                      onChange={(e) => setNewRating(Number(e.target.value))}
                      className="bg-transparent text-xs w-full focus:outline-none font-bold text-amber-500"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ 5</option>
                      <option value="4">⭐⭐⭐⭐ 4</option>
                      <option value="3">⭐⭐⭐ 3</option>
                      <option value="2">⭐⭐ 2</option>
                      <option value="1">⭐ 1</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Share your thoughts about this product..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                    className="flex-1 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500"
                  />
                  <button 
                    type="submit"
                    className="p-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
