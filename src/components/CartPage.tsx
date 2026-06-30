import React, { useState } from "react";
import { Trash2, Ticket, ShoppingBag, ArrowRight, Minus, Plus, ShoppingCart, HelpCircle, ShieldCheck } from "lucide-react";
import { CartItem } from "../types";

interface CartPageProps {
  cartItems: CartItem[];
  onUpdateQty: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: (subtotal: number, discount: number, shipping: number, code: string) => void;
  onContinueShopping: () => void;
}

export default function CartPage({ 
  cartItems, 
  onUpdateQty, 
  onRemoveItem, 
  onCheckout,
  onContinueShopping 
}: CartPageProps) {
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCode, setAppliedCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal > 150000 || subtotal === 0 ? 0 : 1500; // Updated thresholds for Indian Rupees (₹1.5L free shipping, else ₹1,500)
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsValidating(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      // In rupees, let's send standard request
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
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 shadow-sm">
          <ShoppingCart size={28} />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Your shopping cart is empty</h3>
        <p className="text-slate-500 text-xs mt-2 max-w-sm leading-relaxed">
          Explore our next-generation premium hardware and flagship series to add innovative modules to your setup.
        </p>
        <button
          onClick={onContinueShopping}
          className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
        >
          Explore Catalog
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Shopping Cart Page</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-semibold">Review your custom premium items before secure checkout.</p>
          </div>
        </div>
        <span className="bg-indigo-100 text-indigo-700 font-extrabold text-xs px-3 py-1 rounded-full font-mono">
          {cartItems.reduce((sum, i) => sum + i.quantity, 0)} Items
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Cart Items List */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">Selected Hardware Modules</h3>
          
          <div className="divide-y divide-slate-100">
            {cartItems.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Product details */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 rounded-xl border border-slate-100 overflow-hidden bg-slate-50 shrink-0">
                    <img 
                      src={item.product.images[0]} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-900 tracking-tight hover:text-indigo-600 transition-colors cursor-pointer">
                      {item.product.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {item.product.category}
                      </span>
                      {item.selectedColor && (
                        <span className="flex items-center gap-1 bg-slate-50 border px-1.5 py-0.5 rounded">
                          Color: <span className="font-extrabold text-slate-700">{item.selectedColor}</span>
                        </span>
                      )}
                      {item.selectedSize && (
                        <span className="flex items-center gap-1 bg-slate-50 border px-1.5 py-0.5 rounded">
                          Size: <span className="font-extrabold text-slate-700">{item.selectedSize}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing and Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <div className="text-xs font-mono font-extrabold text-slate-900">
                      ₹{item.product.price}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">
                      Sub: ₹{item.product.price * item.quantity}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center bg-slate-100 rounded-xl p-1 shrink-0">
                    <button
                      onClick={() => onUpdateQty(item.id, Math.max(1, item.quantity - 1))}
                      className="p-1 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-slate-800"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-xs font-black font-mono text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                      className="p-1 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-slate-800"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl text-slate-400 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Keep shopping link */}
          <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
            <button
              onClick={onContinueShopping}
              className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors flex items-center gap-1"
            >
              ← Continue Shopping Modules
            </button>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Secure Cloud Processing Engaged
            </span>
          </div>
        </div>

        {/* Right Side: Order Checkout Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">Checkout Summary</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between font-bold text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-mono">₹{subtotal}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between font-bold text-emerald-600">
                  <span>Promo Deductions ({appliedCode})</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono">-₹{discountAmount}</span>
                    <button 
                      onClick={handleRemoveCoupon}
                      className="text-[10px] text-red-500 hover:underline font-bold"
                    >
                      (Remove)
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between font-bold text-slate-600">
                <span>Shipping Fees</span>
                <span className="font-mono">
                  {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
                </span>
              </div>
              
              {shippingFee > 0 && (
                <p className="text-[9px] text-indigo-500 font-bold leading-normal">
                  Add ₹{Math.max(0, 150000 - subtotal)} more for **FREE shipping**!
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-between items-baseline">
              <span className="text-sm font-black text-slate-800">Grand Total</span>
              <span className="text-xl font-black text-slate-900 font-mono">₹{finalTotal}</span>
            </div>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="border-t border-slate-100 pt-4 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Have a promo code?</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Ticket size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="E.g., WELCOME10"
                    disabled={!!appliedCode || isValidating}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!!appliedCode || isValidating || !couponCode.trim()}
                  className="px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-40 shrink-0"
                >
                  Apply
                </button>
              </div>

              {couponError && <p className="text-[10px] text-red-500 font-semibold">{couponError}</p>}
              {couponSuccess && <p className="text-[10px] text-emerald-600 font-semibold">{couponSuccess}</p>}
            </form>

            {/* Checkout buttons */}
            <button
              onClick={handleProceedToCheckout}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              Proceed to secure checkout
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Secure transaction box */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 flex items-start gap-3">
            <ShieldCheck size={20} className="text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">PCI-DSS Secure Sandbox Cores</h4>
              <p className="text-[9px] text-slate-500 leading-normal font-semibold">
                Your data is processed utilizing AES-256 secure encryption protocols. No actual cards or assets are stored in the development environment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
