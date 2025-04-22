import { Product, Category, Discount, Order } from "@/lib/types/entities";
import { ObjectId } from "mongodb";

/**
 * Maps MongoDB product document to our Product interface
 */
export function mapMongoProductToProduct(doc: any): Product {
  try {
    return {
      id: doc._id?.toString() || "",
      name: doc.name || "",
      description: doc.description || "",
      price: doc.price || 0,
      oldPrice: doc.oldPrice,
      categoryId: doc.categoryId?.toString() || "",
      category: doc.category || "",
      images: Array.isArray(doc.images) ? doc.images : [],
      image: Array.isArray(doc.images) && doc.images.length > 0 ? doc.images[0] : "",
      features: Array.isArray(doc.features) ? doc.features : [],
      material: doc.material || "",
      care: doc.care || "",
      sizes: Array.isArray(doc.sizes) ? doc.sizes : [],
      colors: Array.isArray(doc.colors) ? doc.colors : [],
      isNew: doc.isNewProduct === true,
      discount: undefined, // Will be populated by enrichProductsWithDiscounts
      rating: doc.rating || 0,
      reviews: doc.reviews || 0,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
      discountId: doc.discountId?.toString()
    };
  } catch (error) {
    console.error("Error mapping product:", error, doc);
    // Return a minimal valid product
    return {
      id: doc._id?.toString() || "error-id",
      name: doc.name || "Error loading product",
      description: "",
      price: 0,
      categoryId: "",
      images: [],
      features: [],
      material: "",
      care: "",
      sizes: [],
      rating: 0,
      reviews: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

/**
 * Maps MongoDB category document to our Category interface
 */
export function mapMongoCategoryToCategory(doc: any): Category {
  try {
    return {
      id: doc._id?.toString() || "",
      name: doc.name || "",
      description: doc.description || "",
      slug: doc.slug || "",
      image: doc.image || "",
      parentId: doc.parentId?.toString(),
      isActive: doc.isActive !== false, // default to true if not specified
    };
  } catch (error) {
    console.error("Error mapping category:", error, doc);
    return {
      id: doc._id?.toString() || "error-id",
      name: doc.name || "Error loading category",
      description: "",
      slug: "",
      image: "",
      isActive: true
    };
  }
}

/**
 * Maps a MongoDB document to the Discount interface
 */
export function mapMongoDiscountToDiscount(doc: any): Discount {
  return {
    _id: doc._id || null,
    id: doc._id ? doc._id.toString() : (doc.id || ""),
    name: doc.name || "خصم",
    percentage: doc.percentage || 0,
    validFrom: doc.validFrom || new Date(),
    validTo: doc.validTo || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    type: doc.type || "sale",
    applicableProducts: doc.applicableProducts || [],
    applicableCategories: doc.applicableCategories || [],
    minPurchase: doc.minPurchase || 0,
    code: doc.code || "",
    isActive: doc.isActive !== false
  };
}

// Helper function to create an expired discount (used in the getExpiredDiscount function)
export function createExpiredDiscount(): Discount {
  return {
    _id: null,
    id: "expired",
    name: "انتهى العرض",
    percentage: 0,
    validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    validTo: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),    // Yesterday
    type: "sale",
    applicableProducts: [],
    applicableCategories: [],
    minPurchase: 0,
    code: "",
    isActive: false
  };
}

/**
 * Maps MongoDB order document to our Order interface
 */
export function mapMongoOrderToOrder(doc: any): Order {
  try {
    return {
      id: doc._id?.toString() || "",
      customerName: doc.customerName || "",
      customerPhone: doc.customerPhone || "",
      customerAddress: doc.customerAddress || "",
      wilaya: doc.wilaya || "",
      products: Array.isArray(doc.products) ? doc.products : [],
      totalAmount: doc.totalAmount || 0,
      shippingCost: doc.shippingCost || 0,
      status: doc.status || "pending",
      notes: doc.notes,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
    };
  } catch (error) {
    console.error("Error mapping order:", error, doc);
    return {
      id: doc._id?.toString() || "error-id",
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      wilaya: "",
      products: [],
      totalAmount: 0,
      shippingCost: 0,
      status: "pending",
      createdAt: new Date()
    };
  }
}

/**
 * Adds discount information to products
 */
export function enrichProductsWithDiscounts(
  products: Product[], 
  discounts: Discount[]
): Product[] {
  return products.map(product => {
    if (product.discountId) {
      const discount = discounts.find(d => d.id === product.discountId);
      if (discount && discount.isActive) {
        // Calculate the oldPrice if it doesn't exist
        const oldPrice = product.oldPrice || product.price;
        const discountedPrice = Math.round(oldPrice * (1 - discount.percentage / 100));
        
        return {
          ...product,
          oldPrice: oldPrice,
          price: discountedPrice,
          discount: {
            name: discount.name, // Add the discount name here
            percentage: discount.percentage,
            startDate: discount.validFrom.toISOString(),
            endDate: discount.validTo.toISOString(),
            type: (discount.type === "seasonal" ? "special" : discount.type) || "sale",
          }
        };
      }
    }
    return product;
  });
}

/**
 * Adds category information to products
 */
export function enrichProductsWithCategories(
  products: Product[],
  categories: Category[]
): Product[] {
  return products.map(product => {
    const category = categories.find(c => c.id === product.categoryId);
    if (category) {
      return {
        ...product,
        category: category.name
      };
    }
    return product;
  });
}
