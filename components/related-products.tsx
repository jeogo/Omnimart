import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Discount, Product } from "@/lib/types/entities"
import { calculateDiscountedPrice, isDiscountValid, getDiscountLabel } from "@/lib/discount"

interface RelatedProductsProps {
  products: Product[]
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  const createSafeDiscount = (product: Product): Discount | null => {
    if (!product.discount) return null;
    
    const discount = typeof product.discount === 'object' ? product.discount : null;
    if (!discount) return null;
    
    return {
      _id: null,
      id: product.discountId || "temp-discount",
      name: discount.name || "خصم",
      percentage: discount.percentage || 0,
      validFrom: new Date(discount.startDate || new Date()),
      validTo: new Date(discount.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      type: discount.type || "sale",
      applicableProducts: [],
      applicableCategories: [],
      minPurchase: 0,
      code: "",
      isActive: true
    };
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {products.map((product) => {
        const price = product.price
        const oldPrice = product.oldPrice
        const safeDiscount = createSafeDiscount(product);
        const hasValidDiscount =
          safeDiscount && isDiscountValid(safeDiscount);
        const discountedPrice =
          hasValidDiscount && safeDiscount
            ? calculateDiscountedPrice(price, safeDiscount)
            : price

        return (
          <Link key={product.id} href={`/product/${product.id}`} className="block">
            <Card className="h-full overflow-hidden transition-all hover:shadow-md">
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                />
                {product.isNew && (
                  <Badge className="absolute right-1 top-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
                    جديد
                  </Badge>
                )}
                {hasValidDiscount && safeDiscount && (
                  <Badge className="absolute left-1 top-1 bg-red-500 text-white text-xs px-1.5 py-0.5">
                    {getDiscountLabel(safeDiscount)}
                  </Badge>
                )}
              </div>
              <CardContent className="p-2">
                <h3 className="text-sm font-medium line-clamp-1">{product.name}</h3>
              </CardContent>
              <CardFooter className="flex items-center justify-between p-2 pt-0">
                <div className="flex flex-col">
                  <div className="font-bold text-sm">{discountedPrice.toFixed(2)} د.ج</div>
                  {hasValidDiscount && (
                    <div className="text-xs text-muted-foreground line-through">{price.toFixed(2)} د.ج</div>
                  )}
                </div>
              </CardFooter>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
