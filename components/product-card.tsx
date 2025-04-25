import { Product } from "@/lib/types/index";
import { Card, CardContent } from "@/components/ui/card";
import { hasValidDiscount, getDiscountPercentage, formatPrice } from "@/lib/api-utils";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className = "" }: ProductCardProps) {
  // Ensure required product properties have default values
  const safeProduct = {
    ...product,
    description: product.description || "", // Ensure description is a string
    rating: product.rating || 0,
    reviews: product.reviews || 0,
  };

  // Calculate discount information
  const isDiscounted = hasValidDiscount(safeProduct);
  const discountPercentage = getDiscountPercentage(safeProduct);
  
  // Get image source with fallbacks
  const imageUrl = safeProduct.imageUrl || safeProduct.image || 
    (Array.isArray(safeProduct.images) && safeProduct.images.length > 0 ? safeProduct.images[0] : "/placeholder.svg");
    
  // Get product URL
  const productUrl = `/product/${safeProduct._id || safeProduct.id}`;
  
  // Calculate pricing
  const price = safeProduct.price;
  const originalPrice = safeProduct.oldPrice || price;
  const finalPrice = isDiscounted && discountPercentage > 0 
    ? Math.round(originalPrice * (1 - discountPercentage / 100)) 
    : price;

  return (
    <Card className={`overflow-hidden h-full transition duration-300 hover:shadow-md ${className}`}>
      <div className="aspect-[3/4] relative overflow-hidden group">
        <Link href={productUrl}>
          <div className="relative h-full w-full">
            <Image 
              src={imageUrl} 
              alt={safeProduct.name}
              fill
              className="object-cover transform group-hover:scale-105 transition-transform duration-500" 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
            />
          </div>
          
          {isDiscounted && discountPercentage > 0 && (
            <Badge className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700">
              خصم {discountPercentage}%
            </Badge>
          )}
          
          {safeProduct.isNewProduct && (
            <Badge className="absolute top-2 left-2 bg-blue-600 hover:bg-blue-700">
              جديد
            </Badge>
          )}
        </Link>
      </div>
      
      <CardContent className="p-3">
        <Link href={productUrl} className="block">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              {safeProduct.rating > 0 && (
                <>
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs text-slate-500 ml-1">{safeProduct.rating}</span>
                </>
              )}
              {safeProduct.reviews > 0 && (
                <span className="text-xs text-slate-400 mr-1">({safeProduct.reviews})</span>
              )}
            </div>
            <span className="text-xs text-slate-500">
              {safeProduct.category && (typeof safeProduct.category === 'string' 
                ? safeProduct.category 
                : safeProduct.category.name)}
            </span>
          </div>
          
          <h3 className="font-medium text-sm line-clamp-2 h-10 mt-1 mb-1">
            {safeProduct.name}
          </h3>
          
          <div className="flex items-center mt-1">
            <span className="font-bold text-lg text-primary">
              {formatPrice(finalPrice)}
            </span>
            
            {isDiscounted && discountPercentage > 0 && (
              <span className="text-xs line-through text-slate-500 mr-2">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}