// واجهات البيانات الخاصة بالـ Products، Orders، Categories، Discounts

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  categoryId: string;
  category?: string;
  images: string[];
  image?: string;
  features: string[];
  material: string;
  care: string;
  sizes: string[];
  colors?: { name: string; value: string }[];
  isNew?: boolean;
  discount?: number | {
    name: string;
    percentage: number;
    startDate: string;
    endDate: string;
    type: "sale" | "special" | "seasonal";
  };
  rating: number;
  reviews: number;
  createdAt: Date;
  updatedAt: Date;
  discountId?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  wilaya: string;
  products: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
  }>;
  totalAmount: number;
  shippingCost: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  image?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface Discount {
  _id: any;
  id: string;
  name: string;
  percentage: number;
  validFrom: Date;
  validTo: Date;
  type: "sale" | "special" | "seasonal";
  applicableProducts?: string[];
  applicableCategories?: string[];
  minPurchase?: number;
  code?: string;
  isActive?: boolean;
}

export interface Statistics {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  topSellingProducts: TopSellingProduct[];
  recentOrders: Order[];
  salesByDate: SalesByDate[];
}

export interface TopSellingProduct {
  productId: string;
  productName: string;
  unitsSold: number;
  totalRevenue: number;
}

export interface SalesByDate {
  date: string;
  amount: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: Date;
  lastLogin?: Date;
}

export interface StoreSettings {
  storeName: string;
  logo: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  shippingRates: ShippingRate[];
  workingHours: string;
}

export interface ShippingRate {
  region: string;
  cost: number;
  estimatedDays: string;
}
