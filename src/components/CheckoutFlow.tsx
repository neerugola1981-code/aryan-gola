import React, { useState } from "react";
import { CreditCard, Truck, CheckCircle2, QrCode, AlertCircle, ShoppingBag, ArrowLeft, Shield } from "lucide-react";
import { motion } from "motion/react";
import { User, CartItem, Order } from "../types";

interface CheckoutFlowProps {
  user: User | null;
  cartItems: CartItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  couponCode: string;
  onOrderSuccess: (order: Order) => void;
  onCancel: () => void;
}

export default function CheckoutFlow({ user, cartItems, subtotal, discount, shippingFee, couponCode, onOrderSuccess, onCancel }: CheckoutFlowProps) {
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'wallet' | 'cod'>('card');
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState("");

  // Address form states
  const [fullName, setFullName] = useState(user?.addresses?.[0]?.fullName || "");
  const [phone, setPhone] = useState(user?.addresses?.[0]?.phone || "");
  const [street, setStreet] = useState(user?.addresses?.[0]?.street || "");
  const [city, setCity] = useState(user?.addresses?.[0]?.city || "");
  const [state, setState] = useState(user?.addresses?.[0]?.state || "");
  const [zipCode, setZipCode] = useState(user?.addresses?.[0]?.zipCode || "");

  // Card form states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  // UPI scan states
  const [upiScanned, setUpiScanned] = useState(false);

  const finalTotal = subtotal - discount + shippingFee;

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !street || !city || !state || !zipCode) {
      setError("Please complete all physical delivery coordinates.");
      return;
    }
    setError("");
    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === "card") {
      if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
        setError("Please complete all credit card authentication fields.");
        return;
      }
    }

    setIsPlacing(true);
    setError("");

    const orderPayload = {
      userId: user?.id || "guest",
      items: cartItems.map(item => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.images[0]
        },
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize
      })),
      subtotal,
      couponDiscount: discount,
      shippingFee,
      total: finalTotal,
      paymentMethod,
      shippingAddress: {
        fullName,
        phone,
        street,
        city,
        state,
        zipCode
      }
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      if (res.ok) {
        onOrderSuccess(data);
      } else {
        setError(data.error || "Failed to place your order.");
      }
    } catch (e) {
      setError("Server offline. Please check connection.");
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-neutral-850">
      {/* Checkout Navbar */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onCancel}
          className="p-1.5 hover:bg-neutral-150 rounded-xl transition-colors text-neutral-500"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-black text-neutral-900 tracking-tight">Checkout Pipeline</h2>
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Secure Payment Core</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Shipping / Payment Customization */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Multi-step indicator */}
          <div className="flex gap-4 border-b border-neutral-150 pb-4 text-xs font-bold">
            <span className={`pb-1 border-b-2 transition-all ${step === 'shipping' ? "border-brand-500 text-brand-600" : "border-transparent text-neutral-400"}`}>
              1. Delivery Coordinates
            </span>
            <span className={`pb-1 border-b-2 transition-all ${step === 'payment' ? "border-brand-500 text-brand-600" : "border-transparent text-neutral-400"}`}>
              2. Secured Payment
            </span>
          </div>

          {step === 'shipping' ? (
            <form onSubmit={handleShippingSubmit} className="space-y-4">
              <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                <Truck size={16} className="text-brand-500" />
                <span>Shipping Address Coordinates</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Receiver Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aman Khan"
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Street Address</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. 74, Bandra West, Off Carter Road"
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Zip / Pin Code</label>
                  <input
                    type="text"
                    required
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="e.g. 400050"
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500 font-semibold"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-1.5 text-xs">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow"
              >
                <span>Continue to Secure Payment</span>
                <CheckCircle2 size={14} />
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                <CreditCard size={16} className="text-brand-500" />
                <span>Select Payment Protocol</span>
              </h3>

              {/* Payment selector blocks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'card', name: 'Credit/Debit', desc: 'Secure Visa/MasterCard' },
                  { id: 'upi', name: 'UPI Gateway', desc: 'Scan PhonePe/GPay QR' },
                  { id: 'wallet', name: 'Wallet Pay', desc: 'Vision Points/Paytm' },
                  { id: 'cod', name: 'Cash on Delivery', desc: 'Pay on arrival (COD)' }
                ].map(pay => (
                  <button
                    key={pay.id}
                    onClick={() => {
                      setPaymentMethod(pay.id as any);
                      setError("");
                    }}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                      paymentMethod === pay.id 
                        ? "border-brand-500 bg-brand-50/50" 
                        : "border-neutral-150 hover:border-neutral-200 bg-white"
                    }`}
                  >
                    <span className="text-xs font-bold text-neutral-800 block">{pay.name}</span>
                    <span className="text-[9px] text-neutral-400 font-medium block mt-0.5 leading-tight">{pay.desc}</span>
                  </button>
                ))}
              </div>

              {/* Specific Payment Layout Container */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-150">
                {paymentMethod === "card" && (
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">Enter Card Details (Simulation)</span>
                    <div className="space-y-3">
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="Card Number (4000 1234 5678 9010)"
                        maxLength={19}
                        className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-500 font-mono"
                      />
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Card Holder Name"
                        className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-500 font-semibold"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="Expiry (MM/YY)"
                          maxLength={5}
                          className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-500 font-mono"
                        />
                        <input
                          type="password"
                          required
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="CVV (***)"
                          maxLength={3}
                          className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "upi" && (
                  <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Unified Payments Interface (UPI)</span>
                    
                    <div className="p-3 bg-white rounded-2xl border border-neutral-200 shadow-sm relative">
                      <QrCode size={120} className="text-neutral-900" />
                      {upiScanned && (
                        <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-2 rounded-2xl text-emerald-600">
                          <CheckCircle2 size={32} />
                          <span className="text-[10px] font-bold mt-1">UPI Approved!</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-neutral-700">Scan this QR Code using BHIM, GPay, PhonePe or Paytm</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Pay exactly <span className="font-mono font-bold text-neutral-700">₹{finalTotal}</span> to settle invoice.</p>
                    </div>

                    {!upiScanned && (
                      <button
                        onClick={() => setUpiScanned(true)}
                        className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-[10px] font-extrabold transition-all active:scale-95 shadow"
                      >
                        Simulate Payment Approval
                      </button>
                    )}
                  </div>
                )}

                {paymentMethod === "wallet" && (
                  <div className="py-4 space-y-2">
                    <p className="text-xs text-neutral-600 font-medium leading-relaxed">
                      Pay using your pre-authorized Vision digital wallet. Your points balance will be automatically debited.
                    </p>
                    <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl text-brand-700 text-xs font-bold flex justify-between">
                      <span>Available points:</span>
                      <span className="font-mono">8,450 pts (₹84.50 equivalent)</span>
                    </div>
                  </div>
                )}

                {paymentMethod === "cod" && (
                  <div className="py-4 text-center space-y-2">
                    <CheckCircle2 size={32} className="text-emerald-500 mx-auto" />
                    <p className="text-xs text-neutral-700 font-bold">Cash on Delivery selected.</p>
                    <p className="text-[10px] text-neutral-400 leading-relaxed max-w-sm mx-auto">
                      Please prepare exactly <span className="font-mono text-neutral-700 font-bold">₹{finalTotal}</span> in cash when our BlueDart courier agent delivers your hardware.
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-1.5 text-xs">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-neutral-100 text-xs">
                <button
                  onClick={() => { setStep('shipping'); setError(""); }}
                  className="px-4 py-3 border border-neutral-200 rounded-xl font-bold hover:bg-neutral-50 transition-colors"
                >
                  Back
                </button>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacing || (paymentMethod === "upi" && !upiScanned)}
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isPlacing ? "Processing Transaction..." : `Place Order of ₹${finalTotal}`}
                  <Shield size={14} />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-neutral-150 p-4 shadow-sm">
            <h4 className="text-xs font-black uppercase text-neutral-400 tracking-wider mb-3">Order Summary</h4>

            <div className="space-y-3 max-h-48 overflow-y-auto pr-1 mb-4">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex gap-2.5 text-xs">
                  <div className="w-10 h-10 bg-neutral-50 border border-neutral-100 rounded-lg overflow-hidden shrink-0">
                    <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-neutral-800 truncate">{item.product.name}</h5>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Qty {item.quantity} {item.selectedColor ? `| ${item.selectedColor}` : ""}
                    </p>
                  </div>
                  <span className="font-mono text-neutral-700 shrink-0 font-medium">₹{item.product.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Calculations Panel */}
            <div className="border-t border-neutral-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between font-medium text-neutral-600">
                <span>Subtotal</span>
                <span className="font-mono">₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between font-bold text-brand-600">
                  <span>Coupon discount</span>
                  <span className="font-mono">-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-neutral-600">
                <span>Shipping Fee</span>
                <span className="font-mono">{shippingFee === 0 ? "FREE" : `₹${shippingFee}`}</span>
              </div>
              <div className="flex justify-between font-black text-neutral-900 border-t border-neutral-100 pt-2 text-sm">
                <span>Total invoice</span>
                <span className="font-mono">₹{finalTotal}</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 flex gap-3 text-xs text-brand-800">
            <Shield size={24} className="text-brand-500 shrink-0" />
            <div>
              <h5 className="font-bold">PCI-DSS Compliant Secure Checkout</h5>
              <p className="text-[10px] text-brand-600 leading-relaxed mt-0.5">
                All network packets are fortified with end-to-end 256-bit TLS encryption protocols to protect your transactions.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
