import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, Heart, User as UserIcon, Settings, Search, Mic, 
  Sparkles, Bell, LayoutGrid, Tablet, Laptop, RefreshCw, Star, 
  Send, Mail, Lock, Smartphone, ShieldCheck, LogOut, Check, ArrowRight, X, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, CartItem, Order, User, UserAddress } from "./types";

// Components
import SimulatorFrame from "./components/SimulatorFrame";
import HeroSlider from "./components/HeroSlider";
import ProductCard from "./components/ProductCard";
import ProductDetailModal from "./components/ProductDetailModal";
import CartDrawer from "./components/CartDrawer";
import CheckoutFlow from "./components/CheckoutFlow";
import OrderTracker from "./components/OrderTracker";
import AdminPanel from "./components/AdminPanel";
import CartPage from "./components/CartPage";
import VoiceSearch from "./components/VoiceSearch";
import LiveChat from "./components/LiveChat";

export default function App() {
  // Application Modes
  const [appMode, setAppMode] = useState<'web' | 'split' | 'emulator'>('web');
  const [isSplash, setIsSplash] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Master Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // UI Panels / Modals
  const [activeTab, setActiveTab] = useState<'home' | 'wishlist' | 'orders' | 'profile' | 'admin' | 'cart'>('home');
  const [checkoutData, setCheckoutData] = useState<{ subtotal: number; discount: number; shippingFee: number; couponCode: string } | null>(null);
  const [trackerOrder, setTrackerOrder] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState<number>(1500);
  const [sortBy, setSortBy] = useState("featured");

  // Auth States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'otp' | 'reset'>('login');
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Recommendations
  const [aiRecs, setAiRecs] = useState<Product[]>([]);
  const [aiExplanation, setAiExplanation] = useState("");

  // Subscriptions & Testimonials
  const [subEmail, setSubEmail] = useState("");
  const [subSuccess, setSubSuccess] = useState(false);

  // Flash Sale Timer
  const [countdown, setCountdown] = useState("04:59:59");

  // Load Initial Settings
  useEffect(() => {
    // 1. Splash delay
    const splashTimer = setTimeout(() => {
      setIsSplash(false);
    }, 1800);

    // 2. Load lists
    fetchProducts();

    // 3. Rehydrate Cart
    const storedCart = localStorage.getItem("vision_cart");
    if (storedCart) {
      try { setCart(JSON.parse(storedCart)); } catch (e) { console.error(e); }
    }

    // 4. Timer updater
    const timer = setInterval(() => {
      const now = new Date();
      const hours = String(23 - now.getHours()).padStart(2, '0');
      const minutes = String(59 - now.getMinutes()).padStart(2, '0');
      const seconds = String(59 - now.getSeconds()).padStart(2, '0');
      setCountdown(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => {
      clearTimeout(splashTimer);
      clearInterval(timer);
    };
  }, []);

  // Save Cart to Local Storage on Change
  useEffect(() => {
    localStorage.setItem("vision_cart", JSON.stringify(cart));
    // Trigger AI recommendations on cart change
    fetchAIRecommendations();
  }, [cart]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products?category=${selectedCategory}&search=${searchQuery}&maxPrice=${priceRange}&sort=${sortBy}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data);
      }
    } catch (e) {
      console.error("Failed to load products list:", e);
    }
  };

  const fetchAIRecommendations = async () => {
    try {
      const res = await fetch("/api/products/ai-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItems: cart, searchKeyword: searchQuery })
      });
      const data = await res.json();
      if (res.ok) {
        setAiRecs(data.recommended);
        setAiExplanation(data.explanation);
      }
    } catch (e) {
      console.error("AI recommendations failed:", e);
    }
  };

  // Trigger search on filter changes
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery, priceRange, sortBy]);

  // Handle Voice Search Results
  const handleVoiceSearchResult = (data: any) => {
    setSelectedCategory(data.category);
    setSearchQuery(data.search);
    if (data.maxPrice) setPriceRange(data.maxPrice);
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1, color?: string, size?: string) => {
    const itemColor = color || product.variants?.colors?.[0] || "";
    const itemSize = size || product.variants?.sizes?.[0] || "";
    const itemId = `${product.id}-${itemColor}-${itemSize}`;

    setCart(prev => {
      const exists = prev.find(i => i.id === itemId);
      if (exists) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { id: itemId, product, quantity, selectedColor: itemColor, selectedSize: itemSize }];
    });
  };

  const handleUpdateQty = (id: string, qty: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const handleRemoveItem = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  // Wishlist operations
  const handleToggleWishlist = async (id: string) => {
    if (!user) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }

    const isWish = user.wishlist.includes(id);
    const updatedWishlist = isWish 
      ? user.wishlist.filter(item => item !== id) 
      : [...user.wishlist, id];

    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, wishlist: updatedWishlist })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Auth Logic
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");

    try {
      let endpoint = "/api/auth/login";
      let payload: any = { email: authEmail, password: authPassword };

      if (authMode === 'register') {
        endpoint = "/api/auth/register";
        payload = { name: authName, email: authEmail, password: authPassword, phone: authPhone };
      } else if (authMode === 'otp') {
        payload = { phone: authPhone, otp: authOtp };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        setIsAuthModalOpen(false);
        setAuthEmail("");
        setAuthPassword("");
        setAuthName("");
        setAuthPhone("");
        setAuthOtp("");
        setOtpSent(false);
        
        // Fetch user orders
        fetchUserOrders(data.user.id);
      } else {
        setAuthError(data.error || "Authentication failed.");
      }
    } catch (e) {
      setAuthError("Failed to reach server database.");
    }
  };

  const handleSendOTP = async () => {
    if (!authPhone) {
      setAuthError("Please input your mobile phone number first.");
      return;
    }
    setAuthError("");
    setAuthMessage("");
    try {
      const res = await fetch("/api/auth/otp-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: authPhone })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setAuthMessage(data.message);
      } else {
        setAuthError(data.error);
      }
    } catch (e) {
      setAuthError("OTP communication offline.");
    }
  };

  const handleResetPassword = async () => {
    if (!authEmail) {
      setAuthError("Please input your email address first.");
      return;
    }
    setAuthError("");
    setAuthMessage("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setAuthMessage(data.message);
      } else {
        setAuthError(data.error);
      }
    } catch (e) {
      setAuthError("Failed to submit request.");
    }
  };

  const handleGoogleMockLogin = () => {
    setUser({
      id: "user-google",
      name: "Google Customer",
      email: "google.user@gmail.com",
      phone: "+91 9988776655",
      role: "user",
      addresses: [],
      savedCards: [],
      wishlist: []
    });
    setIsAuthModalOpen(false);
  };

  const fetchUserOrders = async (userId: string) => {
    try {
      const res = await fetch(`/api/orders?userId=${userId}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setOrders([]);
    setActiveTab('home');
  };

  // Order success handler
  const handleOrderSuccess = (order: Order) => {
    setCart([]);
    setCheckoutData(null);
    setTrackerOrder(order);
    if (user) fetchUserOrders(user.id);
  };

  // Newsletter Submit
  const handleNewsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail) return;
    setSubSuccess(true);
    setSubEmail("");
    setTimeout(() => setSubSuccess(false), 4000);
  };

  return (
    <div className={`${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} min-h-screen transition-colors duration-300 font-sans relative pb-12`}>
      
      {/* Animated Splash Loading screen */}
      <AnimatePresence>
        {isSplash && (
          <motion.div
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950 flex flex-col items-center justify-center z-50 p-6 text-white"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4"
            >
              <div className="inline-flex p-4 bg-brand-500/10 border border-brand-500/30 rounded-3xl text-brand-400">
                <ShoppingBag size={48} className="animate-pulse" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight font-display">VISION</h1>
              <p className="text-xs font-mono tracking-widest text-neutral-500">PREMIUM HARDWARE ECOSYSTEM</p>
              
              <div className="flex gap-1 justify-center pt-4">
                <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Orchestrator Interface Header Options */}
      <div className="bg-neutral-900 text-white border-b border-neutral-800 text-xs px-4 py-3 shrink-0 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-display font-extrabold text-base tracking-wide text-brand-400">VISION</span>
          <span className="text-neutral-500 font-bold hidden md:inline">|</span>
          <p className="text-neutral-400 hidden md:inline font-medium">Standard Node.js Full-Stack Web App. APK Emulator ready.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout switches */}
          <button
            onClick={() => setAppMode('web')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              appMode === 'web' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-neutral-800 text-neutral-400'
            }`}
          >
            <Globe size={13} />
            <span className="hidden sm:inline">Web Storefront</span>
          </button>

          <button
            onClick={() => setAppMode('split')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              appMode === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-neutral-800 text-neutral-400'
            }`}
          >
            <LayoutGrid size={13} />
            <span className="hidden sm:inline">Web & APK Split</span>
          </button>

          <button
            onClick={() => setAppMode('emulator')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              appMode === 'emulator' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-neutral-800 text-neutral-400'
            }`}
          >
            <Smartphone size={13} />
            <span className="hidden sm:inline">Mobile APK View</span>
          </button>
        </div>
      </div>

      {/* WEB, SPLIT, OR STANDALONE EMULATOR CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className={`grid grid-cols-1 ${appMode !== 'emulator' ? 'lg:grid-cols-12' : 'max-w-md mx-auto'} gap-8`}>
          
          {/* LEFT: FULL-BLOWN PREMIUM DESKTOP STOREFRONT */}
          {appMode !== 'emulator' && (
            <div className={`${appMode === 'web' ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col gap-6`}>
              
              {/* DESKTOP HEADER NAVBAR */}
              <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-600 text-white font-black px-4 py-2 rounded-2xl tracking-tight text-lg font-display">
                    V
                  </div>
                  <div className="leading-snug">
                    <h1 className="text-lg font-extrabold tracking-tight text-slate-950">Vision Storefront</h1>
                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Premium electronics</span>
                  </div>
                </div>

                {/* Live filters searches */}
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search flagship series..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-100 border-none rounded-full pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                    />
                  </div>
                  <button 
                    onClick={() => setIsVoiceOpen(true)}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all shadow-sm flex items-center justify-center shrink-0"
                    title="Voice search assistant"
                  >
                    <Mic size={14} />
                  </button>
                </div>

                {/* Right utility elements */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => { setActiveTab('cart'); setTrackerOrder(null); setCheckoutData(null); }}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors relative animate-fade-in"
                  >
                    <ShoppingBag size={18} className="text-slate-700" />
                    {cart.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-indigo-600 text-white font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono">
                        {cart.reduce((sum, i) => sum + i.quantity, 0)}
                      </span>
                    )}
                  </button>

                  {user ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (user.role === 'admin') setActiveTab('admin');
                          else setActiveTab('profile');
                        }}
                        className="p-2 bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <UserIcon size={14} />
                        <span className="hidden sm:inline max-w-24 truncate">{user.name}</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Sign Out"
                      >
                        <LogOut size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-full text-xs transition-all shadow active:scale-95"
                    >
                      Login
                    </button>
                  )}
                </div>
              </div>

              {/* Flex Layout for Sidebar and Workspace contents */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                
                {/* HIGH DENSITY WORKSPACE SIDEBAR */}
                <aside className="w-full md:w-60 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col gap-6 shrink-0 sticky top-6">
                  {/* Category lists / marketplace filters */}
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Marketplace</h3>
                    <ul className="space-y-1 text-xs font-bold">
                      {["All", "Mobile", "Laptops", "Wearables", "Audio", "Accessories"].map(cat => (
                        <li 
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all ${
                            selectedCategory === cat 
                              ? "bg-indigo-50 text-indigo-700 font-extrabold" 
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${selectedCategory === cat ? "bg-indigo-600" : "bg-transparent"}`} />
                          {cat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Active tab links */}
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Workspace Tabs</h3>
                    <ul className="space-y-1 text-xs font-bold">
                      {[
                        { id: 'home', name: 'Main Catalog' },
                        { id: 'cart', name: `My Shopping Cart (${cart.reduce((sum, i) => sum + i.quantity, 0)})` },
                        { id: 'orders', name: 'My Orders' },
                        { id: 'profile', name: 'Profile & Admin' }
                      ].map(tab => {
                        const isProfileTab = tab.id === 'profile';
                        const isActive = isProfileTab 
                          ? (activeTab === 'profile' || activeTab === 'admin')
                          : activeTab === tab.id;
                        return (
                          <li 
                            key={tab.id}
                            onClick={() => {
                              setTrackerOrder(null);
                              setCheckoutData(null);
                              if (isProfileTab && user?.role === 'admin') {
                                setActiveTab('admin');
                              } else if (isProfileTab && !user) {
                                setAuthMode('login');
                                setIsAuthModalOpen(true);
                              } else {
                                setActiveTab(tab.id as any);
                              }
                            }}
                            className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all ${
                              isActive 
                                ? "bg-indigo-50 text-indigo-700 font-extrabold" 
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isActive ? "bg-indigo-600" : "bg-transparent"}`} />
                            {tab.name}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Analytics Stats widget */}
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Ecosystem Analytics</h3>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="text-sm font-black text-slate-800 font-mono">{products.length}</div>
                        <div className="text-[8px] text-slate-400 uppercase font-black tracking-wider">Models</div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="text-sm font-black text-emerald-600 font-mono">₹{orders.reduce((sum, o) => sum + o.total, 0) || '42k'}</div>
                        <div className="text-[8px] text-slate-400 uppercase font-black tracking-wider">Revenue</div>
                      </div>
                    </div>
                  </div>

                  {/* System Update info box */}
                  <div className="bg-slate-900 rounded-2xl p-4 text-white relative overflow-hidden mt-auto">
                    <div className="relative z-10">
                      <h4 className="text-[9px] font-black opacity-70 uppercase tracking-widest">PRO STATUS</h4>
                      <p className="text-xs font-bold mt-1">Vision APK v2.1 Ready</p>
                      <button 
                        onClick={() => {
                          alert("Virtual APK update downloaded! Installing onto emulator frame.");
                        }}
                        className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shadow"
                      >
                        Install Update
                      </button>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full" />
                  </div>
                </aside>

                {/* Main Content Workspace Pane */}
                <div className="flex-1 min-w-0 w-full space-y-6">

                  {/* ROUTER SWITCH FOR DIFFERENT DESKTOP TAB VIEWS */}
              {trackerOrder ? (
                <OrderTracker 
                  order={trackerOrder} 
                  onReturnOrder={() => {}}
                  onBackToShopping={() => setTrackerOrder(null)} 
                />
              ) : checkoutData ? (
                <CheckoutFlow
                  user={user}
                  cartItems={cart}
                  subtotal={checkoutData.subtotal}
                  discount={checkoutData.discount}
                  shippingFee={checkoutData.shippingFee}
                  couponCode={checkoutData.couponCode}
                  onOrderSuccess={handleOrderSuccess}
                  onCancel={() => setCheckoutData(null)}
                />
              ) : activeTab === 'cart' ? (
                <CartPage 
                  cartItems={cart}
                  onUpdateQty={handleUpdateQty}
                  onRemoveItem={handleRemoveItem}
                  onCheckout={(sub, disc, ship, code) => {
                    setCheckoutData({ subtotal: sub, discount: disc, shippingFee: ship, couponCode: code });
                  }}
                  onContinueShopping={() => setActiveTab('home')}
                />
              ) : activeTab === 'admin' && user?.role === 'admin' ? (
                <AdminPanel 
                  products={products}
                  onRefreshProducts={fetchProducts}
                />
              ) : activeTab === 'profile' && user ? (
                <div className="bg-white rounded-3xl border border-neutral-150 p-6 shadow-sm space-y-6">
                  <h3 className="text-lg font-black text-neutral-900">Your Account Dashboard</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-neutral-50 rounded-2xl border">
                      <h4 className="text-xs font-black uppercase text-neutral-400 mb-2">Profile details</h4>
                      <p className="font-bold text-neutral-800 text-sm">{user.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{user.email}</p>
                      <p className="text-xs text-neutral-500 mt-0.5 font-mono">{user.phone}</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-2xl border">
                      <h4 className="text-xs font-black uppercase text-neutral-400 mb-2">Saved Addresses</h4>
                      {user.addresses.length === 0 ? (
                        <p className="text-xs text-neutral-400 font-semibold">No addresses saved. Enter one during checkout!</p>
                      ) : (
                        user.addresses.map((addr, i) => (
                          <p key={i} className="text-xs text-neutral-600 leading-relaxed font-semibold">
                            {addr.street}, {addr.city}, {addr.state} - {addr.zipCode}
                          </p>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-neutral-100">
                    <h4 className="text-xs font-black uppercase text-neutral-400 mb-3">Order histories</h4>
                    {orders.length === 0 ? (
                      <p className="text-xs text-neutral-400 font-semibold">You have not placed any orders yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {orders.map(order => (
                          <div key={order.id} className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-150 flex justify-between items-center text-xs font-semibold">
                            <div>
                              <p className="font-bold text-neutral-800 font-mono">Order #{order.id}</p>
                              <p className="text-[10px] text-neutral-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className="font-mono font-bold text-neutral-900">₹{order.total}</span>
                            <button
                              onClick={() => setTrackerOrder(order)}
                              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[10px] font-bold"
                            >
                              Track Order
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* HERO HEADER CAROUSEL */}
                  <HeroSlider onProductClick={(id) => {
                    const prod = products.find(p => p.id === id);
                    if (prod) setSelectedProduct(prod);
                  }} />

                  {/* FLASH SALE COUNTDOWN PANEL */}
                  <div className="p-5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-purple-500/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-2xl text-yellow-300">
                        <Star size={24} className="fill-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight uppercase">Vision Flash Discounts</h3>
                        <p className="text-xs text-purple-100 mt-0.5">Limited inventory units on top wearables and audiophile pods.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-2xl font-mono text-sm font-bold shrink-0">
                      <span className="text-[10px] uppercase font-black text-purple-200 block tracking-wide">Ends in:</span>
                      <span className="text-yellow-300 tracking-wider text-base">{countdown}</span>
                    </div>
                  </div>

                  {/* CATEGORIES BUTTON STRIP */}
                  <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
                    {["All", "Mobile", "Laptops", "Wearables", "Audio", "Accessories"].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2.5 rounded-xl transition-all shrink-0 border ${
                          selectedCategory === cat 
                            ? "bg-brand-500 border-brand-500 text-white font-extrabold shadow-sm" 
                            : "bg-white border-neutral-150 text-neutral-600 hover:border-neutral-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* PRODUCTS GRID catalog */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-neutral-400 uppercase tracking-widest">Active Hardware Catalog</h3>
                      <div className="flex items-center gap-2 text-xs">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="bg-white border border-neutral-200 rounded-xl px-2 py-1.5 font-bold"
                        >
                          <option value="featured">Featured Picks</option>
                          <option value="price-low">Price: Low to High</option>
                          <option value="price-high">Price: High to Low</option>
                          <option value="rating">Top Rated</option>
                        </select>
                      </div>
                    </div>

                    {products.length === 0 ? (
                      <div className="py-16 text-center bg-white border border-neutral-150 rounded-3xl">
                        <p className="text-sm font-bold text-neutral-500">No matching hardware models found.</p>
                        <button 
                          onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                          className="mt-2 text-xs text-brand-600 font-extrabold hover:underline"
                        >
                          Clear active search filters
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {products.map(p => (
                          <ProductCard 
                            key={p.id}
                            product={p}
                            isWishlisted={user ? user.wishlist.includes(p.id) : false}
                            onViewDetails={(id) => setSelectedProduct(p)}
                            onAddToCart={(prod, e) => { e.stopPropagation(); handleAddToCart(prod); }}
                            onToggleWishlist={(id, e) => { e.stopPropagation(); handleToggleWishlist(id); }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI PRODUCT RECOMMENDATIONS SECTION */}
                  {aiRecs.length > 0 && (
                    <div className="bg-brand-50/50 border border-brand-100 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-brand-500/10 text-brand-500 rounded-xl">
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-neutral-900 uppercase tracking-wider">VisionAI Personalized Recs</h4>
                          <p className="text-[10px] text-brand-600 font-bold leading-relaxed mt-0.5">{aiExplanation}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {aiRecs.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => setSelectedProduct(p)}
                            className="bg-white p-2.5 rounded-2xl border border-neutral-150 cursor-pointer hover:border-brand-200 transition-all flex flex-col justify-between"
                          >
                            <div className="aspect-square rounded-xl overflow-hidden bg-neutral-50 mb-2">
                              <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                            </div>
                            <h5 className="text-[11px] font-bold text-neutral-800 line-clamp-1">{p.name}</h5>
                            <span className="text-xs font-black text-neutral-900 font-mono mt-1">₹{p.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CUSTOMER TESTIMONIALS SECTION */}
                  <div className="bg-white rounded-3xl border border-neutral-150 p-6 shadow-sm space-y-4">
                    <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest block text-center">Customer Testimonials</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: "Devansh Mehta", role: "UI Designer", quote: "The Vision Pro Max phone feels so solid in the hand. The aerospace grade titanium frame is gorgeous and it is unbelievably responsive." },
                        { name: "Sanya Roy", role: "Software Developer", quote: "My Vision UltraBook handles full Docker environments and compilation tasks without ever spinning up the fans. Best workstation." }
                      ].map((t, idx) => (
                        <div key={idx} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-xs">
                          <p className="text-neutral-600 italic font-medium leading-relaxed">"{t.quote}"</p>
                          <div className="flex items-center gap-1 mt-3">
                            <span className="font-bold text-neutral-800">{t.name}</span>
                            <span className="text-neutral-400 font-medium">|</span>
                            <span className="text-neutral-400 font-semibold">{t.role}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* NEWSLETTER SUBSCRIPTION MODULE */}
                  <div className="bg-neutral-900 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
                    <div className="space-y-1">
                      <h4 className="text-base font-black tracking-tight uppercase">Secure future updates</h4>
                      <p className="text-xs text-neutral-400">Subscribe for early releases, flash sale drop schedules, and technical developer logs.</p>
                    </div>

                    {!subSuccess ? (
                      <form onSubmit={handleNewsSubmit} className="flex gap-2 w-full md:w-fit shrink-0">
                        <input 
                          type="email" 
                          required
                          placeholder="Your email address"
                          value={subEmail}
                          onChange={(e) => setSubEmail(e.target.value)}
                          className="bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-brand-500 w-full sm:w-60 font-semibold"
                        />
                        <button 
                          type="submit"
                          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-1 shrink-0"
                        >
                          <Send size={12} />
                          <span>Subscribe</span>
                        </button>
                      </form>
                    ) : (
                      <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20 text-xs font-semibold flex items-center gap-1.5">
                        <Check size={14} />
                        <span>System registered. Welcome to Vision Ecosystem!</span>
                      </div>
                    )}
                  </div>

                </div>
              )}
                </div>
              </div>
            </div>
          )}
                  {/* RIGHT COLUMN / MOBILE PHONE EMULATOR FOR APK SIMULATION */}
          {appMode !== 'web' && (
            <div className={`${appMode === 'split' ? 'lg:col-span-4' : 'col-span-1'} w-full`}>
              <SimulatorFrame 
                activeMobileTab={activeTab}
                setActiveMobileTab={setActiveTab}
                cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
              >
                {/* This renders the exact shop layout of mobile phones */}
                <div className="p-4 space-y-4">
                  {/* Mobile Header */}
                  <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-neutral-100 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-black text-white rounded-lg flex items-center justify-center font-bold font-display text-sm">V</div>
                      <span className="text-xs font-extrabold tracking-tight">Vision Mobile</span>
                    </div>
                    
                    <button 
                      onClick={() => setIsCartOpen(true)}
                      className="p-1.5 hover:bg-neutral-50 rounded-xl relative"
                    >
                      <ShoppingBag size={16} />
                      {cart.length > 0 && (
                        <span className="absolute top-0 right-0 bg-brand-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                          {cart.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Simulated Carousel Mini */}
                  <div className="aspect-[2/1] bg-neutral-900 rounded-2xl overflow-hidden relative text-white p-3 flex flex-col justify-end">
                    <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400" alt="" className="absolute inset-0 w-full h-full object-cover filter brightness-50" />
                    <span className="text-[8px] font-bold bg-brand-500 px-1.5 py-0.2 rounded-full inline-block mb-1 self-start">NEW PHONE</span>
                    <h4 className="text-xs font-bold leading-none">Vision Pro Max</h4>
                    <p className="text-[9px] text-neutral-300 mt-0.5">Titanium power inside your hands.</p>
                  </div>

                  {/* Mobile Products layout */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Mobile Hot-Picks</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {products.slice(0, 4).map(p => (
                        <div 
                          key={p.id}
                          onClick={() => setSelectedProduct(p)}
                          className="bg-white p-2 rounded-xl border border-neutral-150 cursor-pointer flex flex-col justify-between"
                        >
                          <div className="aspect-square rounded-lg bg-neutral-50 overflow-hidden mb-1">
                            <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                          </div>
                          <h6 className="text-[10px] font-bold text-neutral-800 line-clamp-1">{p.name}</h6>
                          <div className="flex justify-between items-baseline mt-1">
                            <span className="text-[11px] font-mono font-bold text-neutral-950">₹{p.price}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                              className="p-1 bg-brand-500 text-white rounded"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Quick suggestion widget */}
                  <div className="p-3 bg-brand-50/50 border border-brand-100 rounded-2xl text-[10px]">
                    <p className="font-bold text-brand-700">✓ Native Android Support (APK Ready)</p>
                    <p className="text-neutral-500 mt-0.5">Tap "Install APK" at the top panel of your virtual emulator frame to install sideloaded packages!</p>
                  </div>

                </div>
              </SimulatorFrame>
            </div>
          )}

        </div>
      </div>

      {/* HIGH DENSITY SYSTEM STATUS FOOTER */}
      <footer className="border-t border-slate-200 bg-white mt-16 py-4 px-6 flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-400 uppercase font-extrabold tracking-widest select-none gap-2">
        <div>SYSTEM STATUS: ALL NODES OPERATIONAL</div>
        <div className="text-center text-slate-400 font-semibold lowercase normal-case tracking-normal">
          © 2026 Vision eCommerce Systems. All rights reserved.
        </div>
        <div className="flex gap-4 font-mono">
          <span>API LATENCY: 14MS</span>
          <span>SECURE_ENCRYPTION: AES-256</span>
          <span>STABLE RELEASE v2.1</span>
        </div>
      </footer>

      {/* POPUP SUB-MODALS */}
      
      {/* Voice Search Mic Modal */}
      <VoiceSearch 
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onVoiceResult={handleVoiceSearchResult}
      />

      {/* Cart Slider sidebar */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onCheckout={(sub, disc, ship, code) => {
          setCheckoutData({ subtotal: sub, discount: disc, shippingFee: ship, couponCode: code });
        }}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(prod, qty, col, sz) => handleAddToCart(prod, qty, col, sz)}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={selectedProduct ? (user ? user.wishlist.includes(selectedProduct.id) : false) : false}
      />

      {/* Live AI assistant floating chat button */}
      <LiveChat />

      {/* Unified Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative border text-neutral-800"
            >
              <button 
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-all"
              >
                <X size={16} />
              </button>

              <div className="text-center mb-6">
                <h3 className="text-lg font-black text-neutral-900 tracking-tight uppercase">
                  {authMode === 'login' ? 'Welcome Back' : authMode === 'register' ? 'Register Account' : authMode === 'otp' ? 'Mobile OTP Sideload' : 'Reset Credentials'}
                </h3>
                <p className="text-[10px] text-neutral-400 mt-1 uppercase font-bold tracking-wider">Vision Secure Gateways</p>
              </div>

              {authError && (
                <p className="p-2 bg-red-50 text-red-600 rounded-xl text-center text-[10px] font-bold mb-4">{authError}</p>
              )}
              {authMessage && (
                <p className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-center text-[10px] font-bold mb-4 leading-relaxed">{authMessage}</p>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs font-semibold">
                {authMode === 'register' && (
                  <input 
                    type="text" 
                    required
                    placeholder="Full Name"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 focus:outline-none"
                  />
                )}

                {authMode !== 'otp' ? (
                  <input 
                    type="email" 
                    required
                    placeholder="Email Address"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 focus:outline-none"
                  />
                ) : (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      required
                      placeholder="Mobile Phone Number"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      className="px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-[10px] font-bold"
                    >
                      {otpSent ? 'Resend' : 'Send'}
                    </button>
                  </div>
                )}

                {authMode === 'otp' && (
                  <input 
                    type="text" 
                    required
                    placeholder="6-digit OTP code (Check phone notification)"
                    value={authOtp}
                    onChange={(e) => setAuthOtp(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 focus:outline-none font-mono"
                  />
                )}

                {authMode !== 'otp' && authMode !== 'reset' && (
                  <input 
                    type="password" 
                    required
                    placeholder="Account Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 focus:outline-none"
                  />
                )}

                {authMode === 'login' && (
                  <div className="flex justify-between text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    <button type="button" onClick={() => setAuthMode('otp')} className="hover:text-brand-600">Mobile OTP Login</button>
                    <button type="button" onClick={() => setAuthMode('reset')} className="hover:text-brand-600">Forgot Password?</button>
                  </div>
                )}

                {authMode === 'reset' ? (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold rounded-xl transition-all"
                  >
                    Reset Credentials
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-xl transition-all shadow"
                  >
                    {authMode === 'login' ? 'Sign In' : 'Register Secure Account'}
                  </button>
                )}
              </form>

              {/* Social Login simulator */}
              {authMode === 'login' && (
                <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2">
                  <span className="text-[9px] font-bold text-neutral-400 block text-center uppercase tracking-wider">Or continue with</span>
                  <button
                    onClick={handleGoogleMockLogin}
                    className="w-full py-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-neutral-700"
                  >
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Google Authenticator</span>
                  </button>
                </div>
              )}

              <div className="mt-6 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                {authMode === 'login' ? (
                  <p>Don't have an account? <button onClick={() => setAuthMode('register')} className="text-brand-600 hover:underline">Register Now</button></p>
                ) : (
                  <p>Already registered? <button onClick={() => setAuthMode('login')} className="text-brand-600 hover:underline">Log In</button></p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
