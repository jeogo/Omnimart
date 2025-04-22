import { Phone, Truck, Clock, ShoppingBag, MapPin, Tag } from "lucide-react"
import { fetchProducts, fetchCategories, fetchDiscounts } from "@/lib/api-utils"
import ProductCard from "@/components/product-card"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { Product, Category, Discount } from "@/lib/types/entities"
import { hasValidDiscount, getDiscountPercentage } from "@/lib/utils"

export default async function Home() {
  let products: Product[] = [];
  let categories: Category[] = [];
  let discounts: Discount[] = [];

  try {
    const [productsData, categoriesData, discountsData] = await Promise.all([
      fetchProducts({ includeDiscounts: true, includeCategories: true }),
      fetchCategories(),
      fetchDiscounts()
    ]);
    products = productsData;
    categories = categoriesData;
    discounts = discountsData;
    
  } catch (error) {
    console.error("Error in Home component:", error);
  }

  // Enhance products with discount info
  const processedProducts = products.map(product => {
    // Find matching discount directly from the discounts array
    
    // Check all possible ID formats
    let matchingDiscount = null;
    if (product.discountId) {
      // Try direct matching
      matchingDiscount = discounts.find(d => 
        d.id === product.discountId || 
        d._id === product.discountId ||
        d.id?.toString() === product.discountId?.toString()
      );
      

    }
    
    // Determine if product has valid discount
    const hasDiscount = !!matchingDiscount && (matchingDiscount.isActive !== false);
    
    // Get discount percentage
    const discountPercent = hasDiscount && matchingDiscount ? matchingDiscount.percentage : 0;
    
    // Calculate original and discounted prices
    let originalPrice = product.price;
    let discountedPrice = product.price;
    
    if (hasDiscount && discountPercent > 0) {
      // Apply the discount percentage to calculate the discounted price
      discountedPrice = Math.round(originalPrice * (1 - (discountPercent / 100)));
    }

    // Calculate savings
    const savingsAmount = Math.max(0, originalPrice - discountedPrice);
    const savingsPercentage = originalPrice ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) : 0;

    return {
      ...product,
      processedData: {
        hasDiscount,
        discountPercent,
        originalPrice,
        discountedPrice,
        savingsAmount,
        savingsPercentage,
        matchingDiscount
      }
    };
  });

  // Group products by category
  const productsByCategory = categories.reduce((acc: Record<string, any[]>, category) => {
    acc[category.id] = processedProducts.filter(p => p.categoryId === category.id);
    return acc;
  }, {});

  // Best sellers: top 4 by rating
  const bestsellers = [...processedProducts]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 4);

  // Discounted products
  const discountedProducts = processedProducts.filter(p => p.processedData.hasDiscount);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="container flex h-16 items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold tracking-tight">OmniMart</span>
            </a>
          </div>
          <nav className="flex items-center gap-4">
            <a href="tel:+213123456789" className="flex items-center gap-1.5 text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full hover:bg-primary/20 transition-colors">
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">0123456789</span>
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Best Sellers */}
        <section className="py-10 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
              <div>
                <h4 className="text-primary font-medium mb-2">المنتجات المميزة</h4>
                <h2 className="text-2xl md:text-3xl font-bold">الأكثر مبيعاً</h2>
              </div>
            </div>
            {bestsellers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {bestsellers.map((product, index) => (
                  <div key={product.id} className="animate-fadeIn" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-100 rounded-lg">
                <p className="text-gray-500">لا توجد منتجات متاحة حالياً</p>
              </div>
            )}
          </div>
        </section>

        {/* Main Categories */}
        <div className="container py-12">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
            <div>
              <h4 className="text-primary font-medium mb-2">مجموعة منتجاتنا</h4>
              <h2 className="text-2xl md:text-3xl font-bold">تسوق حسب الفئة</h2>
            </div>
          </div>
          {categories.length > 0 ? (
            <Tabs defaultValue="all" className="mb-8">
              <TabsList className="flex w-full flex-wrap justify-start mb-6 bg-transparent p-0 h-auto border-b">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 text-sm font-medium border-b-2 border-transparent"
                >
                  الكل
                  <Badge className="mr-2 bg-primary/10 text-primary hover:bg-primary/20 ml-2">{products.length}</Badge>
                </TabsTrigger>
                {categories.map(category => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 text-sm font-medium border-b-2 border-transparent"
                  >
                    {category.name}
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 ml-2">
                      {productsByCategory[category.id]?.length || 0}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="all" className="mt-0">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-8">
                  {processedProducts.length > 0 ? (
                    processedProducts.map((product, index) => (
                      <div key={product.id} className="animate-fadeIn" style={{ animationDelay: `${(index % 5 + 1) * 100}ms` }}>
                        <ProductCard product={product} />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-gray-500">لا توجد منتجات متاحة حالياً</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              {categories.map(category => (
                <TabsContent key={category.id} value={category.id} className="mt-0">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-8">
                    {productsByCategory[category.id]?.length > 0 ? (
                      productsByCategory[category.id].map((product, index) => (
                        <div key={product.id} className="animate-fadeIn" style={{ animationDelay: `${(index % 5 + 1) * 100}ms` }}>
                          <ProductCard product={product} />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <p className="text-gray-500">لا توجد منتجات في هذه الفئة حالياً</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="text-center py-12 bg-gray-100 rounded-lg">
              <p className="text-gray-500">لا توجد فئات متاحة حالياً</p>
            </div>
          )}
        </div>

        {/* Special Offers */}
        <section className="py-12 bg-gradient-to-br from-rose-50 to-amber-50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-10">
              <h4 className="text-primary font-medium mb-2">لفترة محدودة</h4>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">العروض والتخفيضات</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                استفد من أحدث العروض والخصومات على منتجاتنا المميزة. 
                {discounts.length > 0 && (
                  <span> خصم يصل إلى {Math.max(...discounts.map(d => d.percentage))}% على المنتجات المختارة</span>
                )}
              </p>
            </div>
            {discountedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {discountedProducts.slice(0, 4).map((product, index) => (
                  <div key={product.id} className="animate-fadeIn" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                    <div className="relative">
                      {product.processedData.matchingDiscount && (
                        <div className="absolute right-2 bottom-2 z-10">
                          <Badge className="bg-amber-500 text-white hover:bg-amber-600">
                            {product.processedData.matchingDiscount.name}
                          </Badge>
                        </div>
                      )}
                      <ProductCard product={product} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/50 rounded-lg">
                <Tag className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                <p className="text-amber-800">لا توجد عروض متاحة حالياً</p>
                <p className="text-sm text-amber-600 mt-2">ترقبوا العروض القادمة قريباً</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <footer className="border-t bg-slate-900 text-white py-10">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">OmniMart</span>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                متجر متخصص في الأزياء الرجالية العصرية بأسعار مناسبة وجودة عالية
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-slate-300 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path>
                  </svg>
                </a>
                <a href="#" className="text-slate-300 hover:text-white">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 01 1.772 1.153 4.902 4.902 0 01 1.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 01 1.153-1.772A4.902 4.902 0 01 5.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63z"></path>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">روابط سريعة</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-300 hover:text-white">الرئيسية</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white">المنتجات</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white">عن المتجر</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white">اتصل بنا</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">اتصل بنا</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-slate-300">
                  <Phone className="h-4 w-4" />
                  <span>0123456789</span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <MapPin className="h-4 w-4" />
                  <span>الجزائر العاصمة، الجزائر</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>© {new Date().getFullYear()} OmniMart. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
