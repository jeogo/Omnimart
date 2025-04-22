import { NextResponse } from "next/server";
import { fetchProducts } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId') || undefined;
    const isNew = url.searchParams.get('isNew') === 'true';
    const hasDiscount = url.searchParams.get('hasDiscount') === 'true';
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined;
    
    // Fetch products with various options
    const products = await fetchProducts({
      includeDiscounts: true,
      includeCategories: true,
      categoryId: categoryId as string | undefined,
      isNew,
      hasDiscount,
      limit
    });
    
    
    return NextResponse.json(products);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products", message: (error as Error).message },
      { status: 500 }
    );
  }
}
