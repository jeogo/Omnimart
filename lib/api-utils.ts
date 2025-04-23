import type { Product, Category, Discount, Order } from "@/lib/types/entities";

// Use environment variable if available, otherwise default to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://omnimart-api.onrender.com';

// Cache for frequently accessed data
let productCache: Record<string, { data: Product; timestamp: number }> = {};
let categoriesCache: { data: Category[]; timestamp: number } | null = null;
let discountsCache: { data: Discount[]; timestamp: number } | null = null;

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000; 

/**
 * Fetch all discounts with caching
 */
export async function fetchDiscounts(): Promise<Discount[]> {
  // Return cached data if available and fresh
  if (discountsCache && Date.now() - discountsCache.timestamp < CACHE_EXPIRATION) {
    console.log('Using cached discounts data');
    return discountsCache.data;
  }

  try {
    console.log('Fetching discounts from API');
    const response = await fetch(`${API_BASE_URL}/api/discounts`);
    if (!response.ok) {
      throw new Error(`Failed to fetch discounts: ${response.status}`);
    }
    const data = await response.json();
    
    // Update cache
    discountsCache = {
      data,
      timestamp: Date.now()
    };
    
    return data;
  } catch (error) {
    console.error("Error fetching discounts:", error);
    // Return cached data even if expired, in case of network failure
    if (discountsCache) return discountsCache.data;
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
  // Build cache key from options
  const cacheKey = `products_${JSON.stringify(options)}`;
  
  // Return cached data if available and fresh
  if (productCache[cacheKey] && Date.now() - productCache[cacheKey].timestamp < CACHE_EXPIRATION) {
    console.log('Using cached products data');
    return [productCache[cacheKey].data];
  }
  
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (options.categoryId) queryParams.append('categoryId', options.categoryId);
    if (options.isNew) queryParams.append('isNew', 'true');
    if (options.hasDiscount) queryParams.append('hasDiscount', 'true');
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.includeDiscounts) queryParams.append('includeDiscounts', 'true');
    if (options.includeCategories) queryParams.append('includeCategories', 'true');
    
    console.log(`Fetching products from API with options:`, options);
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
 * Fetch a single product by ID with caching
 */
export async function fetchProductById(id: string, options: any = {}): Promise<Product | null> {
  // Build cache key from id and options
  const cacheKey = `product_${id}_${JSON.stringify(options)}`;
  
  // Return cached data if available and fresh
  if (productCache[cacheKey] && Date.now() - productCache[cacheKey].timestamp < CACHE_EXPIRATION) {
    console.log(`Using cached data for product ${id}`);
    return productCache[cacheKey].data;
  }
  
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (options.includeDiscount) queryParams.append('includeDiscount', 'true');
    if (options.includeCategory) queryParams.append('includeCategory', 'true');
    
    console.log(`Fetching product ${id} from API`);
    const url = `${API_BASE_URL}/api/products/${id}?${queryParams.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch product: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Update cache
    productCache[cacheKey] = {
      data,
      timestamp: Date.now()
    };
    
    return data;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
}

/**
 * Fetch all categories with caching
 */
export async function fetchCategories(): Promise<Category[]> {
  // Return cached data if available and fresh
  if (categoriesCache && Date.now() - categoriesCache.timestamp < CACHE_EXPIRATION) {
    console.log('Using cached categories data');
    return categoriesCache.data;
  }
  
  try {
    console.log('Fetching categories from API');
    const response = await fetch(`${API_BASE_URL}/api/categories`);
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }
    const data = await response.json();
    
    // Update cache
    categoriesCache = {
      data,
      timestamp: Date.now()
    };
    
    return data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    // Return cached data even if expired, in case of network failure
    if (categoriesCache) return categoriesCache.data;
    return [];
  }
}

/**
 * Fetch a single category by ID
 */
export async function fetchCategoryById(id: string): Promise<Category | null> {
  try {
    console.log(`Fetching category ${id} from API`);
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
export async function createOrder(orderData: any) {
  try {
    console.log('Preparing order data for submission...');
    
    // Ensure required fields exist with proper structure
    if (!orderData.customerName || !orderData.customerPhone || !orderData.customerAddress) {
      throw new Error('Missing required customer information');
    }
    
    if (!orderData.products || !Array.isArray(orderData.products) || orderData.products.length === 0) {
      throw new Error('Order must contain at least one product');
    }
    
    // Create a modified order object to match backend schema exactly
    const formattedOrderData = {
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerAddress: orderData.customerAddress,
      wilaya: orderData.wilaya,
      totalAmount: orderData.totalAmount,
      shippingCost: orderData.shippingCost,
      notes: orderData.notes || "",
      status: orderData.status || "pending",
      
      // Format products array according to backend schema
      products: orderData.products.map((product: any) => ({
        productId: product.productId, // Keep productId as required by backend
        product: product.productId,   // Also include product field with same value
        productName: product.productName,
        price: product.price,
        quantity: product.quantity,
        size: product.size || "غير محدد",
        color: product.color || "غير محدد"
      }))
    };
    
    // Ensure totalAmount and shippingCost are numbers
    if (typeof formattedOrderData.totalAmount !== 'number') {
      throw new Error('totalAmount must be a number');
    }
    
    if (typeof formattedOrderData.shippingCost !== 'number') {
      throw new Error('shippingCost must be a number');
    }
    
    console.log('Sending order data to API:', JSON.stringify(formattedOrderData, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedOrderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Order creation failed:', errorData);
      throw new Error(`Failed to create order: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Order created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Clear all data caches
 */
export function clearCaches() {
  productCache = {};
  categoriesCache = null;
  discountsCache = null;
  console.log('All API caches cleared');
}

