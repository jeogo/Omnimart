"use client"

import { useState, useEffect } from "react"
import { Timer, Tag, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface DiscountCountdownProps {
  discount: {
    percentage: number
    startDate: string
    endDate: string
    type: string
    name?: string
  }
  productName?: string
}

export default function DiscountCountdown({ discount, productName = "" }: DiscountCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [progress, setProgress] = useState(100)
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    // Enhanced validation for discount data
    if (!discount || typeof discount !== 'object' || discount.percentage <= 0) {
      console.error("Invalid discount data:", discount);
      setIsValid(false);
      return;
    }

    const calculateTimeLeft = () => {
      try {
        
        // Parse dates safely with comprehensive error handling
        let startDate, endDate, now;
        
        try {
          startDate = new Date(discount.startDate);
          endDate = new Date(discount.endDate);
          now = new Date();
          
          // Validate date objects
          if (isNaN(startDate.getTime())) {
            console.warn("Invalid start date, using fallback");
            startDate = new Date(Date.now() - 86400000); // 1 day ago
          }
          
          if (isNaN(endDate.getTime())) {
            console.warn("Invalid end date, using fallback");
            endDate = new Date(Date.now() + 7 * 86400000); // 7 days from now
          }
          
        } catch (e) {
          console.error("Error parsing dates, using fallbacks:", e);
          startDate = new Date(Date.now() - 86400000); // 1 day ago
          endDate = new Date(Date.now() + 7 * 86400000); // 7 days from now
          now = new Date();
        }
        
        // Ensure the discount period is at least 1 day
        if (endDate <= startDate) {
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        }
        
        // Calculate total promotion duration and elapsed time
        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsedTime = now.getTime() - startDate.getTime();
        const remainingTime = endDate.getTime() - now.getTime();
        
        // If discount has expired
        if (remainingTime <= 0) {
          setIsValid(false);
          return;
        }
        
        const timeProgress = Math.max(0, Math.min(100, (elapsedTime / totalDuration) * 100));
        setProgress(100 - timeProgress); // Show remaining percentage
        
        // Calculate time units
        setTimeLeft({
          days: Math.floor(remainingTime / (1000 * 60 * 60 * 24)),
          hours: Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((remainingTime % (1000 * 60)) / 1000),
        });
      } catch (error) {
        console.error("Error in discount countdown:", error);
        setIsValid(false);
      }
    }

    // Initialize and set up interval
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [discount]);

  // Don't show if the discount is not valid
  if (!isValid) {
    return null;
  }

  // Format the discount end date with fallback
  let formattedEndDate = "قريباً";
  try {
    const endDate = new Date(discount.endDate);
    if (!isNaN(endDate.getTime())) {
      formattedEndDate = endDate.toLocaleDateString('ar', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch (e) {
    console.error("Error formatting date:", e);
  }

  return (
    <Card className="bg-gradient-to-r from-amber-50 to-rose-50 border-amber-200 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-rose-600" />
            <h3 className="font-semibold text-lg text-rose-700">
              {discount.name || `خصم ${discount.percentage}%`}
              {productName && <span className="text-sm font-normal mr-1">على {productName}</span>}
            </h3>
          </div>
          <Badge className="bg-rose-600 text-white hover:bg-rose-700">
            {discount.percentage}% خصم
          </Badge>
        </div>
        
        <div className="flex items-center gap-3 mb-3">
          <Timer className="h-5 w-5 text-amber-600" />
          <div className="bg-white px-3 py-1.5 rounded-md shadow-sm">
            <p className="text-base font-mono font-bold text-amber-800 tracking-wider flex gap-2 items-center justify-center">
              <span>{String(timeLeft.days).padStart(2, '0')}:</span>
              <span>{String(timeLeft.hours).padStart(2, '0')}:</span>
              <span>{String(timeLeft.minutes).padStart(2, '0')}:</span>
              <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
            </p>
          </div>
          <div className="text-sm text-amber-800">
            <div className="font-medium">ينتهي العرض قريباً</div>
            <div className="text-xs">لا تفوت الفرصة!</div>
          </div>
        </div>
        
        <Progress value={progress} className="h-2 bg-amber-100" />
        
        <div className="mt-2 flex items-start gap-2 text-amber-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="text-xs">
            العرض ساري حتى {formattedEndDate}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
