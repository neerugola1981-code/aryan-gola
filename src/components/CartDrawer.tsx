import React, { useState } from "react";
import { X, Trash2, Ticket, ShoppingBag, ArrowRight, CornerDownRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CartItem } from "../types";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQty: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: (subtotal: number, discount: number, shipping: number, code: string) => void;
}

export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQty, onRemoveItem, onCheckout }: CartDrawerProps) {
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCode, setAppliedCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal > 150 || subtotal === 0 ? 0 : 15;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsValidating(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, cartTotal: subtotal })
      });
      const data = await res.json();
      if (res.ok) {
        setDiscountAmount(data.discountAmount);
        setAppliedCode(data.code);
        setCouponSuccess(`Coupon applied! Saved ₹${data.discountAmount}.`);
        setCouponCode("");
      } else {
        setCouponError(data.error || "Invalid coupon.");
      }
    } catch (err) {
      setCouponError("Communication error applying coupon.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setDiscountAmount(0);
    setAppliedCode("");
    setCouponSuccess("");
  };

  const handleProceedToCheckout = () => {
    onCheckout(subtotal, discountAmount, shippingFee, appliedCode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm"
      />

      {/* Drawer Body */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.35 }}
        className="relative w-full max-w-md h-full bg-white shadow-2xl border-l border-neutral-150 flex flex-col z-10 text-neutral-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-brand-500" />
            <h3 className="text-lg font-black tracking-tight">Your Shopping Cart</h3>
            <span className="bg-brand-100 text-brand-700 font-extrabold text-xs px-2 py-0.5 rounded-full font-mono">
              {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-400 hover:text-neutral-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-4 bg-neutral-50 border border-neutral-100 text-neutral-300 rounded-full">
                <ShoppingBag size={48} />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-800">Your cart is empty</p>
                <p className="text-xs text-neutral-450 mt-1">Explore our latest Vision products and start adding tech.</p>
              </div>
            </div>
          ) : (
            cartItems.map((item) => (
              <div 
                key={item.id}
                className="p-3 bg-neutral-50 rounded-2xl border border-neutral-150 flex gap-3 hover:border-neutral-200 transition-colors"
              >
                <div className="w-16 h-16 rounded-xl bg-white overflow-hidden shrink-0 border border-neutral-100">
                  <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-800 truncate">{item.product.name}</h4>
                    
                    {/* Selected variants badges */}
                    <div className="flex gap-1.5 mt-0.5 flex-wrap">
                      {item.selectedColor && (
                        <span className="text-[9px] bg-white border border-neutral-200 px-1.5 py-0.2 rounded-md font-medium text-neutral-500">
                          {item.selectedColor}
                        </span>
                      )}
                      {item.selectedSize && (
                        <span className="text-[9px] bg-white border border-neutral-200 px-1.5 py-0.2 rounded-md font-bold text-neutral-500">
                          {item.selectedSize}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-bold text-neutral-950 font-mono">
                      ₹{item.product.price}
                    </span>

                    {/* Quantity Selector */}
                    <div className="flex items-center border border-neutral-200 bg-white rounded-lg overflow-hidden h-7 shrink-0">
                      <button 
                        onClick={() => onUpdateQty(item.id, Math.max(1, item.quantity - 1))}
                        className="px-2 h-full hover:bg-neutral-50 font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold text-neutral-800">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                        className="px-2 h-full hover:bg-neutral-50 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1 hover:bg-red-50 text-neutral-300 hover:text-red-500 rounded-lg self-start transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Panel: Calculations & Checkout */}
        {cartItems.length > 0 && (
          <div className="border-t border-neutral-150 p-6 bg-neutral-50/50 shrink-0 space-y-4">
            
            {/* Coupon input form */}
            {!appliedCode ? (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Ticket size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Apply Coupon (WELCOME20)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-brand-500 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isValidating}
                  className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isValidating ? "Applying..." : "Apply"}
                </button>
              </form>
            ) : (
              <div className="p-2.5 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-brand-700">
                  <Ticket size={14} />
                  <span>Coupon {appliedCode} active!</span>
                </div>
                <button 
                  onClick={handleRemoveCoupon}
                  className="text-[10px] text-red-500 font-extrabold hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            {couponError && <p className="text-[10px] font-bold text-red-500">{couponError}</p>}
            {couponSuccess && <p className="text-[10px] font-bold text-emerald-600">{couponSuccess}</p>}

            {/* Price Calculations breakdown */}
            <div className="space-y-2 border-b border-neutral-100 pb-3 text-xs">
              <div className="flex justify-between font-medium text-neutral-600">
                <span>Cart Subtotal</span>
                <span className="font-mono">₹{subtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between font-bold text-brand-600">
                  <span>Promo Discount</span>
                  <span className="font-mono">-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-neutral-600">
                <span>Shipping Fee</span>
                <span className="font-mono">
                  {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-1">
              <span className="text-sm font-extrabold text-neutral-950">Grand Total</span>
              <span className="text-xl font-black text-neutral-950 font-mono">₹{finalTotal}</span>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full h-12 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Secure Checkout</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
