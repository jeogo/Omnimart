import { Phone, ShoppingBag, MapPin, Tag, ShieldCheck, Truck, ArrowRight, Clock, Heart, Sparkles, Gift, Check, RefreshCw, Bell, Facebook, Instagram, Mail, MessageCircle, Star, Twitter, Users } from "lucide-react"
import { fetchProducts, fetchCategories, fetchDiscounts, formatPrice } from "@/lib/api-utils"
import ProductCard from "@/components/product-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { Product, Category, Discount } from "@/lib/types/index"
import { Suspense } from "react"
import { motion } from "framer-motion"

// Type definitions for our processed product data
interface ProcessedProduct extends Product {
  id: string;
  processedData: {
    hasDiscount: boolean;
    discountPercent: number;
    originalPrice: number;
    discountedPrice: number;
    savingsAmount: number;
    savingsPercentage: number;
    matchingDiscount: Discount | null;
  };
  isNewProduct?: boolean;
  rating?: number; // <-- Fix: add rating
  reviews?: number; // <-- Fix: add reviews
}

// Type-safe dictionary for categoryId to products mapping
interface CategoryProductMapping {
  [categoryId: string]: ProcessedProduct[];
}

export default async function Home() {
  // Fetch all data in parallel with better error handling using Promise.allSettled
  const [productsResult, categoriesResult, discountsResult] = await Promise.allSettled([
    fetchProducts({ includeDiscounts: true }),
    fetchCategories(),
    fetchDiscounts()
  ]);

  // Extract data safely from promises
  const products: Product[] = productsResult.status === 'fulfilled' ? productsResult.value : [];
  const categories: Category[] = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
  const discounts: Discount[] = discountsResult.status === 'fulfilled' ? discountsResult.value : [];

  // Create Map of discounts for faster lookup
  const discountMap = new Map<string, Discount>();
  discounts.forEach(d => {
    if (d && d._id) discountMap.set(String(d._id), d);
  });

  // Helper function to get a stable ID from a product or category
  const getStableId = (item: any, index: number, prefix = 'item'): string => 
    String(item?.id || item?._id || `${prefix}-${index}`);

  // Process products with discount data - with better error handling
  const processedProducts: ProcessedProduct[] = products.map((product, idx) => {
    try {
      // Find applicable discount
      const discountId = product.discountId?.toString();
      const matchingDiscount = discountId ? discountMap.get(discountId) || null : null;
      
      // Only consider active discounts
      const isDiscountActive = matchingDiscount && matchingDiscount.isActive !== false;
      
      // Calculate pricing with safer number handling
      const originalPrice = Number(product.oldPrice || product.price || 0);
      const discountPercent = isDiscountActive ? Number(matchingDiscount?.percentage || 0) : 0;
      
      let discountedPrice = originalPrice;
      if (discountPercent > 0 && originalPrice > 0) {
        discountedPrice = Math.round(originalPrice * (1 - (discountPercent / 100)));
      }
      
      const savingsAmount = Math.max(0, originalPrice - discountedPrice);
      const savingsPercentage = originalPrice > 0 
        ? Math.round((savingsAmount / originalPrice) * 100) 
        : 0;
      
      return {
        ...product,
        id: getStableId(product, idx, 'product'),
        description: product.description ?? "", // <-- Fix: always string
        rating: typeof product.rating === "number" ? product.rating : 0, // propagate rating
        reviews: typeof product.reviews === "number" ? product.reviews : 0, // propagate reviews
        processedData: {
          hasDiscount: !!isDiscountActive,
          discountPercent,
          originalPrice,
          discountedPrice,
          savingsAmount,
          savingsPercentage,
          matchingDiscount: isDiscountActive ? matchingDiscount : null
        }
      };
    } catch (error) {
      console.error(`Error processing product ${product.name}:`, error);
      // Return safe fallback data if processing fails
      return {
        ...product,
        id: getStableId(product, idx, 'product'),
        processedData: {
          hasDiscount: false,
          discountPercent: 0,
          originalPrice: Number(product.price || 0),
          discountedPrice: Number(product.price || 0),
          savingsAmount: 0,
          savingsPercentage: 0,
          matchingDiscount: null
        }
      };
    }
  });

  // Create a map for faster category lookups
  const categoryMap = new Map<string, { id: string, name: string }>();
  categories.forEach((cat, index) => {
    if (cat && (cat._id || cat.id)) {
      categoryMap.set(String(cat._id || cat.id), {
        id: getStableId(cat, index, 'category'),
        name: cat.name || 'غير مصنف'
      });
    }
  });
  
  // Group products by category more safely
  const productsByCategory: CategoryProductMapping = {};
  
  processedProducts.forEach(product => {
    if (!product.categoryId) return;
    
    const categoryId = String(product.categoryId);
    if (categoryMap.has(categoryId)) {
      const mappedId = categoryMap.get(categoryId)!.id;
      if (!productsByCategory[mappedId]) {
        productsByCategory[mappedId] = [];
      }
      productsByCategory[mappedId].push(product);
    }
  });

  // Best sellers - sort by rating
  const bestsellers = [...processedProducts]
    .sort((a, b) => {
      const ratingA = typeof a.rating === 'number' ? a.rating : 0;
      const ratingB = typeof b.rating === 'number' ? b.rating : 0;
      return ratingB - ratingA;
    })
    .slice(0, 4);

  // New products
  const newProducts = processedProducts
    .filter(p => !!p.isNewProduct)
    .slice(0, 4);

  // Products with active discounts
  const discountedProducts = processedProducts
    .filter(p => p.processedData?.hasDiscount)
    .sort((a, b) => b.processedData.savingsPercentage - a.processedData.savingsPercentage)
    .slice(0, 4);

  // Maximum discount percentage
  const maxDiscountPercentage = Math.max(...discounts.map(d => {
    const percentage = Number(d.percentage);
    return !isNaN(percentage) ? percentage : 0;
  }), 0);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Enhanced Header with improved visibility */}
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur shadow-sm">
        <div className="container flex h-16 items-center justify-between py-2">
          <Link href="/" className="flex items-center gap-2 transition-colors hover:text-primary">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">OmniMart</span>
          </Link>
          
          {/* Improved CTA button */}
          <div className="flex items-center gap-4">
            <Link href="/products" className="px-5 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors transform hover:scale-105 shadow-md">
              تسوق الآن
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Banner with improved visual appeal and clearer value proposition */}
        <section className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 py-16 md:py-24">
          <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-slate-700/25"></div>
          <div className="container px-4 md:px-6 relative">
            <div className="max-w-3xl mx-auto text-center">
              {/* More prominent free shipping notification */}
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 animate-pulse">
                <Truck className="h-4 w-4 inline-block ml-1" />
                توصيل مجاني للطلبات فوق 5000 دج
              </span>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                أفضل المنتجات بأفضل الأسعار
              </h1>
              <p className="text-xl text-slate-600 mb-8 max-w-xl mx-auto">
                اكتشف تشكيلتنا الواسعة من المنتجات العصرية عالية الجودة بأسعار لا تقبل المنافسة
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* More prominent primary CTA */}
                <Link href="/products" className="px-8 py-3.5 bg-primary text-white rounded-lg font-medium text-lg hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg group">
                  تسوق الآن
                  <ArrowRight className="h-5 w-5 inline-block mr-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="#categories" className="px-8 py-3.5 bg-white text-primary rounded-lg font-medium text-lg hover:bg-gray-50 transition-all border border-primary/30 shadow-sm">
                  استكشف الفئات
                </Link>
              </div>
            </div>
            
            {/* Enhanced Trust Badges */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm">
              <div className="flex flex-col items-center gap-1 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                <Truck className="h-6 w-6 text-primary mb-1" />
                <span className="font-medium">شحن سريع</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                <ShieldCheck className="h-6 w-6 text-primary mb-1" />
                <span className="font-medium">ضمان جودة</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                <Tag className="h-6 w-6 text-primary mb-1" />
                <span className="font-medium">أسعار منافسة</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                <RefreshCw className="h-6 w-6 text-primary mb-1" />
                <span className="font-medium">استرجاع سهل</span>
              </div>
            </div>
          </div>
        </section>

        {/* Special Offers with enhanced urgency and visual appeal */}
        {discountedProducts.length > 0 && (
          <section className="py-16 bg-gradient-to-br from-rose-50 to-amber-50 relative overflow-hidden">
            {/* Adding decorative elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-amber-400"></div>
            <div className="absolute -top-8 -left-8 w-16 h-16 rounded-full bg-rose-100 opacity-50"></div>
            <div className="absolute -bottom-8 -right-8 w-16 h-16 rounded-full bg-amber-100 opacity-50"></div>
            
            <div className="container px-4 md:px-6 relative">
              {/* Enhanced heading section with stronger urgency */}
              <div className="text-center mb-10">
                <span className="inline-block px-4 py-1.5 rounded-full bg-rose-100 text-rose-600 text-sm font-bold mb-2 shadow-sm">
                  <Sparkles className="h-4 w-4 inline-block ml-1" />
                  عروض حصرية لفترة محدودة
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">خصومات حصرية تصل إلى {maxDiscountPercentage}%</h2>
                <p className="text-slate-700 md:text-lg max-w-2xl mx-auto mb-4">
                  استفد من أقوى الخصومات على منتجات مختارة، فرصة لن تتكرر للحصول على منتجاتنا المميزة بأسعار استثنائية
                </p>
                
                {/* Enhanced countdown for better urgency */}
                <div className="mt-4 flex justify-center gap-4 mb-8">
                  <div className="relative">
                    <div className="bg-white rounded-xl shadow-md px-5 py-3 border-t-4 border-rose-500 w-20">
                      <div className="text-2xl font-bold text-rose-600">24</div>
                      <div className="text-xs font-medium text-slate-500">ساعة</div>
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full animate-ping"></div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md px-5 py-3 border-t-4 border-rose-500 w-20">
                    <div className="text-2xl font-bold text-rose-600">12</div>
                    <div className="text-xs font-medium text-slate-500">دقيقة</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md px-5 py-3 border-t-4 border-rose-500 w-20">
                    <div className="text-2xl font-bold text-rose-600">36</div>
                    <div className="text-xs font-medium text-slate-500">ثانية</div>
                  </div>
                </div>
              </div>
              
              <Suspense fallback={<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => (
                <div key={i} className="h-[370px] bg-white/30 animate-pulse rounded-lg" />
              ))}</div>}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {discountedProducts.map((product, index) => (
                    <div key={`discount-${product.id}`} 
                         className="group animate-fadeIn relative hover:transform hover:translate-y-[-5px] transition-transform">
                      {/* Improved discount ribbon with animation */}
                      <div className="absolute -right-2 top-4 z-10 bg-rose-600 text-white px-4 py-1.5 font-bold shadow-lg after:absolute after:top-0 after:right-[-10px] after:border-l-[10px] after:border-l-transparent after:border-t-[10px] after:border-t-rose-700 before:absolute before:content-[''] before:bottom-0 before:right-[-10px] before:border-l-[10px] before:border-l-transparent before:border-b-[10px] before:border-b-rose-700 animate-pulse">
                        خصم {product.processedData.discountPercent}%
                      </div>
                      <ProductCard product={{ ...product, description: product.description ?? "" }} className="h-[370px] transition-all duration-300 group-hover:shadow-xl" />
                      
                      {/* Enhanced urgency label */}
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-md py-2 px-3 text-sm font-bold text-rose-600 text-center shadow-md border border-rose-100">
                        <Clock className="h-4 w-4 inline-block ml-1" />
                        {index % 2 === 0 ? "ينتهي اليوم!" : "ينفذ قريباً!"}
                      </div>
                      
                      {/* Add quick buy overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Link 
                          href={`/product/${product._id || product.id}`} 
                          className="px-5 py-2.5 bg-rose-600 text-white rounded-md font-medium hover:bg-rose-700 transition-all transform hover:scale-105 shadow-md">
                          اشتري الآن
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center mt-10">
                  <Link href="/products" className="flex items-center gap-2 px-8 py-3 bg-rose-600 text-white rounded-md font-medium hover:bg-rose-700 transition-colors shadow-md text-lg">
                    عرض جميع العروض <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </Suspense>
            </div>
          </section>
        )}

        {/* Best Sellers Section with improved visual elements */}
        <section className="py-16 bg-white">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-amber-600 text-sm font-bold mb-2 shadow-sm">
                <Star className="h-4 w-4 inline-block ml-1 fill-amber-500" />
                المنتجات الأكثر طلباً
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">الأكثر مبيعاً</h2>
              <p className="text-slate-700 md:text-lg max-w-2xl mx-auto">
                منتجاتنا الأكثر مبيعاً واختيار زبائننا الدائمين، جودة عالية وتصميمات عصرية مختارة بعناية
              </p>
            </div>
            
            <Suspense fallback={<div className="grid grid-cols-2 md:grid-cols-4 gap-6">{[...Array(4)].map((_, i) => (
              <div key={i} className="h-[370px] bg-gray-100 animate-pulse rounded-lg" />
            ))}</div>}>
              {bestsellers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {bestsellers.map((product, index) => (
                    <div key={product.id} 
                        className="group animate-fadeIn relative" 
                        style={{ animationDelay: `${index * 100}ms` }}>
                      {/* Enhanced bestseller badge */}
                      <div className="absolute left-2 top-2 z-10 bg-amber-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        الأكثر مبيعاً
                      </div>
                      
                      {/* Add subtle "limited quantity" indicator */}
                      <div className="absolute right-2 top-2 z-10 bg-white/90 backdrop-blur-sm text-amber-700 px-2 py-1 rounded-full text-xs font-medium border border-amber-200">
                        {(index + 2) * 3} قطعة متبقية
                      </div>
                      
                      <ProductCard product={{ ...product, description: product.description ?? "" }} className="h-[370px] transition-all duration-300 group-hover:shadow-xl" />
                      
                      {/* Enhanced quick-buy button */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Link 
                          href={`/product/${product._id || product.id}`} 
                          className="px-5 py-2.5 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-all transform hover:scale-105 shadow-md">
                          اشتري الآن
                        </Link>
                      </div>
                      
                      {/* Add popularity indicator */}
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-md py-1.5 px-3 text-xs font-medium text-amber-700 text-center border border-amber-100">
                        <Users className="h-3 w-3 inline-block ml-1" />
                        {(index + 3) * 7} شخص اشترى هذا المنتج
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg">
                  <ShoppingBag className="h-10 w-10 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">لا توجد منتجات متاحة حالياً</p>
                </div>
              )}
              
              <div className="flex justify-center mt-10">
                <Link href="/products" className="flex items-center gap-2 px-8 py-3 bg-amber-500 text-white rounded-md font-medium hover:bg-amber-600 transition-colors shadow-md text-lg">
                  عرض جميع المنتجات <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </Suspense>
          </div>
        </section>

        {/* Enhanced Feature Banners with improved visuals */}
        <section className="py-16 bg-slate-50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-2 shadow-sm">
                <ShieldCheck className="h-4 w-4 inline-block ml-1" />
                لماذا تختارنا
              </span>
              <h2 className="text-3xl font-bold mb-3">خدمات تميزنا</h2>
              <p className="text-slate-700 max-w-2xl mx-auto">
                نسعى دائماً لتقديم تجربة تسوق مميزة لعملائنا مع خدمات احترافية تلبي جميع احتياجاتكم
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-slate-100 text-center transform hover:translate-y-[-8px] transition-transform">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3">توصيل سريع لجميع الولايات</h3>
                <p className="text-slate-600">توصيل آمن وسريع لجميع طلباتك مع إمكانية تتبع الشحنة</p>
                <ul className="mt-4 text-sm text-slate-600 space-y-1">
                  <li className="flex items-center justify-center gap-1">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>توصيل خلال 24-48 ساعة</span>
                  </li>
                  <li className="flex items-center justify-center gap-1">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>تغطية لجميع الولايات</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-slate-100 text-center transform hover:translate-y-[-8px] transition-transform">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3">ضمان الجودة 100%</h3>
                <p className="text-slate-600">منتجات أصلية بجودة عالية مع ضمان استرجاع خلال 7 أيام</p>
                <ul className="mt-4 text-sm text-slate-600 space-y-1">
                  <li className="flex items-center justify-center gap-1">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>منتجات أصلية ومضمونة</span>
                  </li>
                  <li className="flex items-center justify-center gap-1">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>استرجاع خلال 7 أيام</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-slate-100 text-center transform hover:translate-y-[-8px] transition-transform">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3">دعم العملاء على مدار الساعة</h3>
                <p className="text-slate-600">فريق دعم متواجد لمساعدتك والإجابة على جميع استفساراتك</p>
                <ul className="mt-4 text-sm text-slate-600 space-y-1">
                  <li className="flex items-center justify-center gap-1">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>دعم متواصل 7/24</span>
                  </li>
                  <li className="flex items-center justify-center gap-1">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>فريق خبير بخدمتك</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced New Products Section */}
        {newProducts.length > 0 && (
          <section className="py-16 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
            {/* Adding decorative elements */}
            <div className="absolute top-20 right-0 w-32 h-32 rounded-full bg-blue-100/50 blur-3xl"></div>
            <div className="absolute bottom-20 left-0 w-32 h-32 rounded-full bg-indigo-100/50 blur-3xl"></div>
            
            <div className="container px-4 md:px-6 relative">
              <div className="text-center mb-12">
                <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-600 text-sm font-bold mb-2 shadow-sm">
                  <Sparkles className="h-4 w-4 inline-block ml-1" />
                  وصل حديثاً
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">أحدث المنتجات</h2>
                <p className="text-slate-700 md:text-lg max-w-2xl mx-auto mb-4">
                  اكتشف أحدث المنتجات في متجرنا وكن أول من يقتنيها، تشكيلة جديدة من أرقى المنتجات
                </p>
              </div>
              
              <Suspense fallback={<div className="grid grid-cols-2 md:grid-cols-4 gap-6">{[...Array(4)].map((_, i) => (
                <div key={i} className="h-[370px] bg-white animate-pulse rounded-lg" />
              ))}</div>}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {newProducts.map((product, index) => (
                    <div key={`new-${product.id}`} 
                         className="animate-fadeIn relative group" 
                         style={{ animationDelay: `${index * 100}ms` }}>
                      {/* Enhanced 'New' badge with animation */}
                      <div className="absolute left-2 top-2 z-10 bg-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping"></span>
                        جديد
                      </div>
                      
                      <ProductCard product={{ ...product, description: product.description ?? "" }} className="h-[370px] transition-all duration-300 group-hover:shadow-xl ring-1 ring-blue-100" />
                      
                      {/* Add "limited edition" tag */}
                      <div className="absolute right-2 top-2 z-10 bg-white/90 backdrop-blur-sm text-blue-700 px-2 py-1 rounded-full text-xs font-medium border border-blue-200">
                        إصدار محدود
                      </div>
                      
                      {/* Add quick buy overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Link 
                          href={`/product/${product._id || product.id}`} 
                          className="px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-all transform hover:scale-105 shadow-md">
                          اشتري الآن
                        </Link>
                      </div>
                      
                      {/* Add "be first" indicator */}
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-md py-1.5 px-3 text-xs font-medium text-blue-700 text-center border border-blue-100">
                        <Heart className="h-3 w-3 inline-block ml-1" />
                        كن أول من يقتني هذا المنتج الجديد
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center mt-10">
                  <Link href="/products" className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors shadow-md text-lg">
                    استكشف المزيد <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </Suspense>
            </div>
          </section>
        )}

        {/* Products by Category - Enhanced Tab View */}
        <section id="categories" className="py-16 bg-white">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-2 shadow-sm">
                <Tag className="h-4 w-4 inline-block ml-1" />
                كل الأقسام
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">تسوق حسب الفئة</h2>
              <p className="text-slate-700 md:text-lg max-w-2xl mx-auto mb-4">
                تصفح منتجاتنا حسب الفئة للعثور بسهولة على ما تبحث عنه، مع تشكيلة واسعة لجميع الأذواق
              </p>
            </div>
          
            <Suspense fallback={<div className="h-12 w-full bg-gray-100 animate-pulse rounded-lg mb-6" />}>
              {categories.length > 0 ? (
                <Tabs defaultValue="all" className="space-y-8">
                  <div className="bg-white rounded-xl shadow-md">
                    <div className="overflow-x-auto px-4 py-2 border border-gray-100 rounded-xl">
                      <TabsList className="flex w-max min-w-full h-auto bg-slate-100/70 p-1.5 rounded-lg">
                        <TabsTrigger
                          value="all"
                          className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-3 text-sm rounded-md font-medium"
                        >
                          الكل
                          <Badge className="ml-2 bg-primary/10 text-primary">{products.length}</Badge>
                        </TabsTrigger>
                        
                        {categories
                          .filter(category => category && category.name)
                          .map((category) => {
                            const categoryId = getStableId(category, 0, 'category');
                            const productCount = productsByCategory[categoryId]?.length || 0;
                            
                            // Skip if no products for this category
                            if (productCount === 0 && categories.length > 5) return null;
                            
                            return (
                              <TabsTrigger
                                key={categoryId}
                                value={categoryId}
                                className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm whitespace-nowrap px-5 py-3 text-sm rounded-md font-medium"
                              >
                                {category.name}
                                <Badge className="bg-primary/10 text-primary ml-1.5">
                                  {productCount}
                                </Badge>
                              </TabsTrigger>
                            );
                          })}
                      </TabsList>
                    </div>
                  </div>
                  
                  <TabsContent value="all" className="p-1 mt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {processedProducts.length > 0 ? 
                        processedProducts.map((product, index) => (
                          <div key={product.id} 
                               className="animate-fadeIn" 
                               style={{ animationDelay: `${Math.min(index, 5) * 80}ms` }}>
                            <ProductCard product={{ ...product, description: product.description ?? "" }} className="h-[370px]" />
                          </div>
                        )) : (
                          <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">لا توجد منتجات متاحة حالياً</p>
                          </div>
                        )
                      }
                    </div>
                  </TabsContent>
                  
                  {categories.map((category) => {
                    if (!category || !category.name) return null;
                    
                    const categoryId = getStableId(category, 0, 'category');
                    const categoryProducts = productsByCategory[categoryId] || [];
                    
                    if (categoryProducts.length === 0 && categories.length > 5) return null;
                    
                    return (
                      <TabsContent key={`tab-${categoryId}`} value={categoryId} className="p-1 mt-0">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {categoryProducts.length > 0 ? (
                            categoryProducts.map((product, index) => (
                              <div key={`${categoryId}-${product.id}`} 
                                   className="animate-fadeIn" 
                                   style={{ animationDelay: `${Math.min(index, 5) * 80}ms` }}>
                                <ProductCard product={{ ...product, description: product.description ?? "" }} className="h-[370px]" />
                              </div>
                            ))
                          ) : (
                            <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg">
                              <p className="text-gray-500">لا توجد منتجات في هذه الفئة حالياً</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Tag className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">لا توجد فئات متاحة حالياً</p>
                </div>
              )}
            </Suspense>
          </div>
        </section>

        {/* Enhanced Testimonials Section */}
        <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50 relative overflow-hidden">
          {/* Adding decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-300 to-indigo-300"></div>
          <div className="absolute top-20 right-0 w-32 h-32 rounded-full bg-indigo-100/50 blur-3xl"></div>
          <div className="absolute bottom-20 left-0 w-32 h-32 rounded-full bg-blue-100/50 blur-3xl"></div>
          
          <div className="container px-4 md:px-6 relative">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold mb-2 shadow-sm">
                <MessageCircle className="h-4 w-4 inline-block ml-1" />
                آراء عملائنا
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">ماذا يقول عملاؤنا</h2>
              <p className="text-slate-700 md:text-lg max-w-2xl mx-auto">
                نفتخر بثقة عملائنا ونسعى دائمًا لتقديم أفضل تجربة تسوق
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: "أحمد محمد",
                  location: "الجزائر العاصمة",
                  text: "منتجات ممتازة وخدمة عملاء رائعة، وصلني الطلب بسرعة وبحالة ممتازة. سأتسوق مجدداً من هنا بالتأكيد!",
                  rating: 5
                },
                {
                  name: "سارة أحمد",
                  location: "قسنطينة",
                  text: "جودة المنتجات ممتازة والأسعار مناسبة جداً. أنصح بالشراء من هذا المتجر، تجربة تسوق ممتازة.",
                  rating: 5,
                  verified: true
                },
                {
                  name: "محمود خالد",
                  location: "وهران",
                  text: "طلبت عدة منتجات وكلها وصلت بحالة ممتازة. التوصيل سريع والتعامل محترم. متجر يستحق الثقة.",
                  rating: 4,
                  verified: true
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-white p-8 rounded-xl shadow-md border border-indigo-100 relative hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className={`w-5 h-5 ${i < testimonial.rating ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                    {testimonial.verified && (
                      <Badge variant="outline" className="ml-2 text-xs border-green-200 text-green-700 bg-green-50">
                        <Check className="h-3 w-3 mr-1" />
                        مشتري مؤكد
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-slate-700 mb-4 text-lg">"{testimonial.text}"</p>
                  
                  <div className="font-bold text-primary text-lg">{testimonial.name}</div>
                  <div className="text-sm text-slate-500">{testimonial.location}</div>
                  
                  <div className="absolute top-6 right-6 text-6xl text-indigo-100 font-serif">❝</div>
                </div>
              ))}
            </div>
            
            {/* Add "Join the satisfied customers" button */}
            <div className="flex justify-center mt-10">
              <Link href="/products" className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors shadow-md text-lg">
                انضم إلى عملائنا الراضين <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Enhanced Call to Action Section */}
        <section className="py-20 bg-primary text-white relative overflow-hidden">
          {/* Adding decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="container px-4 md:px-6 text-center relative">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-bold mb-4 backdrop-blur-sm shadow-sm">
              <Gift className="h-4 w-4 inline-block ml-1" />
              عروض خاصة لفترة محدودة
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">جاهز للتسوق معنا؟</h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              استمتع بتجربة تسوق فريدة مع أفضل المنتجات وأسعار منافسة وخدمة عملاء متميزة
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
              <Link href="/products" className="px-8 py-4 bg-white text-primary rounded-lg font-medium text-xl hover:bg-white/90 transition-all transform hover:scale-105 shadow-lg inline-block group">
                ابدأ التسوق الآن
                <ArrowRight className="h-5 w-5 inline-block mr-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="tel:+213698274648" className="px-8 py-4 bg-primary/20 backdrop-blur-sm text-white border border-white/30 rounded-lg font-medium text-xl hover:bg-primary/30 transition-all shadow-md">
                <Phone className="h-5 w-5 inline-block ml-2" />
                اتصل بنا
              </Link>
            </div>
            
            {/* Add benefits list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <ShieldCheck className="h-6 w-6 mx-auto mb-2 text-white" />
                <p className="text-white/90 font-medium">ضمان جودة 100%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <Truck className="h-6 w-6 mx-auto mb-2 text-white" />
                <p className="text-white/90 font-medium">شحن سريع لجميع الولايات</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <RefreshCw className="h-6 w-6 mx-auto mb-2 text-white" />
                <p className="text-white/90 font-medium">سياسة إرجاع سهلة</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Enhanced Footer with Newsletter */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container px-4 md:px-6">
          {/* Newsletter Subscription with enhanced design */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-8 mb-12 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-primary/5 blur-3xl"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium mb-3 backdrop-blur-sm">
                  <Bell className="h-3 w-3 inline-block ml-1" />
                  احصل على آخر العروض
                </span>
                <h3 className="text-2xl md:text-3xl font-bold mb-3">اشترك في نشرتنا الإخبارية</h3>
                <p className="text-slate-300">احصل على آخر العروض والتخفيضات مباشرة إلى بريدك الإلكتروني</p>
              </div>
              <div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="email" 
                    placeholder="بريدك الإلكتروني" 
                    className="px-5 py-3.5 bg-slate-700/70 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary flex-1 w-full border border-slate-600" 
                  />
                  <button className="px-6 py-3.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all transform hover:scale-105 shadow-md whitespace-nowrap">
                    اشترك الآن
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  بالضغط على زر الاشتراك، أنت توافق على سياسة الخصوصية الخاصة بنا
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">OmniMart</span>
              </div>
              <p className="text-slate-300 mb-4">
                متجر OmniMart - وجهتك الأولى للتسوق الإلكتروني بأسعار مناسبة وجودة عالية
              </p>
              <div className="flex gap-3 mt-4">
                <a href="#" className="bg-slate-800 p-2 rounded-full hover:bg-primary/20 transition-colors">
                  <Facebook className="h-5 w-5 text-white" />
                </a>
                <a href="#" className="bg-slate-800 p-2 rounded-full hover:bg-primary/20 transition-colors">
                  <Instagram className="h-5 w-5 text-white" />
                </a>
                <a href="#" className="bg-slate-800 p-2 rounded-full hover:bg-primary/20 transition-colors">
                  <Twitter className="h-5 w-5 text-white" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold mb-4 text-slate-200 text-lg">روابط سريعة</h3>
              <ul className="space-y-3">
                {[
                  { id: "home", label: "الرئيسية", href: "/" },
                  { id: "products", label: "المنتجات", href: "/products" },
                  { id: "categories", label: "التصنيفات", href: "/#categories" },
                  { id: "contact", label: "اتصل بنا", href: "/contact" }
                ].map(item => (
                  <li key={item.id}>
                    <Link href={item.href} className="text-slate-300 hover:text-white hover:underline transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4 text-slate-200 text-lg">اتصل بنا</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-slate-300">
                  <Phone className="h-5 w-5 text-primary" />
                  <span>0698274648</span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <Mail className="h-5 w-5 text-primary" />
                  <span>info@omnimart.com</span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>الجزائر</span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>متاح 24/7</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>© {new Date().getFullYear()} OmniMart. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}