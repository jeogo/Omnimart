"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Color {
  name: string
  value: string
}

interface ColorSelectorProps {
  colors: Color[]
}

export default function ColorSelector({ colors }: ColorSelectorProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <button
          key={color.name}
          className={cn(
            "relative flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
            selectedColor === color.name ? "ring-2 ring-primary ring-offset-1" : "border-input",
          )}
          style={{ backgroundColor: color.value }}
          onClick={() => setSelectedColor(color.name)}
          type="button"
          title={color.name}
        >
          {selectedColor === color.name && (
            <Check className={cn("h-3 w-3", getContrastColor(color.value) === "dark" ? "text-white" : "text-black")} />
          )}
        </button>
      ))}
    </div>
  )
}

// Helper function to determine if text should be dark or light based on background color
function getContrastColor(hexColor: string): "light" | "dark" {
  // Convert hex to RGB
  const r = Number.parseInt(hexColor.slice(1, 3), 16)
  const g = Number.parseInt(hexColor.slice(3, 5), 16)
  const b = Number.parseInt(hexColor.slice(5, 7), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? "light" : "dark"
}
