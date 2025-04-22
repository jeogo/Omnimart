"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface ProductImageGalleryProps {
  images: string[]
}

export default function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomLevel > 1) {
      const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
      const x = (e.clientX - left) / width
      const y = (e.clientY - top) / height

      setZoomPosition({ x, y })
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-2 z-10 h-7 w-7 bg-white/80 backdrop-blur-sm"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={images[currentIndex] || "/placeholder.svg"}
                alt="صورة المنتج"
                fill
                className="object-contain"
                priority
              />
            </div>
          </DialogContent>
        </Dialog>

        <div
          className="relative h-full w-full overflow-hidden"
          onMouseMove={handleMouseMove}
          style={{
            cursor: zoomLevel > 1 ? "zoom-out" : "zoom-in",
          }}
          onClick={() => setZoomLevel(zoomLevel === 1 ? 2 : 1)}
        >
          <Image
            src={images[currentIndex] || "/placeholder.svg"}
            alt="صورة المنتج"
            fill
            className="object-contain transition-transform duration-300"
            style={{
              transform:
                zoomLevel > 1
                  ? `scale(${zoomLevel}) translate(${(0.5 - zoomPosition.x) * -50}%, ${(0.5 - zoomPosition.y) * -50}%)`
                  : "scale(1)",
            }}
            priority
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 h-7 w-7 bg-white/80 backdrop-blur-sm"
          onClick={handlePrevious}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 h-7 w-7 bg-white/80 backdrop-blur-sm"
          onClick={handleNext}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((image, index) => (
          <button
            key={index}
            className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all ${
              index === currentIndex ? "border-primary" : "border-transparent"
            }`}
            onClick={() => handleThumbnailClick(index)}
          >
            <Image src={image || "/placeholder.svg"} alt={`صورة مصغرة ${index + 1}`} fill className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
