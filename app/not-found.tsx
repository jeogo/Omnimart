import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="container flex max-w-md flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <h2 className="text-2xl font-semibold">الصفحة غير موجودة</h2>
        <p className="text-muted-foreground">عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
        <Button asChild>
          <Link href="/">العودة للصفحة الرئيسية</Link>
        </Button>
      </div>
    </div>
  )
}
