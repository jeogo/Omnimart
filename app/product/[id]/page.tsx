import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Star, Truck, RefreshCw, ShieldCheck, Phone } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchProductById, fetchProducts, fetchDiscounts } from "@/lib/api-utils"
import OrderForm from "@/components/order-form"
import SizeSelector from "@/components/size-selector"
import ColorSelector from "@/components/color-selector"
import RelatedProducts from "@/components/related-products"
import DiscountCountdown from "@/components/discount-countdown"
import ProductImageGallery from "@/components/product-image-gallery"
import { calculateDiscountedPrice, getOriginalPrice, hasValidDiscount, getDiscountPercentage } from "@/lib/utils" // Fixed import path
import type { Product, Discount } from "@/lib/types/entities"

interface ProductPageProps {
  params: {
    id: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  // Ensure we have a product ID
  const productId = params?.id;
  if (!productId) {
    notFound();
  }
  
  try {
    // Step 1: Pre-fetch all discounts to ensure we have the complete list
    const allDiscounts = await fetchDiscounts();

    // Step 2: Fetch the product with all necessary data
    let product = await fetchProductById(productId, {
      includeDiscount: true,
      includeCategory: true
    });
    
    // If product still not found, return 404
    if (!product) {
      notFound();
    }
    
    // Step 3: Find matching discount - try multiple ways to match the discount
    let discountData = null;
    if (product.discountId) {
      // Use multiple matching criteria to find the discount
      discountData = allDiscounts.find(d => 
        d.id === product.discountId || 
        d._id?.toString() === product.discountId ||
        d.id?.toString() === product.discountId?.toString()
      );
    }
    
    // Step 4: Process discount and calculate pricing
    const hasDiscount = !!discountData?.isActive || hasValidDiscount(product);
    const discountPercent = discountData?.percentage || getDiscountPercentage(product);
    const originalPrice = product.price;
    
    // Calculate discounted price
    let discountedPrice = product.price;
    if (hasDiscount && discountPercent > 0) {
      discountedPrice = Math.round(originalPrice * (1 - (discountPercent / 100)));
    }

    const savingsAmount = Math.max(0, originalPrice - discountedPrice);
    const savingsPercentage = originalPrice > 0 ? Math.round((savingsAmount / originalPrice) * 100) : 0;
    
    // Step 5: Create standardized discount object for countdown component
    let discountObj = null;
    if (discountData) {
      // Extract and validate dates from discount data
      let startDate = new Date();
      let endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default: 7 days from now
      
      try {
        if (discountData.validFrom) {
          const parsedStart = new Date(discountData.validFrom);
          if (!isNaN(parsedStart.getTime())) startDate = parsedStart;
        }
        
        if (discountData.validTo) {
          const parsedEnd = new Date(discountData.validTo);
          if (!isNaN(parsedEnd.getTime())) endDate = parsedEnd;
        }
      } catch (err) {
        console.error("Error parsing discount dates:", err);
      }
      
      discountObj = {
        percentage: discountData.percentage || 0,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: discountData.type || "sale",
        name: discountData.name || `خصم ${discountData.percentage || 0}%`
      };
    } else if (hasDiscount && discountPercent > 0) {
      // Create fallback discount object
      discountObj = {
        percentage: discountPercent,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: "sale",
        name: `خصم ${discountPercent}%`
      };
    }

    // Step 6: Fetch related products from the same category
    const relatedProducts = await fetchProducts({
      categoryId: product.categoryId,
      includeDiscounts: true,
      includeCategories: true,
      limit: 4
    });

    // Step 7: Process product images
    const productImages: string[] =
      product.images && product.images.length > 0
        ? [...new Set([product.image, ...product.images].filter((img): img is string => !!img))]
        : [product.image || "/placeholder.svg?height=600&width=450"];
    

    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                <span className="text-sm">العودة للرئيسية</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
          
            </div>
          </div>
        </header>
        <main className="flex-1">
          <div className="container py-6">
            {hasDiscount && discountObj && discountPercent > 0 && (
              <div className="mb-6 animate-fadeIn">
                <DiscountCountdown discount={discountObj} productName={product.name} />
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <ProductImageGallery images={productImages} />

              <div className="flex flex-col gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                    <span className="mr-2 text-xs text-muted-foreground">
                      ({product.reviews || 12} تقييم)
                    </span>
                  </div>
                  
                  <h1 className="text-2xl font-bold">{product.name}</h1>

                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <div className={`text-2xl font-bold ${hasDiscount && savingsAmount > 0 ? 'text-rose-600' : 'text-primary'}`}>
                        {discountedPrice.toLocaleString()} د.ج
                      </div>
                      {hasDiscount && savingsAmount > 0 && (
                        <div className="text-base text-muted-foreground line-through opacity-70">
                          {originalPrice.toLocaleString()} د.ج
                        </div>
                      )}
                    </div>
                    
                    {savingsAmount > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 animate-pulse">
                          وفر {savingsAmount.toLocaleString()} د.ج
                        </Badge>
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                          خصم {savingsPercentage}%
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      متوفر في المخزون
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      شحن سريع
                    </Badge>
                  </div>
                </div>

                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-amber-600" />
                      <div>
                        <h3 className="font-medium text-amber-800">اطلب عبر الهاتف</h3>
                        <p className="text-sm text-amber-700">0123456789</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                <div className="animate-fadeIn">
                  <h2 className="mb-2 text-base font-semibold">الوصف</h2>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </div>

                <Separator />

                <div className="animate-fadeIn">
                  <h2 className="mb-3 text-base font-semibold">اختر المقاس</h2>
                  <SizeSelector sizes={product.sizes} />
                </div>

                {product.colors && (
                  <>
                    <Separator />
                    <div className="animate-fadeIn">
                      <h2 className="mb-3 text-base font-semibold">اختر اللون</h2>
                      <ColorSelector colors={product.colors} />
                    </div>
                  </>
                )}

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn">
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                    <Truck className="h-4 w-4 text-primary" />
                    <span className="text-xs">توصيل لجميع الولايات</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                    <RefreshCw className="h-4 w-4 text-primary" />
                    <span className="text-xs">إرجاع خلال 7 أيام</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-xs">ضمان الجودة 100%</span>
                  </div>
                </div>

                <Separator />

                <Tabs defaultValue="order" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="order">طلب المنتج</TabsTrigger>
                    <TabsTrigger value="details">تفاصيل إضافية</TabsTrigger>
                  </TabsList>
                  <TabsContent value="order" className="animate-fadeIn">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">اطلب الآن</CardTitle>
                        <CardDescription>أدخل بياناتك لطلب هذا المنتج</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <OrderForm productId={product.id} productName={product.name} productPrice={discountedPrice} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="details" className="animate-fadeIn">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">تفاصيل المنتج</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold">المميزات</h3>
                            <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground text-sm">
                              {product.features.map((feature, index) => (
                                <li key={index}>{feature}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h3 className="font-semibold">المواد</h3>
                            <p className="mt-2 text-muted-foreground text-sm">{product.material}</p>
                          </div>
                          <div>
                            <h3 className="font-semibold">تعليمات العناية</h3>
                            <p className="mt-2 text-muted-foreground text-sm">{product.care}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div className="mt-10 animate-fadeIn">
              <h2 className="mb-4 text-xl font-bold">منتجات مشابهة</h2>
              <RelatedProducts products={relatedProducts.filter(p => p.id !== product.id)} />
            </div>
          </div>
        </main>
        <footer className="border-t bg-muted py-4 mt-8">
          <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
            <p className="text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} متجر الأناقة للأزياء الرجالية. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-2">
              <a href="tel:+213123456789" className="text-xs text-muted-foreground hover:text-primary">
                <Phone className="h-3 w-3 inline-block mr-1" />
                0123456789
              </a>
            </div>
          </div>
        </footer>
      </div>
    )
  } catch (error) {
    console.error("Error loading product page:", error);
    notFound();
  }
}
