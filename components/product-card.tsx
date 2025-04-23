import { HeartIcon, PercentIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { cn, hasValidDiscount, getDiscountPercentage, getOriginalPrice, calculateDiscountedPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/types/entities"

interface ProductCardProps {
  product: Product & {
    processedData?: {
      hasDiscount: boolean;
      discountPercent: number;
      originalPrice: number;
      discountedPrice: number;
      savingsAmount: number;
      savingsPercentage: number;
      matchingDiscount?: any;
    }
  }
  className?: string
}

export default function ProductCard({ product, className }: ProductCardProps) {
  if (!product) return null

  // Safe image URL - Fixed to handle array of images properly
  const imageUrl = product.image || 
    (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : "/placeholder.svg");

  // Determine if we should use the processed data from parent component or calculate here
  let hasDiscount = false;
  let discountPercent = 0;
  let originalPrice = product.price;
  let discountedPrice = product.price;
  let savingsAmount = 0;
  let savingsPercentage = 0;

  if (product.processedData) {
    // Use the pre-processed data from parent component
    hasDiscount = product.processedData.hasDiscount;
    discountPercent = product.processedData.discountPercent || 0;
    originalPrice = product.processedData.originalPrice || product.price;
    discountedPrice = product.processedData.discountedPrice || product.price;
    savingsAmount = product.processedData.savingsAmount || 0;
    savingsPercentage = product.processedData.savingsPercentage || 0;
  } else {
    // Calculate it here using utility functions
    hasDiscount = hasValidDiscount(product);
    discountPercent = getDiscountPercentage(product);
    originalPrice = product.oldPrice || getOriginalPrice(product);
    discountedPrice = hasDiscount ? calculateDiscountedPrice(product) : product.price;
    savingsAmount = Math.max(0, originalPrice - discountedPrice);
    savingsPercentage = originalPrice > 0 ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) : 0;
  }

  // Ensure valid number values
  originalPrice = typeof originalPrice === 'number' ? originalPrice : product.price || 0;
  discountedPrice = typeof discountedPrice === 'number' ? discountedPrice : product.price || 0;
  savingsAmount = typeof savingsAmount === 'number' ? savingsAmount : 0;
  savingsPercentage = typeof savingsPercentage === 'number' ? savingsPercentage : 0;

  // New badge - only use the isNew property that exists in the Product type
  const isNew = !!product.isNew;

  // Product name fallback
  const productName = typeof product.name === "string" ? product.name : "منتج";
  const categoryName = typeof product.category === "string" ? product.category : "";

  // Format price with commas for thousands
  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Safety check for product ID
  const productId = product.id;
  if (!productId) return null;

  return (
    <div className={cn(
      "group relative rounded-xl overflow-hidden border border-gray-200 bg-white transition-all duration-300",
      "hover:shadow-lg hover:border-gray-300 hover:translate-y-[-2px]",
      className
    )}>
      {/* Discount badge - improved design */}
      {hasDiscount && discountPercent > 0 && (
        <div className="absolute left-2 top-2 z-10 bg-gradient-to-r from-rose-600 to-rose-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
          <PercentIcon className="h-3 w-3" />
          <span>خصم {discountPercent}٪</span>
        </div>
      )}

      {/* New product badge */}
      {isNew && (
        <Badge className="absolute left-2 top-2 z-10 bg-blue-600 text-white hover:bg-blue-700">
          جديد
        </Badge>
      )}

      <Link href={`/product/${productId}`} className="block overflow-hidden h-56 md:h-60 bg-gray-100 relative">
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        <Image
          src={imageUrl}
          alt={productName}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Overlay with discount info for better visibility */}
        {hasDiscount && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent py-3 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-2 text-white">
              <span className="font-bold">{savingsPercentage}٪</span>
              <span className="text-xs">وفر {formatPrice(savingsAmount)} دج</span>
            </div>
          </div>
        )}
        
        <HeartIcon className="h-4 w-4 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
      
      <div className="p-4">
        <div className="mb-3">
          {categoryName && (
            <p className="text-xs text-gray-500 mb-1">{categoryName}</p>
          )}
          <Link href={`/product/${productId}`} className="font-medium text-gray-800 line-clamp-1 hover:text-primary transition-colors">
            {productName}
          </Link>
        </div>
        
        {/* Enhanced price display section */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col">
            {hasDiscount ? (
              <div className="relative">
                {/* Price display with discount - refined and professional */}
                <div className="flex items-baseline gap-2">
                  <span key="discounted-price" className="text-lg font-bold text-rose-600">{formatPrice(discountedPrice)} دج</span>
                  <span key="original-price" className="text-sm text-gray-500 line-through opacity-70">{formatPrice(originalPrice)} دج</span>
                </div>
                {/* Attractive savings badge */}
                <div className="mt-1 inline-flex items-center text-xs bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-sm">
                  <span className="font-medium">خصم {savingsPercentage}٪</span>
                </div>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-800">{formatPrice(product.price || 0)} دج</span>
            )}
          </div>
        </div>
        
        {/* Quick actions footer */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
          <Link 
            key="view-details-link"
            href={`/product/${productId}`} 
            className="text-xs font-medium text-primary hover:underline transition-colors flex items-center gap-1"
          >
            عرض التفاصيل
            <svg key="arrow-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 rotate-180">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}