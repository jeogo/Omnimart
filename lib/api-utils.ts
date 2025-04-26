import axios from 'axios';
import type { Product, Category, Discount, Order } from "@/lib/types/index";

// Set the API base URL to localhost:5000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://omnimart-api-m15a.onrender.com';

// Create axios instance with common configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
});

// Add request interceptor for logging and handling
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging and handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const errorMessage = error.response?.data?.message || error.message;
    console.error(`API Error: ${errorMessage}`);
    return Promise.reject(error);
  }
);

/**
 * Fetch all products with optional filters
 */
export async function fetchProducts(options: any = {}): Promise<Product[]> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (options.categoryId) params.append('categoryId', options.categoryId);
    if (options.isNew) params.append('isNew', 'true');
    if (options.hasDiscount) params.append('hasDiscount', 'true');
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.includeDiscounts) params.append('includeDiscounts', 'true');
    if (options.includeCategories) params.append('includeCategories', 'true');
    
    const response = await api.get(`/api/products?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching products:", error.message);
    return [];
  }
}

/**
 * Fetch a single product by ID
 */
export async function fetchProductById(id: string, options: any = {}): Promise<Product | null> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (options.includeDiscount) params.append('includeDiscount', 'true');
    if (options.includeCategory) params.append('includeCategory', 'true');
    
    const response = await api.get(`/api/products/${id}?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error(`Error fetching product ${id}:`, error.message);
    return null;
  }
}

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await api.get("/api/categories");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching categories:", error.message);
    return [];
  }
}

/**
 * Fetch all discounts
 */
export async function fetchDiscounts(): Promise<Discount[]> {
  try {
    const response = await api.get("/api/discounts");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching discounts:", error.message);
    return [];
  }
}

/**
 * Create a new order
 */
export async function createOrder(orderData: any): Promise<Order> {
  try {
    // Ensure required fields exist
    if (!orderData.customerName || !orderData.customerPhone || !orderData.wilaya || !orderData.baladia) {
      throw new Error('Missing required customer information');
    }
    
    if (!orderData.products || !Array.isArray(orderData.products) || orderData.products.length === 0) {
      throw new Error('Order must contain at least one product');
    }
    
    // Format products array according to backend schema
    const formattedProducts = orderData.products.map((product: any) => ({
      product: product.productId, // Reference to Product object
      productName: product.productName,
      price: product.price,
      quantity: product.quantity,
      size: product.size || undefined,
      color: product.color || undefined
    }));
    
    // Create a modified order object to match backend schema exactly
    const formattedOrderData = {
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      wilaya: orderData.wilaya,
      baladia: orderData.baladia,
      products: formattedProducts,
      totalAmount: orderData.totalAmount,
      shippingCost: orderData.shippingCost || 0,
      notes: orderData.notes || "",
      status: orderData.status || "pending"
    };
    
    const response = await api.post(`/api/orders`, formattedOrderData);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error('Order creation failed:', errorMessage);
    throw new Error(`Failed to create order: ${errorMessage}`);
  }
}

/**
 * Fetch all orders - Admin only
 */
export async function fetchOrders(): Promise<Order[]> {
  try {
    const response = await api.get(`/api/orders`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching orders:", error.message);
    return [];
  }
}

/**
 * Fetch a single order by ID
 */
export async function fetchOrderById(id: string): Promise<Order | null> {
  try {
    const response = await api.get(`/api/orders/${id}`);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error(`Error fetching order ${id}:`, error.message);
    return null;
  }
}

/**
 * Helper functions for product calculations
 */

// Check if a product has a valid discount
export function hasValidDiscount(product: Product): boolean {
  return !!product.discountId || 
         (product.discount !== undefined && 
          ((typeof product.discount === 'number' && product.discount > 0) || 
           (typeof product.discount === 'object' && product.discount?.percentage > 0)));
}

// Get discount percentage from a product or discount object
export function getDiscountPercentage(product: Product): number {
  // If the product has a direct percentage value
  if (typeof product.discount === 'number') {
    return product.discount;
  } 
  // If the product has a discount object with percentage
  else if (typeof product.discount === 'object' && product.discount?.percentage) {
    return product.discount.percentage;
  }
  return 0;
}

// Get original price from a product
export function getOriginalPrice(product: Product): number {
  return product.oldPrice || product.price;
}

// Calculate discounted price
export function calculateDiscountedPrice(originalPrice: number, discountPercent: number): number {
  if (!discountPercent || !originalPrice) return originalPrice;
  return Math.round(originalPrice * (1 - (discountPercent / 100)));
}

/**
 * Format price with currency
 */
export function formatPrice(price: number): string {
  return `${price.toLocaleString()} د.ج`;
}
export function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}