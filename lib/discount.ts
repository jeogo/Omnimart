import type { Discount } from "@/lib/types/entities"

export function calculateDiscountedPrice(price: number, discount: Discount): number {
  if (!isDiscountValid(discount)) return price
  return price - (price * discount.percentage) / 100
}

export function isDiscountValid(discount: Discount): boolean {
  const now = new Date()
  const start = new Date(discount.validFrom)
  const end = new Date(discount.validTo)
  return now >= start && now <= end
}

export function getDiscountLabel(discount: Discount): string {
  switch (discount.type) {
    case "sale":
      return `خصم ${discount.percentage}%`
    case "seasonal":
      return `عرض موسمي ${discount.percentage}%`
    case "special":
      return `عرض خاص ${discount.percentage}%`
    default:
      return `خصم ${discount.percentage}%`
  }
}
