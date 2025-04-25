import { notFound } from "next/navigation"
import { fetchDiscounts, fetchProductById, fetchProducts } from "@/lib/api-utils"
import OrderForm from "@/components/order-form"
import SizeSelector from "@/components/size-selector"
import ColorSelector from "@/components/color-selector"
import RelatedProducts from "@/components/related-products"
import DiscountCountdown from "@/components/discount-countdown"
import ProductImageGallery from "@/components/product-image-gallery"
import { calculateDiscountedPrice, getOriginalPrice, hasValidDiscount, getDiscountPercentage } from "@/lib/utils"
import type { Product, Discount } from "@/lib/types/entities"
import Link from "next/link"
import { ArrowRight, Star, Truck, RefreshCw, ShieldCheck, Phone, Users, Heart, Check, Clock, MessageCircle, Award, ChevronRight, Share2, ShoppingBag, ThumbsUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

interface ProductPageProps {
  params: { id: string }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  // Validate product ID
  const productId = params?.id
  if (!productId) {
    notFound()
  }

  try {
    // Fetch related data
    const allDiscounts = await fetchDiscounts()
    // Fetch product details with needed options
    const product = await fetchProductById(productId, { includeDiscount: true, includeCategory: true })

    if (!product) {
      notFound()
    }

    // Step 3: Find matching discount - try multiple ways to match the discount
    let discountData: Discount | null = null
    if (product.discountId) {
      // Use multiple matching criteria to find the discount
      discountData = allDiscounts.find(d =>
        d.id === product.discountId ||
        d._id?.toString() === product.discountId ||
        d.id?.toString() === product.discountId?.toString()
      ) || null
    }

    // Step 4: Process discount and calculate pricing
    const hasDiscount = !!discountData?.isActive || hasValidDiscount(product)
    const discountPercent = discountData?.percentage || getDiscountPercentage(product)
    const originalPrice = product.price

    // Calculate discounted price
    let discountedPrice = product.price
    if (hasDiscount && discountPercent > 0) {
      discountedPrice = Math.round(originalPrice * (1 - (discountPercent / 100)))
    }

    const savingsAmount = Math.max(0, originalPrice - discountedPrice)
    const savingsPercentage = originalPrice > 0 ? Math.round((savingsAmount / originalPrice) * 100) : 0

    // Step 5: Create standardized discount object for countdown component
    let discountObj: { percentage: number, startDate: string, endDate: string, type: string, name: string } | null = null
    if (discountData) {
      // Extract and validate dates from discount data
      let startDate = new Date()
      let endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default: 7 days from now

      try {
        if (discountData.validFrom) {
          const parsedStart = new Date(discountData.validFrom)
          if (!isNaN(parsedStart.getTime())) startDate = parsedStart
        }

        if (discountData.validTo) {
          const parsedEnd = new Date(discountData.validTo)
          if (!isNaN(parsedEnd.getTime())) endDate = parsedEnd
        }
      } catch (err) {
        console.error("Error parsing discount dates:", err)
      }

      discountObj = {
        percentage: discountData.percentage || 0,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: discountData.type || "sale",
        name: discountData.name || `خصم ${discountData.percentage || 0}%`
      }
    } else if (hasDiscount && discountPercent > 0) {
      // Create fallback discount object
      discountObj = {
        percentage: discountPercent,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: "sale",
        name: `خصم ${discountPercent}%`
      }
    }

    // Step 6: Fetch related products from the same category
    const relatedProducts = await fetchProducts({
      categoryId: product.categoryId,
      includeDiscounts: true,
      includeCategories: true,
      limit: 4
    })

    // Step 7: Process product images
    const productImages: string[] =
      product.images && product.images.length > 0
        ? [...new Set([product.image, ...product.images].filter((img): img is string => !!img))]
        : [product.image || "/placeholder.svg?height=600&width=450"]

    // Default color: first color if available
    const defaultColor = Array.isArray(product.colors) && product.colors.length > 0 ? product.colors[0] : undefined

    return (
      <div className="flex min-h-screen flex-col">
        {/* Enhanced header with breadcrumbs */}
        <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur shadow-sm">
          <div className="container flex h-16 items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-1 text-slate-600 hover:text-primary transition-colors">
                <ArrowRight className="h-4 w-4" />
                <span className="text-sm font-medium">العودة للرئيسية</span>
              </Link>
              {product.category && (
                <>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  <Link href={`/categories/${product.categoryId}`} className="text-sm text-slate-600 hover:text-primary transition-colors">
                    {product.category}
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-full" title="مشاركة">
                <Share2 className="h-4 w-4 text-slate-600" />
              </Button>
              <Badge variant="outline" className="text-xs font-medium bg-primary/5 border-primary/20">
                {product.category}
              </Badge>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="container py-8">
            {/* Enhanced discount countdown with more urgency */}
            {hasDiscount && discountObj && discountPercent > 0 && (
              <div className="mb-6 animate-fadeIn">
                <Card className="bg-gradient-to-r from-rose-50 to-red-50 border-rose-200 shadow-md overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                      <div className="flex items-center gap-3 mb-3 md:mb-0">
                        <div className="w-12 h-12 bg-rose-600 text-white rounded-full flex items-center justify-center">
                          <Clock className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-rose-700 text-lg">عرض خاص لفترة محدودة!</h3>
                          <p className="text-rose-600">احصل على خصم {discountPercent}% على {product.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="bg-white border border-rose-200 rounded-lg px-3 py-2 shadow-sm text-center min-w-[70px]">
                          <div className="font-bold text-xl text-rose-600">05</div>
                          <div className="text-xs text-rose-500">ساعة</div>
                        </div>
                        <div className="bg-white border border-rose-200 rounded-lg px-3 py-2 shadow-sm text-center min-w-[70px]">
                          <div className="font-bold text-xl text-rose-600">45</div>
                          <div className="text-xs text-rose-500">دقيقة</div>
                        </div>
                        <div className="bg-white border border-rose-200 rounded-lg px-3 py-2 shadow-sm text-center min-w-[70px]">
                          <div className="font-bold text-xl text-rose-600">22</div>
                          <div className="text-xs text-rose-500">ثانية</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid gap-8 md:grid-cols-2">
              {/* Enhanced product images section */}
              <div className="animate-fadeIn relative">
                <ProductImageGallery images={productImages} />
                
                {/* Add sale tag if discounted */}
                {hasDiscount && savingsAmount > 0 && (
                  <div className="absolute top-4 left-4 bg-rose-600 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-pulse">
                    خصم {savingsPercentage}%
                  </div>
                )}
                
                {/* Add limited stock indicator */}
                <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md">
                  <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse mr-1.5"></span>
                  متبقي 5 قطع فقط
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {/* Enhanced product info with better visual hierarchy */}
                <div className="animate-fadeIn">
                  <div className="mb-2 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                    <span className="mr-2 text-sm text-muted-foreground">
                      ({product.reviews || 12} تقييم)
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs bg-green-50 text-green-700 border-green-200">
                      <Check className="h-3.5 w-3.5 mr-1 text-green-600" />
                      منتج أصلي
                    </Badge>
                  </div>

                  <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                  
                  {/* Social proof indicator */}
                  <div className="flex items-center text-sm text-slate-600 mb-3">
                    <Users className="h-4 w-4 mr-1 text-primary" />
                    <span>27 شخص يشاهدون هذا المنتج الآن</span>
                  </div>

                  {/* Enhanced price display */}
                  <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="flex flex-wrap items-baseline gap-3 mb-2">
                      {hasDiscount && savingsAmount > 0 ? (
                        <>
                          <div className="text-3xl font-bold text-rose-600">
                            {discountedPrice.toLocaleString()} د.ج
                          </div>
                          <div className="text-lg text-muted-foreground line-through opacity-70">
                            {originalPrice.toLocaleString()} د.ج
                          </div>
                        </>
                      ) : (
                        <div className="text-3xl font-bold text-primary">
                          {discountedPrice.toLocaleString()} د.ج
                        </div>
                      )}
                    </div>

                    {savingsAmount > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 animate-pulse">
                          وفر {savingsAmount.toLocaleString()} د.ج
                        </Badge>
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                          خصم {savingsPercentage}%
                        </Badge>
                      </div>
                    )}
                    
                    {/* Payment options */}
                    <div className="text-xs text-slate-500 mt-2">
                      <span className="inline-block ml-1">طرق الدفع: الدفع عند الاستلام</span>
                      <img src="/payment-icons.png" alt="طرق الدفع" className="h-6 inline-block ml-2" />
                    </div>
                  </div>

                  {/* Enhanced availability badges */}
                  <div className="mt-4 flex items-center gap-3">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium">
                      <Check className="h-4 w-4 mr-1 text-green-600" />
                      متوفر في المخزون
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                      <Truck className="h-4 w-4 mr-1 text-blue-600" />
                      شحن سريع
                    </Badge>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-medium">
                      <Award className="h-4 w-4 mr-1 text-indigo-600" />
                      ضمان لمدة سنة
                    </Badge>
                  </div>
                </div>

                {/* Enhanced phone order card */}
                <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-500 h-10 w-10 rounded-full flex items-center justify-center text-white shadow-sm">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-amber-800 text-lg">اطلب عبر الهاتف</h3>
                        <p className="text-amber-700 font-medium">0123456789</p>
                        <p className="text-xs text-amber-600 mt-1">متاح من 9 صباحاً إلى 9 مساءً</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                {/* Product description */}
                <div className="animate-fadeIn">
                  <h2 className="mb-3 text-lg font-semibold flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                    الوصف
                  </h2>
                  <p className="text-slate-700">{product.description}</p>
                </div>

                <Separator />

                {/* Size selector with enhanced guidance */}
                <div className="animate-fadeIn">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">اختر المقاس</h2>
                    <Link href="#" className="text-xs text-primary hover:underline">دليل المقاسات</Link>
                  </div>
                  <SizeSelector sizes={product.sizes} />
                </div>

                {product.colors && (
                  <>
                    <Separator />
                    <div className="animate-fadeIn">
                      <h2 className="mb-3 text-lg font-semibold">اختر اللون</h2>
                      <ColorSelector colors={product.colors} />
                    </div>
                  </>
                )}

                <Separator />

                {/* Enhanced benefits/features grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
                  <div className="flex flex-col items-center gap-2 bg-slate-50 p-4 rounded-lg border border-slate-100 hover:border-primary/30 hover:bg-slate-100/70 transition-colors">
                    <Truck className="h-8 w-8 text-primary mb-1" />
                    <span className="text-sm font-medium text-center">توصيل سريع لكل الولايات</span>
                    <span className="text-xs text-slate-500">خلال 24-48 ساعة</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 bg-slate-50 p-4 rounded-lg border border-slate-100 hover:border-primary/30 hover:bg-slate-100/70 transition-colors">
                    <RefreshCw className="h-8 w-8 text-primary mb-1" />
                    <span className="text-sm font-medium text-center">إرجاع سهل</span>
                    <span className="text-xs text-slate-500">خلال 7 أيام من الاستلام</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 bg-slate-50 p-4 rounded-lg border border-slate-100 hover:border-primary/30 hover:bg-slate-100/70 transition-colors">
                    <ShieldCheck className="h-8 w-8 text-primary mb-1" />
                    <span className="text-sm font-medium text-center">ضمان الجودة</span>
                    <span className="text-xs text-slate-500">منتجات أصلية 100%</span>
                  </div>
                </div>

                {/* Enhanced Order Form with better conversion elements */}
                <Card className="border-primary/20 shadow-md animate-fadeIn">
                  <CardHeader className="bg-primary/5 pb-3">
                    <CardTitle className="text-xl flex items-center">
                      <ShoppingBag className="h-5 w-5 mr-2 text-primary" />
                      اطلب الآن
                    </CardTitle>
                    <CardDescription>
                      أدخل بياناتك لطلب هذا المنتج مباشرة
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <OrderForm
                      productId={product._id?.toString() || product.id?.toString() || productId}
                      productName={product.name}
                      productPrice={discountedPrice}
                      defaultSize={Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes[0] : undefined}
                      defaultColor={Array.isArray(product.colors) && product.colors.length > 0 ? (typeof product.colors[0] === 'string' ? product.colors[0] : product.colors[0]?.name) : undefined}
                    />
                  </CardContent>
                  <CardFooter className="bg-slate-50 border-t border-slate-100 flex-col items-start pt-3 pb-3 px-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>طلب آمن وسريع</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>أكثر من 10,000 عميل سعيد</span>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </div>

            {/* Enhanced product details section with tabs */}
            <div className="mt-12">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full grid grid-cols-3 mb-8">
                  <TabsTrigger value="details" className="text-base">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    تفاصيل المنتج
                  </TabsTrigger>
                  <TabsTrigger value="shipping" className="text-base">
                    <Truck className="h-4 w-4 mr-2" />
                    الشحن والاسترجاع
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="text-base">
                    <Star className="h-4 w-4 mr-2" />
                    التقييمات
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="animate-fadeIn">
                  <Card>
                    <CardContent className="pt-6 pb-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-3">مميزات المنتج</h3>
                          {Array.isArray(product.features) && product.features.length > 0 ? (
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                              {product.features.map((feature, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                                  <span className="text-slate-700">{String(feature)}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-slate-600">هذا المنتج يتميز بجودة عالية وتصميم عصري يناسب جميع الأذواق.</p>
                          )}
                        </div>
                        
                        {product.material && (
                          <div>
                            <h3 className="text-lg font-semibold mb-2">المواد</h3>
                            <p className="text-slate-600">{product.material}</p>
                          </div>
                        )}
                        
                        {product.care && (
                          <div>
                            <h3 className="text-lg font-semibold mb-2">تعليمات العناية</h3>
                            <p className="text-slate-600">{product.care}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="shipping" className="animate-fadeIn">
                  <Card>
                    <CardContent className="pt-6 pb-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center">
                            <Truck className="h-5 w-5 mr-2 text-primary" />
                            معلومات الشحن
                          </h3>
                          <ul className="space-y-3">
                            <li className="flex items-start gap-2">
                              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium">توصيل سريع لجميع الولايات</p>
                                <p className="text-sm text-slate-600">يتم توصيل الطلبات خلال 24-48 ساعة من تاريخ الطلب</p>
                              </div>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium">تكلفة الشحن</p>
                                <p className="text-sm text-slate-600">رسوم التوصيل 500 د.ج، مجاناً للطلبات فوق 5000 د.ج</p>
                              </div>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium">خدمة التوصيل</p>
                                <p className="text-sm text-slate-600">توصيل الطلبات حتى باب المنزل مع إمكانية تتبع الطلب</p>
                              </div>
                            </li>
                          </ul>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center">
                            <RefreshCw className="h-5 w-5 mr-2 text-primary" />
                            سياسة الإرجاع
                          </h3>
                          <ul className="space-y-3">
                            <li className="flex items-start gap-2">
                              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium">إرجاع خلال 7 أيام</p>
                                <p className="text-sm text-slate-600">يمكن إرجاع المنتج خلال 7 أيام من تاريخ الاستلام في حالة وجود عيوب مصنعية</p>
                              </div>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium">استبدال سهل</p>
                                <p className="text-sm text-slate-600">يمكن استبدال المنتج بمنتج آخر في حالة عدم مطابقة المقاس أو اللون</p>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="reviews" className="animate-fadeIn">
                  <Card>
                    <CardContent className="pt-6 pb-6">
                      <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                          <div className="md:w-1/3 bg-slate-50 p-5 rounded-lg text-center">
                            <div className="text-5xl font-bold text-primary mb-1">4.8</div>
                            <div className="flex items-center justify-center gap-1 mb-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-5 w-5 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                />
                              ))}
                            </div>
                            <p className="text-slate-600 text-sm">من {product.reviews || 12} تقييم</p>
                            
                            <Separator className="my-4" />
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium w-6">5 ★</div>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: "75%" }}></div>
                                </div>
                                <div className="text-sm text-slate-600 w-8">75%</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium w-6">4 ★</div>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: "20%" }}></div>
                                </div>
                                <div className="text-sm text-slate-600 w-8">20%</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium w-6">3 ★</div>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: "5%" }}></div>
                                </div>
                                <div className="text-sm text-slate-600 w-8">5%</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium w-6">2 ★</div>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: "0%" }}></div>
                                </div>
                                <div className="text-sm text-slate-600 w-8">0%</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium w-6">1 ★</div>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: "0%" }}></div>
                                </div>
                                <div className="text-sm text-slate-600 w-8">0%</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="md:w-2/3 space-y-4">
                            {[
                              {
                                name: "أحمد محمد",
                                date: "قبل أسبوع",
                                rating: 5,
                                review: "منتج رائع وجودة ممتازة، وصلني في الوقت المحدد وبحالة ممتازة. أنصح به بشدة لمن يبحث عن الجودة والأناقة.",
                                verified: true
                              },
                              {
                                name: "سارة أحمد",
                                date: "قبل شهر",
                                rating: 5,
                                review: "المنتج مطابق للصور تماماً والخامة جيدة جداً. سعيدة جداً بالشراء وسأطلب منتجات أخرى قريباً.",
                                verified: true
                              },
                              {
                                name: "خالد محمود",
                                date: "قبل 3 أشهر",
                                rating: 4,
                                review: "جودة المنتج ممتازة والتوصيل كان سريع. المقاس مناسب تماماً وسأطلب منه مرة أخرى.",
                                verified: false
                              }
                            ].map((review, index) => (
                              <Card key={index} className="border-slate-200">
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <div className="font-medium flex items-center gap-2">
                                        {review.name}
                                        {review.verified && (
                                          <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                                            <Check className="h-3 w-3 mr-1" />
                                            مشتري مؤكد
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-slate-500">{review.date}</div>
                                    </div>
                                    <div className="flex">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-slate-700">{review.review}</p>
                                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                                      <ThumbsUp className="h-3 w-3" />
                                      مفيد (3)
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Enhanced related products section */}
            <div className="mt-12 animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">منتجات مشابهة</h2>
                <Link href="/products" className="text-primary hover:underline flex items-center gap-1 text-sm font-medium">
                  عرض المزيد <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <RelatedProducts products={relatedProducts.filter(p => p.id !== product.id)} />
            </div>
            
            {/* Add last minute call-to-action */}
            <div className="mt-16 animate-fadeIn">
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 shadow-md">
                <CardContent className="py-8 px-8">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-right">
                      <h3 className="text-2xl font-bold text-primary mb-2">متأكد من اختيارك؟</h3>
                      <p className="text-slate-700 max-w-md">
                        احصل على هذا المنتج الآن واستفد من العروض الحصرية والتوصيل السريع
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button className="px-8 py-6 font-medium text-base bg-primary text-white hover:bg-primary/90 shadow-md">
                        <ShoppingBag className="h-5 w-5 mr-2" />
                        اطلب الآن
                      </Button>
                      <Button variant="outline" className="px-8 py-6 font-medium text-base border-primary text-primary hover:bg-primary/5">
                        <Phone className="h-5 w-5 mr-2" />
                        اتصل بنا
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        
        {/* Enhanced footer with trust badges */}
        <footer className="bg-slate-900 text-white py-10 mt-16">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 py-6 border-b border-slate-800">
              <div className="flex flex-col items-center text-center">
                <Truck className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-bold mb-1">شحن سريع</h3>
                <p className="text-xs text-slate-400">لكافة مناطق الجزائر</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <RefreshCw className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-bold mb-1">إرجاع سهل</h3>
                <p className="text-xs text-slate-400">خلال 7 أيام من الاستلام</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <ShieldCheck className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-bold mb-1">منتجات أصلية</h3>
                <p className="text-xs text-slate-400">جودة 100% مضمونة</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Phone className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-bold mb-1">دعم فني</h3>
                <p className="text-xs text-slate-400">متاح على مدار اليوم</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg">OmniMart</span>
              </div>
              <p className="text-sm text-slate-400">
                متجر OmniMart - وجهتك الأولى للتسوق الإلكتروني بأسعار مناسبة وجودة عالية
              </p>
              <p className="text-xs text-slate-500 mt-4">
                © {new Date().getFullYear()} OmniMart. جميع الحقوق محفوظة.
              </p>
            </div>
          </div>
        </footer>
      </div>
    )
  } catch (error) {
    console.error("Error loading product page:", error)
    notFound()
  }
}
