import type { Product, Category, Discount, Order } from "@/lib/types/entities";

const API_BASE_URL = 'https://omnimart-api.onrender.com';

/**
 * Fetch all discounts
 */
export async function fetchDiscounts(): Promise<Discount[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/discounts`);
    if (!response.ok) {
      throw new Error(`Failed to fetch discounts: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching discounts:", error);
    return [];
  }
}

/**
 * Fetch a single discount by ID
 */
export async function fetchDiscountById(id: string): Promise<Discount | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/discounts/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch discount: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching discount ${id}:`, error);
    return null;
  }
}

/**
 * Fetch all products with optional category and discount info
 */
export async function fetchProducts(options: any = {}): Promise<Product[]> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (options.categoryId) queryParams.append('categoryId', options.categoryId);
    if (options.isNew) queryParams.append('isNew', 'true');
    if (options.hasDiscount) queryParams.append('hasDiscount', 'true');
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.includeDiscounts) queryParams.append('includeDiscounts', 'true');
    if (options.includeCategories) queryParams.append('includeCategories', 'true');
    
    const url = `${API_BASE_URL}/api/products?${queryParams.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

/**
 * Fetch a single product by ID
 */
export async function fetchProductById(id: string, options: any = {}): Promise<Product | null> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (options.includeDiscount) queryParams.append('includeDiscount', 'true');
    if (options.includeCategory) queryParams.append('includeCategory', 'true');
    
    const url = `${API_BASE_URL}/api/products/${id}?${queryParams.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch product: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
}

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`);
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * Fetch a single category by ID
 */
export async function fetchCategoryById(id: string): Promise<Category | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch category: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error);
    return null;
  }
}

/**
 * Fetch all orders
 */
export async function fetchOrders(): Promise<Order[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`);
    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

/**
 * Fetch a single order by ID
 */
export async function fetchOrderById(id: string): Promise<Order | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch order: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    return null;
  }
}

/**
 * Create a new order
 */
export async function createOrder(orderData: Order): Promise<Order> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create order: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}
