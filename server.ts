import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API Client if Key is Present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log("Gemini AI API Client Initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini Client:", err);
  }
} else {
  console.log("No valid GEMINI_API_KEY found. Using smart local rule-based engine.");
}

// ==========================================
// SEEDED DATA & IN-MEMORY DATABASE
// ==========================================

const INITIAL_PRODUCTS = [
  {
    id: "prod-1",
    name: "Vision Pro Max 5G",
    price: 999,
    originalPrice: 1099,
    description: "The peak of mobile smartphone technology. Featuring a stunning 6.8-inch Dynamic 120Hz LTPO AMOLED display, the advanced octa-core CoreVision chipset, 12GB of high-speed RAM, and a revolutionary triple-lens 108MP camera array with 100x space zoom. Crafted with a premium lightweight titanium aerospace alloy frame.",
    images: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=600"
    ],
    category: "Mobile",
    subcategory: "Smartphones",
    rating: 4.8,
    ratingCount: 1420,
    variants: {
      colors: ["Titanium Gray", "Cosmic Obsidian", "Arctic Blue"],
      sizes: ["128GB", "256GB", "512GB"]
    },
    stock: 12,
    isFeatured: true,
    isTrending: true,
    isFlashSale: true,
    flashSaleEndsAt: new Date(Date.now() + 18000000).toISOString() // 5 hours from now
  },
  {
    id: "prod-2",
    name: "Vision UltraBook 14",
    price: 1299,
    originalPrice: 1499,
    description: "Engineered for creators, developers, and power users. Powered by the next-generation Intel Ultra 7 Processor, coupled with 16GB of unified RAM and a lightning-fast 1TB NVMe SSD. Immerse yourself in the gorgeous 14-inch Liquid Retina Display with a razor-thin bezel, 100% DCI-P3 wide color gamut, and 120Hz refresh rate. Backed by an all-day 18-hour battery life.",
    images: [
      "https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=600"
    ],
    category: "Laptops",
    subcategory: "Ultrabooks",
    rating: 4.9,
    ratingCount: 840,
    variants: {
      colors: ["Space Gray", "Liquid Platinum"],
      sizes: ["16GB RAM | 512GB", "16GB RAM | 1TB", "32GB RAM | 1TB"]
    },
    stock: 8,
    isFeatured: true,
    isTrending: false,
    isFlashSale: false
  },
  {
    id: "prod-3",
    name: "Vision Pods Active",
    price: 149,
    originalPrice: 199,
    description: "Elevate your audio experience with state-of-the-art hybrid Active Noise Cancellation (ANC) that filters out up to 45dB of external sound. Features customized dynamic drivers, pristine 3D Spatial Audio tracking, and dual beamforming voice microphones for crystal-clear calls. Includes a premium smart wireless charging case yielding up to 36 hours of playtime.",
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&q=80&w=600"
    ],
    category: "Audio",
    subcategory: "Earbuds",
    rating: 4.7,
    ratingCount: 2150,
    variants: {
      colors: ["Pure White", "Matte Black", "Cobalt Navy"]
    },
    stock: 35,
    isFeatured: false,
    isTrending: true,
    isFlashSale: true,
    flashSaleEndsAt: new Date(Date.now() + 18000000).toISOString()
  },
  {
    id: "prod-4",
    name: "Vision Watch Active Pro",
    price: 249,
    originalPrice: 299,
    description: "Your ultimate companion for health, fitness, and lifestyle tracking. Features a vibrant, high-contrast always-on Sapphire Glass Display. Packed with state-of-the-art medical-grade sensors tracking continuous Heart Rate, ECG, blood oxygen (SpO2), advanced sleep tracking, and automatic workout detection. Equipped with built-in multi-band dual-frequency GPS.",
    images: [
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&q=80&w=600"
    ],
    category: "Wearables",
    subcategory: "Smartwatches",
    rating: 4.6,
    ratingCount: 1050,
    variants: {
      colors: ["Midnight Obsidian", "Sunset Rose", "Glacier Silver"],
      sizes: ["40mm", "44mm"]
    },
    stock: 18,
    isFeatured: true,
    isTrending: true,
    isFlashSale: false
  },
  {
    id: "prod-5",
    name: "Vision Lens Smart Glasses",
    price: 399,
    originalPrice: 499,
    description: "Experience the future of augmented reality. Styled with a lightweight classical frame, these smart glasses include integrated bone-conduction stereo audio speakers, Bluetooth voice assistance, and a discrete 12MP front camera to capture high-definition hands-free photos and videos. Real-time translation HUD built into the optical lens.",
    images: [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=600"
    ],
    category: "Wearables",
    subcategory: "AR Glasses",
    rating: 4.5,
    ratingCount: 320,
    variants: {
      colors: ["Midnight Black", "Tortoise Shell"]
    },
    stock: 7,
    isFeatured: false,
    isTrending: true,
    isFlashSale: false
  },
  {
    id: "prod-6",
    name: "Vision GaN Fast Hub 100W",
    price: 49,
    originalPrice: 69,
    description: "Recharge all your professional devices concurrently. Featuring Gallium Nitride (GaN) technology for compact, ultra-efficient thermal performance. Boasts 3x USB-C Power Delivery 3.0 ports and 1x USB-A port. Offers multi-device intelligent power allocation up to 100W max output. Travel-friendly folding wall plug design.",
    images: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=600"
    ],
    category: "Accessories",
    subcategory: "Power Adapters",
    rating: 4.8,
    ratingCount: 410,
    variants: {
      colors: ["Carbon Black", "Chalk White"]
    },
    stock: 120,
    isFeatured: false,
    isTrending: false,
    isFlashSale: true,
    flashSaleEndsAt: new Date(Date.now() + 18000000).toISOString()
  },
  {
    id: "prod-7",
    name: "Vision Cinema Portable Projector",
    price: 599,
    originalPrice: 699,
    description: "Transform any blank wall into a magnificent 150-inch home theater. This sleek, capsule-sized portable projector features native 1080p projection with HDR10 decoding, ultra-bright 1200 ANSI Lumens, auto-focus, automatic horizontal/vertical keystone correction, and integrated Dolby surround speakers. Pre-loaded with premium streaming apps.",
    images: [
      "https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&q=80&w=600"
    ],
    category: "Accessories",
    subcategory: "Projectors",
    rating: 4.7,
    ratingCount: 190,
    variants: {
      colors: ["Meteorite Space Gray"]
    },
    stock: 5,
    isFeatured: true,
    isTrending: false,
    isFlashSale: false
  },
  {
    id: "prod-8",
    name: "Vision SoundBar Studio S",
    price: 299,
    originalPrice: 349,
    description: "An incredibly compact soundbar engineered with a custom 5-driver acoustic layout. Recreates fully immersive, rich cinematic multi-channel spatial audio through advanced Dolby Atmos digital decoding. Deep bass ports require no separate physical subwoofer. Connects instantly with Optical, HDMI eARC, or high-fidelity Bluetooth.",
    images: [
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=600"
    ],
    category: "Audio",
    subcategory: "Soundbars",
    rating: 4.8,
    ratingCount: 520,
    variants: {
      colors: ["Matte Black"]
    },
    stock: 15,
    isFeatured: false,
    isTrending: false,
    isFlashSale: false
  }
];

const INITIAL_COUPONS = [
  {
    code: "VISION100",
    discountType: "flat",
    discountValue: 100,
    minPurchase: 500,
    active: true,
    description: "Flat $100 off on purchases of $500 or more!"
  },
  {
    code: "WELCOME20",
    discountType: "percentage",
    discountValue: 20,
    minPurchase: 50,
    active: true,
    description: "Get 20% off on your entire cart! No minimums."
  },
  {
    code: "FLASH15",
    discountType: "percentage",
    discountValue: 15,
    minPurchase: 100,
    active: true,
    description: "Exclusive flash sale coupon code: 15% off!"
  }
];

let products = [...INITIAL_PRODUCTS];
let coupons = [...INITIAL_COUPONS];

let users = [
  {
    id: "user-1",
    name: "Aman Khan",
    email: "user@vision.com",
    password: "user123", // in production, hash passwords
    phone: "+91 9876543210",
    role: "user" as const,
    addresses: [
      {
        id: "addr-1",
        fullName: "Aman Khan",
        phone: "+91 9876543210",
        street: "74, Bandra West, Off Carter Road",
        city: "Mumbai",
        state: "Maharashtra",
        zipCode: "400050",
        isDefault: true
      }
    ],
    savedCards: [
      {
        id: "card-1",
        cardHolder: "Aman Khan",
        cardNumber: "**** **** **** 4321",
        expiry: "12/28",
        brand: "visa" as const
      }
    ],
    wishlist: ["prod-3", "prod-4"]
  },
  {
    id: "user-2",
    name: "Vision Admin",
    email: "admin@vision.com",
    password: "admin123",
    phone: "+1 (555) 019-2834",
    role: "admin" as const,
    addresses: [],
    savedCards: [],
    wishlist: []
  }
];

let orders: any[] = [
  {
    id: "order-1011",
    userId: "user-1",
    items: [
      {
        product: {
          id: "prod-3",
          name: "Vision Pods Active",
          price: 149,
          image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=100"
        },
        quantity: 1,
        selectedColor: "Pure White"
      }
    ],
    subtotal: 149,
    couponDiscount: 0,
    shippingFee: 0,
    total: 149,
    status: "delivered" as const,
    paymentMethod: "card" as const,
    paymentStatus: "paid" as const,
    shippingAddress: {
      fullName: "Aman Khan",
      phone: "+91 9876543210",
      street: "74, Bandra West, Off Carter Road",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400050"
    },
    trackingSteps: [
      { status: "Ordered", description: "Your order has been placed successfully.", timestamp: "2026-06-25 10:30 AM", completed: true },
      { status: "Processing", description: "Order has been processed and packed.", timestamp: "2026-06-25 02:45 PM", completed: true },
      { status: "Shipped", description: "Shipped via BlueDart express delivery.", timestamp: "2026-06-26 09:00 AM", completed: true },
      { status: "Delivered", description: "Order was handed to resident.", timestamp: "2026-06-27 04:15 PM", completed: true }
    ],
    createdAt: "2026-06-25T10:30:00.000Z"
  },
  {
    id: "order-1012",
    userId: "user-1",
    items: [
      {
        product: {
          id: "prod-1",
          name: "Vision Pro Max 5G",
          price: 999,
          image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=100"
        },
        quantity: 1,
        selectedColor: "Titanium Gray",
        selectedSize: "256GB"
      }
    ],
    subtotal: 999,
    couponDiscount: 100,
    shippingFee: 0,
    total: 899,
    status: "shipped" as const,
    paymentMethod: "upi" as const,
    paymentStatus: "paid" as const,
    shippingAddress: {
      fullName: "Aman Khan",
      phone: "+91 9876543210",
      street: "74, Bandra West, Off Carter Road",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400050"
    },
    trackingSteps: [
      { status: "Ordered", description: "Your order has been placed successfully.", timestamp: "2026-06-28 08:15 AM", completed: true },
      { status: "Processing", description: "Order is verified and quality check passed.", timestamp: "2026-06-28 03:20 PM", completed: true },
      { status: "Shipped", description: "Dispatched from Mumbai Logistics Hub. In transit.", timestamp: "2026-06-29 11:10 AM", completed: true },
      { status: "Out for Delivery", description: "Courier partner is out with your package.", timestamp: "Estimated Tomorrow", completed: false }
    ],
    createdAt: "2026-06-28T08:15:00.000Z"
  }
];

// ==========================================
// AUTHENTICATION APIs
// ==========================================

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }

  const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "User with this email already exists" });
  }

  const newUser = {
    id: "user-" + (users.length + 1),
    name,
    email,
    password,
    phone: phone || "",
    role: "user" as const,
    addresses: [],
    savedCards: [],
    wishlist: []
  };

  users.push(newUser);

  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser;
  res.json({ token: "vision-jwt-token-mock-" + newUser.id, user: userWithoutPassword });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password, otp, phone } = req.body;

  // Handle simulated OTP Login
  if (otp && phone) {
    if (otp === "123456" || otp === "432109") {
      let user = users.find(u => u.phone === phone);
      if (!user) {
        // Create user on OTP verified if not exist
        const newUser = {
          id: "user-" + (users.length + 1),
          name: phone,
          email: `${phone.replace(/\s+/g, '')}@vision.com`,
          password: "otp-login-pwd",
          phone,
          role: "user" as const,
          addresses: [],
          savedCards: [],
          wishlist: []
        };
        users.push(newUser);
        user = newUser;
      }
      const { password: _, ...userWithoutPassword } = user;
      return res.json({ token: "vision-jwt-token-mock-" + user.id, user: userWithoutPassword });
    } else {
      return res.status(400).json({ error: "Invalid OTP code. Try '123456'" });
    }
  }

  // Handle standard email/password login
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password. Demo credentials: user@vision.com / user123 or admin@vision.com / admin123" });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({ token: "vision-jwt-token-mock-" + user.id, user: userWithoutPassword });
});

app.post("/api/auth/otp-request", (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }
  // Simulate successful OTP dispatch
  res.json({ message: "OTP sent successfully! Enter code '123456' to proceed." });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!exists) {
    return res.status(404).json({ error: "Email not found" });
  }
  res.json({ message: "Password reset link has been dispatched to your email address." });
});

app.post("/api/auth/update-profile", (req, res) => {
  const { userId, name, phone, addresses, savedCards, wishlist } = req.body;
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  if (name) users[userIndex].name = name;
  if (phone) users[userIndex].phone = phone;
  if (addresses) users[userIndex].addresses = addresses;
  if (savedCards) users[userIndex].savedCards = savedCards;
  if (wishlist) users[userIndex].wishlist = wishlist;

  const { password: _, ...userWithoutPassword } = users[userIndex];
  res.json({ user: userWithoutPassword });
});

// ==========================================
// PRODUCT SEARCH, FILTER & LIST APIs
// ==========================================

app.get("/api/products", (req, res) => {
  let filtered = [...products];
  const { category, search, minPrice, maxPrice, sort } = req.query;

  if (category && category !== "All") {
    filtered = filtered.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(q))
    );
  }

  if (minPrice) {
    filtered = filtered.filter(p => p.price >= Number(minPrice));
  }

  if (maxPrice) {
    filtered = filtered.filter(p => p.price <= Number(maxPrice));
  }

  if (sort) {
    if (sort === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    }
  }

  res.json(filtered);
});

app.get("/api/products/:id", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

// Admin product controls
app.post("/api/products", (req, res) => {
  const { name, price, originalPrice, description, images, category, subcategory, stock, variants, isFeatured, isTrending, isFlashSale } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ error: "Name, price and category are required" });
  }

  const newProduct = {
    id: "prod-" + (products.length + 1),
    name,
    price: Number(price),
    originalPrice: Number(originalPrice || price),
    description: description || "",
    images: images && images.length > 0 ? images : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600"],
    category,
    subcategory: subcategory || "",
    rating: 4.5,
    ratingCount: 1,
    stock: Number(stock || 10),
    variants: variants || { colors: ["Default"] },
    isFeatured: !!isFeatured,
    isTrending: !!isTrending,
    isFlashSale: !!isFlashSale,
    flashSaleEndsAt: isFlashSale ? new Date(Date.now() + 18000000).toISOString() : undefined
  };

  products.push(newProduct);
  res.json(newProduct);
});

app.put("/api/products/:id", (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const updated = {
    ...products[index],
    ...req.body,
    price: req.body.price ? Number(req.body.price) : products[index].price,
    originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : products[index].originalPrice,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : products[index].stock
  };

  products[index] = updated;
  res.json(updated);
});

app.delete("/api/products/:id", (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found" });
  }
  products.splice(index, 1);
  res.json({ success: true, message: "Product deleted successfully" });
});

// ==========================================
// AI RECOMMENDATIONS & AI SEARCH API
// ==========================================

app.post("/api/products/ai-recommendations", async (req, res) => {
  const { cartItems, searchKeyword, recentViews } = req.body;

  if (ai) {
    try {
      const prompt = `You are the AI product engine of "Vision" eCommerce.
Our catalog of products (JSON format): ${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price, description: p.description })))}.

Given:
- Cart items: ${JSON.stringify(cartItems || [])}
- Search keyword: "${searchKeyword || ""}"
- Recently viewed: ${JSON.stringify(recentViews || [])}

Pick 3-4 most relevant product IDs that we should recommend to this customer. Explain the logic briefly in a short sentence.
Format your response STRICTLY as a JSON object:
{
  "recommendedIds": ["id1", "id2", "id3"],
  "explanation": "Why these were chosen..."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const data = JSON.parse(responseText);
      
      const recommendedProducts = products.filter(p => data.recommendedIds?.includes(p.id));
      if (recommendedProducts.length > 0) {
        return res.json({
          recommended: recommendedProducts,
          explanation: data.explanation || "Selected based on your dynamic active shopping patterns."
        });
      }
    } catch (e) {
      console.error("Gemini Recommendations Error, running local fallback:", e);
    }
  }

  // Fallback smart rule-based recommendations
  let recommended = [...products];
  let explanation = "Personalized selections based on hot trending products.";

  if (cartItems && cartItems.length > 0) {
    const categoriesInCart = cartItems.map((item: any) => item.product.category);
    recommended = products.filter(p => categoriesInCart.includes(p.category) && !cartItems.some((item: any) => item.product.id === p.id));
    explanation = "Recommended accessories matching items currently in your cart.";
  } else if (searchKeyword) {
    const q = searchKeyword.toLowerCase();
    recommended = products.filter(p => p.category.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
    explanation = `Handpicked matches corresponding to your query: "${searchKeyword}"`;
  }

  if (recommended.length < 3) {
    // Fill up with featured products
    const featured = products.filter(p => p.isFeatured && !recommended.some(r => r.id === p.id));
    recommended = [...recommended, ...featured];
  }

  res.json({
    recommended: recommended.slice(0, 4),
    explanation
  });
});

// ==========================================
// VOICE SEARCH TRANSCRIPTION SIMULATOR
// ==========================================

app.post("/api/products/voice-search", async (req, res) => {
  const { voiceText } = req.body;
  if (!voiceText) {
    return res.status(400).json({ error: "Voice audio transcription text required" });
  }

  // Clean voice search command analysis using Gemini if key is active
  if (ai) {
    try {
      const prompt = `Analyze the shopping voice command: "${voiceText}".
Map it to filters for the following categories: Mobile, Laptops, Audio, Wearables, Accessories.
Determine if the user specified a category, a price limit (min or max price), or specific features.
Format the output strictly as a JSON:
{
  "category": "All" or match category,
  "search": "extracted keywords to search",
  "maxPrice": null or number,
  "explanation": "Summarized what the AI understood"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return res.json(JSON.parse(response.text || "{}"));
    } catch (e) {
      console.error("Gemini Voice analysis error, playing rule fallback:", e);
    }
  }

  // Fallback parsing rules
  const lowercase = voiceText.toLowerCase();
  let category = "All";
  let maxPrice: number | null = null;
  let search = voiceText;

  if (lowercase.includes("phone") || lowercase.includes("mobile")) {
    category = "Mobile";
    search = lowercase.replace("phone", "").replace("mobile", "").trim();
  } else if (lowercase.includes("laptop") || lowercase.includes("computer")) {
    category = "Laptops";
    search = lowercase.replace("laptop", "").replace("computer", "").trim();
  } else if (lowercase.includes("watch") || lowercase.includes("wearable")) {
    category = "Wearables";
    search = lowercase.replace("watch", "").replace("wearable", "").trim();
  } else if (lowercase.includes("earbuds") || lowercase.includes("audio") || lowercase.includes("pods")) {
    category = "Audio";
    search = lowercase.replace("earbuds", "").replace("audio", "").replace("pods", "").trim();
  }

  // Price extractor
  const priceMatch = lowercase.match(/(?:under|below|less than)\s*[$]?\s*(\d+)/);
  if (priceMatch && priceMatch[1]) {
    maxPrice = Number(priceMatch[1]);
  }

  res.json({
    category,
    search,
    maxPrice,
    explanation: `Heard: "${voiceText}". Filtering category: ${category}${maxPrice ? ` under $${maxPrice}` : ""}.`
  });
});

// ==========================================
// ORDER SYSTEM APIs
// ==========================================

app.get("/api/orders", (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  const userOrders = orders.filter(o => o.userId === userId);
  res.json(userOrders);
});

app.get("/api/orders/:id", (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(order);
});

app.post("/api/orders", (req, res) => {
  const { userId, items, subtotal, couponDiscount, shippingFee, total, paymentMethod, shippingAddress } = req.body;

  if (!userId || !items || items.length === 0 || !shippingAddress) {
    return res.status(400).json({ error: "Missing required order placement details" });
  }

  // Deduct stocks
  for (const item of items) {
    const productIndex = products.findIndex(p => p.id === item.product.id);
    if (productIndex !== -1) {
      products[productIndex].stock = Math.max(0, products[productIndex].stock - item.quantity);
    }
  }

  const orderId = "order-" + (1012 + orders.length);
  const newOrder = {
    id: orderId,
    userId,
    items,
    subtotal: Number(subtotal),
    couponDiscount: Number(couponDiscount || 0),
    shippingFee: Number(shippingFee || 0),
    total: Number(total),
    status: "pending" as const,
    paymentMethod,
    paymentStatus: paymentMethod === "cod" ? ("pending" as const) : ("paid" as const),
    shippingAddress,
    trackingSteps: [
      { status: "Ordered", description: "Your order has been placed successfully. Payment verified.", timestamp: new Date().toLocaleString(), completed: true },
      { status: "Processing", description: "Our fulfillment center is preparing your package.", timestamp: "Pending Hub dispatch", completed: false },
      { status: "Shipped", description: "Package will be handed to express logistics partner.", timestamp: "In queue", completed: false },
      { status: "Out for Delivery", description: "A delivery agent is en route to your address.", timestamp: "Pending shipment", completed: false }
    ],
    createdAt: new Date().toISOString()
  };

  orders.unshift(newOrder); // Add to beginning
  res.json(newOrder);
});

app.post("/api/orders/:id/return", (req, res) => {
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  orders[index].status = "returned";
  orders[index].paymentStatus = "refunded" as any;
  orders[index].trackingSteps.push({
    status: "Returned & Refunded",
    description: "Item return accepted. The refund has been initiated to your original payment channel.",
    timestamp: new Date().toLocaleString(),
    completed: true
  });

  res.json(orders[index]);
});

// Admin update order
app.put("/api/orders/:id", (req, res) => {
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const { status, paymentStatus, currentStepIndex } = req.body;
  if (status) orders[index].status = status;
  if (paymentStatus) orders[index].paymentStatus = paymentStatus;
  
  if (currentStepIndex !== undefined) {
    orders[index].trackingSteps = orders[index].trackingSteps.map((step, idx) => {
      if (idx <= currentStepIndex) {
        return { ...step, completed: true, timestamp: step.timestamp.includes("Pending") || step.timestamp.includes("In queue") ? new Date().toLocaleString() : step.timestamp };
      }
      return step;
    });
  }

  res.json(orders[index]);
});

// ==========================================
// COUPON VALIDATION API
// ==========================================

app.get("/api/coupons", (req, res) => {
  res.json(coupons);
});

app.post("/api/coupons", (req, res) => {
  const { code, discountType, discountValue, minPurchase, description } = req.body;
  if (!code || !discountType || !discountValue) {
    return res.status(400).json({ error: "Code, discount type, and value are required" });
  }
  const exists = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
  if (exists) {
    return res.status(400).json({ error: "Coupon already exists" });
  }

  const newCoupon = {
    code: code.toUpperCase(),
    discountType,
    discountValue: Number(discountValue),
    minPurchase: Number(minPurchase || 0),
    active: true,
    description: description || `Get ${discountValue}${discountType === 'percentage' ? '%' : '$'} off!`
  };
  coupons.push(newCoupon);
  res.json(newCoupon);
});

app.post("/api/coupons/validate", (req, res) => {
  const { code, cartTotal } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Coupon code required" });
  }

  const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.active);
  if (!coupon) {
    return res.status(400).json({ error: "Invalid or expired coupon code." });
  }

  if (cartTotal < coupon.minPurchase) {
    return res.status(400).json({ error: `This coupon requires a minimum purchase of $${coupon.minPurchase}.` });
  }

  let discount = 0;
  if (coupon.discountType === "flat") {
    discount = coupon.discountValue;
  } else {
    discount = Math.round((cartTotal * coupon.discountValue) / 100);
  }

  res.json({
    code: coupon.code,
    discountAmount: Math.min(discount, cartTotal),
    description: coupon.description
  });
});

// ==========================================
// ADMIN DASHBOARD ANALYTICS API
// ==========================================

app.get("/api/admin/stats", (req, res) => {
  const totalSales = orders
    .filter(o => o.paymentStatus === "paid" || o.status === "delivered")
    .reduce((sum, o) => sum + o.total, 0);

  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalUsers = users.length;

  // Generate simple sales analytics chart data over the last 5 days
  const salesHistory = [
    { date: "June 25", sales: 450, orders: 3 },
    { date: "June 26", sales: 620, orders: 4 },
    { date: "June 27", sales: 290, orders: 2 },
    { date: "June 28", sales: 899, orders: 1 },
    { date: "June 29", sales: totalSales, orders: totalOrders }
  ];

  // Category sales weight breakdown
  const categoryCount: Record<string, number> = {};
  products.forEach(p => {
    categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
  });

  const categoryDistribution = Object.keys(categoryCount).map(cat => ({
    category: cat,
    value: categoryCount[cat]
  }));

  res.json({
    totalSales,
    totalOrders,
    totalProducts,
    totalUsers,
    salesHistory,
    categoryDistribution
  });
});

// ==========================================
// SIMULATED CO-PILOT CUSTOMER SUPPORT CHAT (GEMINI CHATBOT)
// ==========================================

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body; // Array of { sender: 'user'|'bot', text: string }

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: "Message history required" });
  }

  const latestUserMessage = messages[messages.length - 1].text;

  // If Gemini client is running, invoke it
  if (ai) {
    try {
      const chatHistory = messages.slice(0, -1).map((m: any) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      const systemInstruction = `You are "VisionAI Support", a highly skilled, polite, and helpful Customer Support Representative and shopping assistant for "Vision" Premium Electronics & eCommerce store.
Our products catalog: ${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price, stock: p.stock })))}.
We have live coupons: VISION100 (flat $100 off on $500), WELCOME20 (20% off), FLASH15 (15% off).
We support UPI, Cards, Wallets, and Cash on Delivery (COD).
Provide accurate details about orders, products, refund policies (hassle-free 7 days returns), and guide users to buy. Keep answers elegant, warm, concise, and professional.`;

      const contents = [
        { role: "user" as const, parts: [{ text: systemInstruction }] },
        ...chatHistory,
        { role: "user" as const, parts: [{ text: latestUserMessage }] }
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents
      });

      return res.json({ text: response.text || "Hello! How can I assist you with Vision today?" });
    } catch (e) {
      console.error("Gemini Chat assistant failed, sliding to smart fallback:", e);
    }
  }

  // Smart Keyword rule-based fallback responses
  const cleanMessage = latestUserMessage.toLowerCase();
  let botResponse = "Thank you for reaching out to Vision Support. How can I help you find products, apply coupons, or track your packages today?";

  if (cleanMessage.includes("hello") || cleanMessage.includes("hi") || cleanMessage.includes("hey")) {
    botResponse = "Hello! Welcome to Vision Electronics. I am your VisionAI Shopping assistant. How can I delight you today?";
  } else if (cleanMessage.includes("coupon") || cleanMessage.includes("discount") || cleanMessage.includes("promo")) {
    botResponse = "We have wonderful active discount codes for you! Try 'WELCOME20' to get 20% off your entire cart, or 'VISION100' for a flat $100 off on purchases exceeding $500.";
  } else if (cleanMessage.includes("phone") || cleanMessage.includes("mobile") || cleanMessage.includes("pro max")) {
    botResponse = "The 'Vision Pro Max 5G' is our absolute flagship smartphone ($999). It boasts a lightweight Titanium alloy chassis, gorgeous 120Hz LTPO screen, and a 108MP space zoom camera. Would you like me to highlight its color options?";
  } else if (cleanMessage.includes("refund") || cleanMessage.includes("return") || cleanMessage.includes("cancel")) {
    botResponse = "Vision offers a stress-free 7-day return policy! If you aren't completely in love with your hardware, you can click 'Return Order' directly from your User Dashboard for a complete and immediate refund.";
  } else if (cleanMessage.includes("track") || cleanMessage.includes("delivery") || cleanMessage.includes("order")) {
    botResponse = "You can view live real-time shipping logs for any of your orders. Navigate to your User Dashboard and tap 'Track Order' to see current transit coordinates!";
  } else if (cleanMessage.includes("pay") || cleanMessage.includes("payment")) {
    botResponse = "We support diverse, ultra-secure checkout options including UPI (GPay/PhonePe QR simulation), Debit & Credit Cards, custom Digital Wallets, and Cash on Delivery (COD).";
  }

  res.json({ text: botResponse });
});

// ==========================================
// VITE DEV SERVER / PRODUCTION SERVING
// ==========================================

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static build file hosting activated.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vision Full-Stack Storefront is alive and listening on http://localhost:${PORT}`);
  });
}

start();
