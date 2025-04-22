import { NextResponse } from "next/server";
import { fetchCategories } from "@/lib/api-utils";

export async function GET() {
  try {
    const categories = await fetchCategories();
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories", message: (error as Error).message },
      { status: 500 }
    );
  }
}
