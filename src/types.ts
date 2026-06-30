export interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ProductVariant {
  colors?: string[]; // e.g., ["Titanium Gray", "Cosmic Black", "Arctic White"]
  sizes?: string[];  // e.g., ["S", "M", "L", "XL"] or ["128GB", "256GB", "512GB"]
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  description: string;
  images: string[];
  category: string;
  subcategory?: string;
  rating: number;
  ratingCount: number;
  variants?: ProductVariant;
  stock: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  isFlashSale?: boolean;
  flashSaleEndsAt?: string;
}

export interface UserAddress {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export interface SavedCard {
  id: string;
  cardHolder: string;
  cardNumber: string; // Obfuscated like **** **** **** 4321
  expiry: string;
  brand: 'visa' | 'mastercard' | 'rupay' | 'amex';
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  addresses: UserAddress[];
  savedCards: SavedCard[];
  wishlist: string[]; // Product IDs
}

export interface CartItem {
  id: string; // unique cart item id (product + variant choices)
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface TrackingStep {
  status: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

export interface Order {
  id: string;
  userId: string;
  items: {
    product: {
      id: string;
      name: string;
      price: number;
      image: string;
    };
    quantity: number;
    selectedColor?: string;
    selectedSize?: string;
  }[];
  subtotal: number;
  couponDiscount: number;
  shippingFee: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'returned' | 'refunded';
  paymentMethod: 'upi' | 'card' | 'wallet' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed';
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  trackingSteps: TrackingStep[];
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minPurchase: number;
  active: boolean;
  description: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface SalesStat {
  date: string;
  sales: number;
  orders: number;
}

export interface AdminStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  salesHistory: SalesStat[];
  categoryDistribution: { category: string; value: number }[];
}
