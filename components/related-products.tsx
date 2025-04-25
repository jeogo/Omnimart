"use client";
import { Product } from "@/lib/types/index";
import ProductCard from "@/components/product-card";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

interface RelatedProductsProps {
  products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  // Ensure products have required properties for display
  const safeProducts = products.map(product => ({
    ...product,
    description: product.description || "", // Ensure description is a string
  }));

  if (!safeProducts || safeProducts.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-lg">
        <p className="text-slate-500">لا توجد منتجات مشابهة</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={20}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 4 },
        }}
        className="related-products-swiper"
      >
        {safeProducts.map((product) => (
          <SwiperSlide key={product._id || product.id}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
