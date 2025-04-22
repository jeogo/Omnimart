import type { Discount } from "./types/entities"

/**
 * Checks if a discount is currently valid based on its dates
 */
export function isDiscountValid(discount: Discount): boolean {
  if (!discount) return false;
  
  // Check if discount is active
  if (discount.isActive === false) return false;
  
  const now = new Date();
  
  // Check if discount is within valid date range
  if (discount.validFrom && discount.validTo) {
    const startDate = new Date(discount.validFrom);
    const endDate = new Date(discount.validTo);
    return now >= startDate && now <= endDate && discount.percentage > 0;
  }
  
  // If no dates specified but has percentage
  return discount.percentage > 0;
}

/**
 * Gets a human-readable label for a discount
 */
export function getDiscountLabel(discount: Discount): string {
  if (!discount) return "";
  
  if (discount.name && discount.name !== "خصم") {
    return discount.name;
  }
  
  return `${discount.percentage}% خصم`;
}

/**
 * Calculate the price after applying a discount
 */
export function calculateDiscountedPrice(price: number, discount: Discount): number {
  if (!discount || !price) return price;
  
  if (discount.percentage > 0) {
    return Math.round(price * (1 - (discount.percentage / 100)));
  }
  
  return price;
}