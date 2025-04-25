// Simplified utility functions to support designs

import type { Product, Discount } from "@/lib/types/index";

/**
 * Checks if a product has a valid discount
 */
export function hasValidDiscount(product: Product): boolean {
  return !!product.discountId;
}

/**
 * Gets discount percentage from a product
 */
export function getDiscountPercentage(product: Product): number {
  return 0;
}

/**
 * Gets original price from a product
 */
export function getOriginalPrice(product: Product): number {
  return product.oldPrice || product.price;
}

/**
 * Calculate the price after applying a discount
 */
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

/**
 * Check if a discount is currently valid
 */
export function isDiscountValid(discount: Discount): boolean {
  if (!discount || discount.isActive === false) return false;
  
  const now = new Date();
  
  // Check dates if available
  if (discount.validFrom && discount.validTo) {
    const startDate = new Date(discount.validFrom);
    const endDate = new Date(discount.validTo);
    return now >= startDate && now <= endDate;
  }
  
  // If only expiresAt is provided
  if (discount.expiresAt) {
    const expiryDate = new Date(discount.expiresAt);
    return now <= expiryDate;
  }
  
  // If no dates provided but has percentage > 0, consider valid
  return discount.percentage > 0;
}

/**
 * Get remaining time for a discount in human-readable format
 */
export function getDiscountTimeRemaining(discount: Discount): string {
  let endDate: Date;
  
  if (discount.validTo) {
    endDate = new Date(discount.validTo);
  } else if (discount.expiresAt) {
    endDate = new Date(discount.expiresAt);
  } else {
    // Default to 7 days from now if no end date is specified
    endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
  }
  
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  
  if (diffMs <= 0) return "انتهى العرض";
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) {
    return `متبقي ${diffDays} يوم ${diffHours} ساعة`;
  } else {
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `متبقي ${diffHours} ساعة ${diffMinutes} دقيقة`;
  }
}

// Utility to join class names conditionally
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}