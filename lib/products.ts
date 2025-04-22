import type { Product } from "@/lib/types/entities"
import { getDb } from "@/lib/db"

export async function fetchProducts(): Promise<Product[]> {
  try {
    const db = await getDb()
    
    // Check if the 'products' collection exists
    const collections = await db.listCollections({ name: 'products' }).toArray()
    if (collections.length === 0) {
      console.log("Products collection doesn't exist yet")
      return []
    }
    
    // Fetch products from the collection with error handling
    const products = await db.collection("products").find({}).toArray()
    console.log(`Fetched ${products.length} products from the database`)
    
    // Return products cast to Product type
    return products as unknown as Product[]
  } catch (error) {
    console.error("Error fetching products:", error)
    // Return an empty array in case of error
    return []
  }
}

// Function to add mock products to the database (for testing)
export async function addMockProducts(): Promise<void> {
  try {
    const db = await getDb()
    
    // Check if products collection already has data
    const count = await db.collection("products").countDocuments()
    if (count > 0) {
      console.log(`Products collection already has ${count} documents`)
      return
    }
    
    // Simple mock product for testing
    const mockProducts = [
      {
        id: "1",
        name: "قميص أزرق كلاسيكي",
        description: "قميص أزرق كلاسيكي مناسب للمناسبات الرسمية وغير الرسمية",
        price: 2500,
        oldPrice: 3000,
        categoryId: "shirts",
        category: "قمصان",
        images: [],
        image: "/images/products/shirt-1.jpg",
        features: ["قطن 100%", "مناسب للارتداء اليومي", "سهل الغسيل"],
        material: "قطن",
        care: "غسيل آلي بماء بارد، لا تستخدم المبيض",
        sizes: ["S", "M", "L", "XL"],
        colors: [
          { name: "أزرق", value: "#1e40af" },
          { name: "أبيض", value: "#ffffff" }
        ],
        isNew: true,
        discount: { percentage: 15, startDate: "2023-01-01", endDate: "2024-12-31", type: "sale" },
        rating: 4.5,
        reviews: 12,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    // Insert mock products
    await db.collection("products").insertMany(mockProducts)
    console.log(`Added ${mockProducts.length} mock products to the database`)
  } catch (error) {
    console.error("Error adding mock products:", error)
  }
}
