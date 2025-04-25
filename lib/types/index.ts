// واجهات البيانات الخاصة بالـ Products، Orders، Categories، Discounts

export interface Product {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price: number;
  oldPrice?: number;
  category?: Category | string;
  categoryId?: string;
  stock?: number;
  images?: string[];
  features?: string[];
  material?: string;
  care?: string;
  sizes?: string[];
  colors?: { name: string; value: string }[] | string[];
  isNewProduct?: boolean;
  discountId?: string | null;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  // Adding properties used in UI components
  rating?: number;       // Product rating (0-5)
  reviews?: number;      // Number of reviews
  discount?: number | { percentage: number; }; // Legacy support for discount data
  image?: string;        // Legacy support for single image
}

export interface OrderProductItem {
  _id?: string;
  product: string | Product | null; // always required, backend uses ObjectId
  productName: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface Order {
  _id?: string;
  id?: string;
  customerName: string;
  customerPhone: string;
  wilaya: string;
  baladia: string; // required
  products: OrderProductItem[];
  totalAmount: number;
  shippingCost: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  paymentMethod?: any; // Add this to match existing interface
  __v?: number;
}

export interface Category {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  parentId?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface Discount {
  _id?: string;
  id?: string;
  code: string;
  percentage: number;
  expiresAt: string;
  name?: string;
  validFrom?: string;
  validTo?: string;
  type?: 'sale' | 'seasonal' | 'special' | 'coupon';
  applicableProducts?: string[];
  applicableCategories?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

// Export Mongoose model interfaces for reference
export interface ICategory {
  _id?: string;
  name: string;
  description?: string;
}

export interface IDiscount {
  _id?: string;
  code: string;
  percentage: number;
  expiresAt: Date;
}

export interface IOrderProduct {
  product: string;
  productName: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface IOrder {
  _id?: string;
  customerName: string;
  customerPhone: string;
  wilaya: string;
  baladia: string;
  products: IOrderProduct[];
  totalAmount: number;
  shippingCost: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IProduct {
  _id?: string;
  name: string;
  description?: string;
  price: number;
  oldPrice?: number;
  category?: string;
  categoryId?: string;
  stock?: number;
  images?: string[];
  features?: string[];
  material?: string;
  care?: string;
  sizes?: string[];
  colors?: { name: string; value: string }[];
  isNewProduct?: boolean;
  discountId?: string | null;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
}
