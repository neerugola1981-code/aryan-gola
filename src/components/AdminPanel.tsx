import React, { useState, useEffect } from "react";
import { 
  BarChart3, Plus, Trash2, Ticket, Package, Users, ShoppingCart, 
  Settings, CheckCircle2, AlertCircle, Edit, IndianRupee, RefreshCw 
} from "lucide-react";
import { motion } from "motion/react";
import { Product, Order, Coupon, AdminStats } from "../types";

interface AdminPanelProps {
  products: Product[];
  onRefreshProducts: () => void;
}

export default function AdminPanel({ products, onRefreshProducts }: AdminPanelProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'orders' | 'coupons'>('analytics');

  // Add Product form states
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodOrigPrice, setProdOrigPrice] = useState("");
  const [prodCategory, setProdCategory] = useState("Mobile");
  const [prodStock, setProdStock] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [prodColors, setProdColors] = useState("");
  const [prodSuccess, setProdSuccess] = useState("");

  // Add Coupon form states
  const [coupCode, setCoupCode] = useState("");
  const [coupType, setCoupType] = useState<'percentage' | 'flat'>('percentage');
  const [coupVal, setCoupVal] = useState("");
  const [coupMin, setCoupMin] = useState("");
  const [coupDesc, setCoupDesc] = useState("");
  const [coupSuccess, setCoupSuccess] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminData();
  }, [products]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch("/api/admin/stats");
      const statsData = await statsRes.json();
      if (statsRes.ok) setStats(statsData);

      // Fetch coupons
      const coupRes = await fetch("/api/coupons");
      const coupData = await coupRes.json();
      if (coupRes.ok) setCoupons(coupData);

      // Fetch all orders
      const orderRes = await fetch("/api/orders?userId=user-1"); // mock fetch all
      const orderData = await orderRes.json();
      if (orderRes.ok) setOrders(orderData);

    } catch (e) {
      setError("Failed to fetch admin parameters.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setProdSuccess("");

    if (!prodName || !prodPrice || !prodCategory || !prodStock) {
      setError("Please complete all product specification fields.");
      return;
    }

    const payload = {
      name: prodName,
      price: Number(prodPrice),
      originalPrice: Number(prodOrigPrice || prodPrice),
      category: prodCategory,
      stock: Number(prodStock),
      description: prodDesc,
      images: prodImage ? [prodImage] : [],
      variants: {
        colors: prodColors ? prodColors.split(",").map(c => c.trim()) : ["Default"]
      }
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setProdSuccess("Product registered in the catalog successfully!");
        setProdName("");
        setProdPrice("");
        setProdOrigPrice("");
        setProdStock("");
        setProdDesc("");
        setProdImage("");
        setProdColors("");
        onRefreshProducts();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to add product.");
      }
    } catch (err) {
      setError("Connection error adding product.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this product from catalog?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        onRefreshProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCoupSuccess("");

    if (!coupCode || !coupVal) {
      setError("Code and values are required.");
      return;
    }

    const payload = {
      code: coupCode.toUpperCase(),
      discountType: coupType,
      discountValue: Number(coupVal),
      minPurchase: Number(coupMin || 0),
      description: coupDesc
    };

    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setCoupSuccess("Coupon discount active!");
        setCoupCode("");
        setCoupVal("");
        setCoupMin("");
        setCoupDesc("");
        fetchAdminData();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to build coupon.");
      }
    } catch (err) {
      setError("Server communications failed.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string, stepIdx: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, currentStepIndex: stepIdx })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 text-neutral-850">
      
      {/* Admin Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-150">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Vision Management Console</h2>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">SuperAdmin Terminal Mode</p>
        </div>
        <button
          onClick={fetchAdminData}
          className="p-2 hover:bg-neutral-100 rounded-xl transition-all hover:rotate-45"
          title="Refresh parameters"
        >
          <RefreshCw size={18} className="text-neutral-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-neutral-100 pb-2 text-xs font-bold overflow-x-auto">
        {[
          { id: 'analytics', name: 'Performance Reports', icon: BarChart3 },
          { id: 'products', name: 'Inventory & Catalog', icon: Package },
          { id: 'orders', name: 'Fulfillment & Logistics', icon: ShoppingCart },
          { id: 'coupons', name: 'Promotion Engines', icon: Ticket }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === tab.id 
                ? "bg-brand-500 text-white font-extrabold shadow-sm" 
                : "text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            <tab.icon size={14} />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-1.5 text-xs mb-6">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Analytics Panel */}
      {activeTab === "analytics" && stats && (
        <div className="space-y-6">
          {/* Performance stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-neutral-150 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Total Sales</span>
                <p className="text-xl font-black text-neutral-950 font-mono mt-0.5">₹{stats.totalSales}</p>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <IndianRupee size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-150 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Total Orders</span>
                <p className="text-xl font-black text-neutral-950 font-mono mt-0.5">{stats.totalOrders}</p>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <ShoppingCart size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-150 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">In Stock Models</span>
                <p className="text-xl font-black text-neutral-950 font-mono mt-0.5">{stats.totalProducts}</p>
              </div>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Package size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-150 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Registered Accounts</span>
                <p className="text-xl font-black text-neutral-950 font-mono mt-0.5">{stats.totalUsers}</p>
              </div>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Users size={20} />
              </div>
            </div>
          </div>

          {/* Styled SVG Chart Area */}
          <div className="bg-white rounded-3xl border border-neutral-150 p-6 shadow-sm">
            <h4 className="text-xs font-black uppercase text-neutral-400 tracking-wider mb-4">Historical Revenue Curves</h4>
            
            <div className="relative h-64 border-b border-l border-neutral-200 mt-6 flex items-end justify-between px-6 pt-4">
              {/* Draw static analytical indicator bars */}
              {stats.salesHistory.map((day, idx) => {
                const max = Math.max(...stats.salesHistory.map(h => h.sales));
                const pct = max ? (day.sales / max) * 100 : 0;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group">
                    <div className="w-12 bg-brand-500/10 hover:bg-brand-500 rounded-t-lg transition-all relative flex flex-col justify-end" style={{ height: `${Math.max(10, pct * 1.5)}px` }}>
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold bg-neutral-900 text-white px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        ₹{day.sales}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-bold mt-2 rotate-12 md:rotate-0">{day.date}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Product Catalog Management */}
      {activeTab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add product specifications form */}
          <div className="bg-white rounded-3xl border border-neutral-150 p-6 shadow-sm h-fit">
            <h4 className="text-sm font-black text-neutral-800 mb-4 flex items-center gap-2">
              <Plus size={16} className="text-brand-500" />
              <span>Provision Hardware Model</span>
            </h4>

            <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Product Name</label>
                <input 
                  type="text" 
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Vision Tab Ultra"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-semibold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Sell Price (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="799"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-mono focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Original Price (₹)</label>
                  <input 
                    type="number" 
                    value={prodOrigPrice}
                    onChange={(e) => setProdOrigPrice(e.target.value)}
                    placeholder="899"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Category</label>
                  <select 
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-bold"
                  >
                    <option value="Mobile">Mobile</option>
                    <option value="Laptops">Laptops</option>
                    <option value="Audio">Audio</option>
                    <option value="Wearables">Wearables</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Stock Levels</label>
                  <input 
                    type="number" 
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="20"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Description</label>
                <textarea 
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Enter dynamic model specifications..."
                  rows={3}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Image URL (Unsplash)</label>
                <input 
                  type="text" 
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Color Variants (comma split)</label>
                <input 
                  type="text" 
                  value={prodColors}
                  onChange={(e) => setProdColors(e.target.value)}
                  placeholder="Midnight Silver, Obsidian, Sunset"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              {prodSuccess && (
                <p className="text-emerald-600 font-bold p-2 bg-emerald-50 rounded-lg text-center">{prodSuccess}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-xl transition-all"
              >
                Provision Product Model
              </button>
            </form>
          </div>

          {/* Current product inventory grid */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-neutral-150 p-6 shadow-sm overflow-hidden flex flex-col">
            <h4 className="text-sm font-black text-neutral-800 mb-4 uppercase">Existing Hardware Catalog</h4>
            
            <div className="divide-y divide-neutral-100 overflow-y-auto max-h-[500px]">
              {products.map(p => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-4 text-xs font-medium">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-50 shrink-0 border">
                      <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-bold text-neutral-800 truncate">{p.name}</h5>
                      <span className="text-[9px] bg-neutral-100 px-1.5 py-0.5 rounded-md text-neutral-500 uppercase">{p.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 text-right">
                    <div>
                      <span className="text-neutral-400 block text-[9px] uppercase font-bold">Price</span>
                      <span className="font-mono font-bold text-neutral-800">₹{p.price}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[9px] uppercase font-bold">Stock</span>
                      <span className="font-mono font-bold text-neutral-800">{p.stock} units</span>
                    </div>

                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded-lg transition-colors"
                      title="De-register item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Orders & Logistics Management */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-3xl border border-neutral-150 p-6 shadow-sm">
          <h4 className="text-sm font-black text-neutral-800 mb-4">Logistics Transit & Fulfillment</h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wide font-bold">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4 text-right">Fulfillment Steps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-neutral-50/50">
                    <td className="py-3 px-4 font-bold text-neutral-800 font-mono">#{order.id}</td>
                    <td className="py-3 px-4 font-semibold text-neutral-600">
                      {order.shippingAddress.fullName} ({order.shippingAddress.city})
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-neutral-900">₹{order.total}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        order.status === "delivered" ? "bg-emerald-50 text-emerald-700" :
                        order.status === "shipped" ? "bg-blue-50 text-blue-700" :
                        order.status === "returned" ? "bg-red-50 text-red-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right flex gap-1 justify-end">
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, "processing", 1)}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-[10px] font-bold"
                      >
                        Pack
                      </button>
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, "shipped", 2)}
                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-bold"
                      >
                        Ship
                      </button>
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, "delivered", 3)}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold"
                      >
                        Deliver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coupons/Promotions Admin Panel */}
      {activeTab === "coupons" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="bg-white rounded-3xl border border-neutral-150 p-6 shadow-sm h-fit">
            <h4 className="text-sm font-black text-neutral-800 mb-4 flex items-center gap-2">
              <Ticket size={16} className="text-brand-500" />
              <span>Create Coupon Code</span>
            </h4>

            <form onSubmit={handleAddCoupon} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Coupon Code</label>
                <input 
                  type="text" 
                  required
                  value={coupCode}
                  onChange={(e) => setCoupCode(e.target.value)}
                  placeholder="e.g. VISIONSPRING"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-bold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Discount Type</label>
                  <select 
                    value={coupType}
                    onChange={(e) => setCoupType(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-bold"
                  >
                    <option value="percentage">Percent (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Discount Value</label>
                  <input 
                    type="number" 
                    required
                    value={coupVal}
                    onChange={(e) => setCoupVal(e.target.value)}
                    placeholder="20"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Minimum Purchase Limit (₹)</label>
                <input 
                  type="number" 
                  value={coupMin}
                  onChange={(e) => setCoupMin(e.target.value)}
                  placeholder="50"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Description</label>
                <input 
                  type="text" 
                  value={coupDesc}
                  onChange={(e) => setCoupDesc(e.target.value)}
                  placeholder="Get 20% off on premium earbuds!"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              {coupSuccess && (
                <p className="text-emerald-600 font-bold p-2 bg-emerald-50 rounded-lg text-center">{coupSuccess}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-xl transition-all shadow"
              >
                Launch Coupon Engine
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border border-neutral-150 p-6 shadow-sm overflow-hidden flex flex-col">
            <h4 className="text-sm font-black text-neutral-800 mb-4 uppercase">Active Promotion Systems</h4>

            <div className="divide-y divide-neutral-100">
              {coupons.map((coupon, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs font-semibold">
                  <div>
                    <span className="font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-lg mr-2 font-mono">{coupon.code}</span>
                    <span className="text-neutral-500">{coupon.description}</span>
                  </div>
                  <span className="text-neutral-400 font-medium">Min purchase: <span className="font-mono text-neutral-800 font-bold">₹{coupon.minPurchase}</span></span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
