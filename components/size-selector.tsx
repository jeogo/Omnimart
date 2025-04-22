"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface SizeSelectorProps {
  sizes: string[]
}

export default function SizeSelector({ sizes }: SizeSelectorProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => (
        <button
          key={size}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium transition-colors",
            selectedSize === size
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
          )}
          onClick={() => setSelectedSize(size)}
          type="button"
        >
          {size}
        </button>
      ))}
    </div>
  )
}
