import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Product } from "./types/entities"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if a product has a valid discount
 */
export function hasValidDiscount(product: any): boolean {
  if (!product) return false;
  
  // Check for oldPrice > price
  if (product.oldPrice && product.oldPrice > product.price) {
    return true;
  }
  
  // Check for discount percentage
  if (typeof product.discount === 'number' && product.discount > 0) {
    return true;
  }
  
  // Check for discount object
  if (product.discount && typeof product.discount === 'object') {
    const now = new Date();
    const startDate = product.discount.startDate ? new Date(product.discount.startDate) : null;
    const endDate = product.discount.endDate ? new Date(product.discount.endDate) : null;
    
    // If dates are specified, check if current date is within range
    if (startDate && endDate) {
      return now >= startDate && now <= endDate && product.discount.percentage > 0;
    }
    
    // If no dates specified but has percentage
    return product.discount.percentage > 0;
  }
  
  return false;
}

/**
 * Gets the discount percentage from a product
 */
export function getDiscountPercentage(product: any): number {
  if (!product) return 0;
  
  // If discount is a number
  if (typeof product.discount === 'number') {
    return product.discount;
  }
  
  // If discount is an object with percentage
  if (product.discount && typeof product.discount === 'object' && product.discount.percentage) {
    return product.discount.percentage;
  }
  
  // Calculate from oldPrice and price
  if (product.oldPrice && product.price && product.oldPrice > product.price) {
    return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
  }
  
  return 0;
}

/**
 * Calculate the original price before discount
 */
export function getOriginalPrice(product: any): number {
  if (!product) return 0;
  
  // If oldPrice exists, use it
  if (product.oldPrice) {
    return product.oldPrice;
  }
  
  // If there's a discount percentage, calculate the original price
  const discountPercent = getDiscountPercentage(product);
  if (discountPercent > 0) {
    return Math.round(product.price / (1 - (discountPercent / 100)));
  }
  
  // Default to current price
  return product.price;
}

/**
 * Calculate the discounted price
 */
export function calculateDiscountedPrice(product: any): number {
  if (!product) return 0;
  
  // If there's a price, use it as it's already discounted
  if (product.price) {
    return product.price;
  }
  
  // If there's an oldPrice and discount percentage, calculate discounted price
  const discountPercent = getDiscountPercentage(product);
  if (product.oldPrice && discountPercent > 0) {
    return Math.round(product.oldPrice * (1 - (discountPercent / 100)));
  }
  
  return 0;
}
