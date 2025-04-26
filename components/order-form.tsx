"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Phone, MapPin, User, Truck, ShieldCheck, Clock, Package, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createOrder } from "@/lib/api-utils"

// Inline shipping cost utility
function getShippingCost(wilaya: string): number {
  if (!wilaya) return 0
  if (
    wilaya.includes("الجزائر") ||
    wilaya.includes("البليدة") ||
    wilaya.includes("بومرداس") ||
    wilaya.includes("تيبازة") ||
    wilaya.includes("المدية") ||
    wilaya.includes("عين الدفلى")
  ) {
    return 450
  }
  if (
    wilaya.includes("وهران") ||
    wilaya.includes("قسنطينة") ||
    wilaya.includes("عنابة") ||
    wilaya.includes("سطيف") ||
    wilaya.includes("تلمسان") ||
    wilaya.includes("بجاية") ||
    wilaya.includes("تيزي وزو")
  ) {
    return 500
  }
  if (
    wilaya.includes("باتنة") ||
    wilaya.includes("بسكرة") ||
    wilaya.includes("الأغواط") ||
    wilaya.includes("الجلفة") ||
    wilaya.includes("المسيلة") ||
    wilaya.includes("خنشلة") ||
    wilaya.includes("الوادي")
  ) {
    return 550
  }
  // الجنوب
  return 700
}

const formSchema = z.object({
  name: z.string().min(3, { message: "الاسم مطلوب" }),
  phone: z.string().min(10, { message: "رقم الهاتف غير صحيح" }),
  wilaya: z.string({ required_error: "الولاية مطلوبة" }),
  city: z.string({ required_error: "المدينة مطلوبة" }),
  quantity: z.string(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// قائمة الولايات الجزائرية
const wilayas = [
  "01 - أدرار",
  "02 - الشلف",
  "03 - الأغواط",
  "04 - أم البواقي",
  "05 - باتنة",
  "06 - بجاية",
  "07 - بسكرة",
  "08 - بشار",
  "09 - البليدة",
  "10 - البويرة",
  "11 - تمنراست",
  "12 - تبسة",
  "13 - تلمسان",
  "14 - تيارت",
  "15 - تيزي وزو",
  "16 - الجزائر",
  "17 - الجلفة",
  "18 - جيجل",
  "19 - سطيف",
  "20 - سعيدة",
  "21 - سكيكدة",
  "22 - سيدي بلعباس",
  "23 - عنابة",
  "24 - قالمة",
  "25 - قسنطينة",
  "26 - المدية",
  "27 - مستغانم",
  "28 - المسيلة",
  "29 - معسكر",
  "30 - ورقلة",
  "31 - وهران",
  "32 - البيض",
  "33 - إليزي",
  "34 - برج بوعريريج",
  "35 - بومرداس",
  "36 - الطارف",
  "37 - تندوف",
  "38 - تيسمسيلت",
  "39 - الوادي",
  "40 - خنشلة",
  "41 - سوق أهراس",
  "42 - تيبازة",
  "43 - ميلة",
  "44 - عين الدفلى",
  "45 - النعامة",
  "46 - عين تموشنت",
  "47 - غرداية",
  "48 - غليزان",
  "49 - تيميمون",
  "50 - برج باجي مختار",
  "51 - أولاد جلال",
  "52 - بني عباس",
  "53 - عين صالح",
  "54 - عين قزام",
  "55 - توقرت",
  "56 - جانت",
  "57 - المغير",
  "58 - المنيعة",
]

// إضافة حالة لعرض رسالة التأكيد وتفاصيل الطلب
export default function OrderForm({
  productId,
  productName,
  productPrice,
  defaultSize,
  defaultColor,
}: {
  productId: string;
  productName: string;
  productPrice: number;
  defaultSize?: string;
  defaultColor?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shippingCost, setShippingCost] = useState(0)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [orderDetails, setOrderDetails] = useState<{
    name: string
    phone: string
    wilaya: string
    city: string
    quantity: number
    totalPrice: number
    orderNumber: string
  } | null>(null)
  const [open, setOpen] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      wilaya: "",
      city: "",
      quantity: "1",
      notes: "",
    },
  })

  const watchQuantity = form.watch("quantity")
  const watchWilaya = form.watch("wilaya")
  const quantity = Number.parseInt(watchQuantity) || 1
  const productTotal = productPrice * quantity

  // تحديث تكلفة الشحن عند تغيير الولاية
  useEffect(() => {
    if (watchWilaya) {
      setShippingCost(getShippingCost(watchWilaya))
    }
  }, [watchWilaya])

  const totalPrice = productTotal + shippingCost

  // تعديل دالة onSubmit لتعرض رسالة مخصصة تتضمن اسم العميل
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      // Generate a random order ID (6 digits)
      const orderNumber = Math.floor(100000 + Math.random() * 900000).toString();

      // Calculate total product cost
      const productCost = productPrice * Number(values.quantity);
      // Get shipping cost based on wilaya
      const deliveryCost = getShippingCost(values.wilaya);
      // Calculate total amount
      const totalAmount = productCost + deliveryCost;

      // Extract MongoDB ObjectId from the productId if it's in a URL format
      let mongoProductId = productId;
      
      // Fall back to using the URL path if productId is undefined
      if (!mongoProductId && typeof window !== 'undefined') {
        const pathParts = window.location.pathname.split('/');
        mongoProductId = pathParts[pathParts.length - 1];
      }
      
      if (typeof mongoProductId === 'string' && mongoProductId.includes('/')) {
        const parts = mongoProductId.split('/');
        mongoProductId = parts[parts.length - 1];
      }

      console.log("========== ORDER DEBUGGING ==========");
      console.log("Original Product ID:", productId);
      console.log("Window path fallback:", typeof window !== 'undefined' ? window.location.pathname : 'N/A');
      console.log("Processed Product ID for Order:", mongoProductId);
      console.log("Product ID type:", typeof mongoProductId);

      // If still no productId, use a placeholder for debugging (this should be fixed properly)
      if (!mongoProductId) {
        console.warn("WARNING: No productId found! Using placeholder for debugging purposes.");
        mongoProductId = "product-id-missing";
      }

      // Create order data matching the expected MongoDB schema
      const orderData = {
        customerName: values.name,
        customerPhone: values.phone,
        wilaya: values.wilaya,
        baladia: values.city,
        products: [
          {
            productId: mongoProductId,
            productName: productName,
            price: productPrice,
            quantity: Number(values.quantity),
            size: defaultSize || "غير محدد",
            color: defaultColor || "غير محدد"
          }
        ],
        totalAmount: totalAmount,
        shippingCost: deliveryCost,
        notes: values.notes || "",
        status: "pending"
      };

      console.log("Submitting order with data:", JSON.stringify(orderData, null, 2));
      
      // Use the API utility to send order data
      const createdOrder = await createOrder(orderData);
      console.log("Order created successfully:", createdOrder);
      
      // Show confirmation dialog with order details
      setOrderDetails({
        name: values.name,
        phone: values.phone,
        wilaya: values.wilaya,
        city: values.city,
        quantity: Number(values.quantity),
        totalPrice: totalAmount,
        orderNumber: orderNumber,
      });
      setShowConfirmation(true);
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Truck className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800">الدفع عند الاستلام</h3>
              <p className="text-sm text-amber-700">
                ادفع ثمن طلبك عند استلامه مباشرة. لا حاجة لبطاقة ائتمان أو حساب بنكي.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium">توصيل سريع</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              نوصل طلبك خلال 2-5 أيام عمل حسب منطقتك. رسوم التوصيل تبدأ من 250 د.ج.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <h3 className="font-medium">ضمان جودة المنتج</h3>
            </div>
            <p className="text-sm text-muted-foreground">نضمن لك جودة منتجاتنا 100%. يمكنك فحص المنتج قبل الدفع.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            أسعار التوصيل
          </h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between items-center py-1 border-b">
              <span>الشمال (الجزائر، البليدة، بومرداس، تيبازة...)</span>
              <span className="font-medium">250 د.ج</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span>الشمال الشرقي والغربي (وهران، قسنطينة، عنابة...)</span>
              <span className="font-medium">400 د.ج</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span>الهضاب العليا (باتنة، سطيف، بسكرة...)</span>
              <span className="font-medium">500 د.ج</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>الجنوب (أدرار، تمنراست، إليزي...)</span>
              <span className="font-medium">650 د.ج</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-gray-600" />
          معلومات الطلب
        </h3>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      الاسم الكامل
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسمك الكامل" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      رقم الهاتف
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل رقم هاتفك" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="wilaya"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      الولاية
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الولاية" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {wilayas.map((wilaya) => (
                          <SelectItem key={wilaya} value={wilaya}>
                            {wilaya}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدينة / البلدية</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم المدينة أو البلدية" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    الكمية
                  </FormLabel>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        const currentValue = Number.parseInt(field.value) || 1
                        if (currentValue > 1) {
                          field.onChange((currentValue - 1).toString())
                        }
                      }}
                    >
                      -
                    </Button>
                    <FormControl>
                      <Input
                        type="number"
                        className="w-20 text-center"
                        min="1"
                        {...field}
                        value={field.value.toString()}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        const currentValue = Number.parseInt(field.value) || 1
                        field.onChange((currentValue + 1).toString())
                      }}
                    >
                      +
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-gray-100 p-3 rounded-md">
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-gray-200">
                  <span>سعر المنتج:</span>
                  <span>{productPrice.toFixed(2)} د.ج</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200">
                  <span>الكمية:</span>
                  <span>{quantity}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200">
                  <span>المجموع الفرعي:</span>
                  <span>{productTotal.toFixed(2)} د.ج</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200">
                  <span>رسوم التوصيل:</span>
                  <span className={watchWilaya ? "font-medium" : "text-gray-500"}>
                    {watchWilaya ? `${shippingCost.toFixed(2)} د.ج` : "اختر الولاية"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 font-bold">
                  <span>المجموع الكلي:</span>
                  <span>{watchWilaya ? `${totalPrice.toFixed(2)} د.ج` : "--"}</span>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات إضافية</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أدخل عنوان التوصيل وأي ملاحظات إضافية حول الطلب"
                      className="h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    يرجى كتابة عنوان التوصيل بشكل واضح وأي تفاصيل أخرى تساعدنا في إيصال طلبك
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "جاري إرسال الطلب..." : "تأكيد الطلب والدفع عند الاستلام"}
            </Button>
          </form>
        </Form>
      </div>

      {/* AlertDialog for order confirmation */}
      <AlertDialog
        open={showConfirmation}
        onOpenChange={(open: any) => {
          if (!open) {
            setShowConfirmation(false)
            form.reset()
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              تم استلام طلبك بنجاح
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-base font-medium">
                  شكراً لك {orderDetails?.name}، تم استلام طلبك بنجاح.
                </p>

                <div className="rounded-md bg-gray-50 p-3 text-sm">
                  <div className="font-semibold mb-2">تفاصيل الطلب:</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>رقم الطلب:</span>
                      <span className="font-medium">{orderDetails?.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>المنتج:</span>
                      <span>{productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الكمية:</span>
                      <span>{orderDetails?.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>المبلغ الإجمالي:</span>
                      <span className="font-medium">{orderDetails?.totalPrice.toFixed(2)} د.ج</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-md text-blue-800">
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>سنتواصل معك قريباً على الرقم {orderDetails?.phone} لتأكيد الطلب وتحديد موعد التوصيل.</span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-green-600 hover:bg-green-700">حسناً، شكراً لكم</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
