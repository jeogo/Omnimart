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
  // If products is undefined, use an empty array
  const safeProducts = products || [];
  
  const createSafeDiscount = (product: Product): Discount | null => {
    // Check if product has a discountId
    if (product.discountId) {
      return {
        _id: null,
        id: product.discountId,
        name: "خصم",
        percentage: (typeof product.discount === 'object' && product.discount?.percentage) || 0,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        type: "sale",
        applicableProducts: [],
        applicableCategories: [],
        minPurchase: 0,
        code: "",
        isActive: true
      };
    }
    
    // Check for direct discount object
    if (product.discount && typeof product.discount === 'object') {
      return {
        _id: null,
        id: "temp-discount",
        name: product.discount.name || "خصم",
        percentage: product.discount.percentage || 0,
        validFrom: new Date(product.discount.startDate || new Date()),
        validTo: new Date(product.discount.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        type: product.discount.type || "sale",
        applicableProducts: [],
        applicableCategories: [],
        minPurchase: 0,
        code: "",
        isActive: true
      };
    }
    
    // Check for discount percentage (if discount is a number)
    if (typeof product.discount === 'number' && product.discount > 0) {
      return {
        _id: null,
        id: "temp-discount",
        name: `خصم ${product.discount}%`,
        percentage: product.discount,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        type: "sale",
        applicableProducts: [],
        applicableCategories: [],
        minPurchase: 0,
        code: "",
        isActive: true
      };
    }
    
    // Check for old price vs current price to infer a discount
    if (product.oldPrice && product.oldPrice > product.price) {
      const percentage = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
      return {
        _id: null,
        id: "inferred-discount",
        name: `خصم ${percentage}%`,
        percentage: percentage,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        type: "sale",
        applicableProducts: [],
        applicableCategories: [],
        minPurchase: 0,
        code: "",
        isActive: true
      };
    }
    
    // No discount information found
    return null;
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {safeProducts.map((product) => {
        // Make sure product has essential fields
        if (!product || !product.id) {
          return null;
        }
        
        const price = product.price || 0;
        const safeDiscount = createSafeDiscount(product);
        const hasValidDiscount = safeDiscount && isDiscountValid(safeDiscount);
        const discountedPrice = hasValidDiscount && safeDiscount
          ? calculateDiscountedPrice(price, safeDiscount)
          : price;
        const imageUrl = product.image || product.images?.[0] || "/placeholder.svg";

        return (
          <Link key={product.id} href={`/product/${product.id}`} className="block">
            <Card className="h-full overflow-hidden transition-all hover:shadow-md">
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
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
