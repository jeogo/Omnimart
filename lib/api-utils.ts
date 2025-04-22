import { getDb } from "@/lib/db";
import {
  mapMongoCategoryToCategory,
  mapMongoDiscountToDiscount,
  mapMongoOrderToOrder,
  enrichProductsWithDiscounts,
  enrichProductsWithCategories,
} from "@/lib/data-mapper";
import type { Product, Category, Discount, Order } from "@/lib/types/entities";
import { ObjectId } from "mongodb";

/**
 * Fetch all discounts
 */
export async function fetchDiscounts(): Promise<Discount[]> {
  try {
    const db = await getDb();

    // Check if the 'discounts' collection exists
    const collections = await db
      .listCollections({ name: "discounts" })
      .toArray();
    if (collections.length === 0) {
      return [];
    }

    // Fetch discounts
    const discounts = await db.collection("discounts").find({}).toArray();

    // Map to Discount interface
    return discounts.map((doc) => ({
      _id: doc._id || null,
      id: doc._id?.toString() || doc.id || "",
      name: doc.name || "خصم",
      percentage: doc.percentage || 0,
      validFrom: doc.validFrom || new Date(),
      validTo: doc.validTo || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      type: doc.type || "sale",
      applicableProducts: doc.applicableProducts || [],
      applicableCategories: doc.applicableCategories || [],
      minPurchase: doc.minPurchase || 0,
      code: doc.code || "",
      isActive: doc.isActive !== false,
    }));
  } catch (error) {
    console.error("Error fetching discounts:", error);
    return [];
  }
}

/**
 * Fetch a single discount by ID
 */
export async function fetchDiscountById(id: string): Promise<Discount | null> {
  if (!id) return null;

  try {
    const db = await getDb();

    // Try to find discount by ID
    const discountDoc = await db.collection("discounts").findOne({
      $or: [{ id: id }],
    });

    if (!discountDoc) {
      return null;
    }

    // Map to Discount interface
    return {
      _id: discountDoc._id || null,
      id: discountDoc._id?.toString() || discountDoc.id || "",
      name: discountDoc.name || "خصم",
      percentage: discountDoc.percentage || 0,
      validFrom: discountDoc.validFrom || new Date(),
      validTo:
        discountDoc.validTo || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      type: discountDoc.type || "sale",
      applicableProducts: discountDoc.applicableProducts || [],
      applicableCategories: discountDoc.applicableCategories || [],
      minPurchase: discountDoc.minPurchase || 0,
      code: discountDoc.code || "",
      isActive: discountDoc.isActive !== false,
    };
  } catch (error) {
    console.error(`Error fetching discount ${id}:`, error);
    return null;
  }
}

/**
 * Fetch all products with optional category and discount info
 */
export async function fetchProducts(
  options: {
    includeDiscounts?: boolean;
    includeCategories?: boolean;
    limit?: number;
    categoryId?: string;
    isNew?: boolean;
    hasDiscount?: boolean;
  } = {}
): Promise<Product[]> {
  try {
    const db = await getDb();

    // Build query based on options
    const query: any = {};
    if (options.categoryId) query.categoryId = options.categoryId;
    if (options.isNew) query.isNewProduct = true;
    if (options.hasDiscount) query.discountId = { $exists: true, $ne: null };

    // Fetch products
    const productsCollection = db.collection("products");
    let productsCursor = productsCollection.find(query);

    // Apply limit if specified
    if (options.limit) {
      productsCursor = productsCursor.limit(options.limit);
    }

    // Get array of documents
    const productDocs = await productsCursor.toArray();

    // Map to Product interface
    let products = productDocs.map((doc, idx) => {
      const mapped = mapMongoProductToProduct(doc);
      return mapped;
    });

    // Enrich with discount info if requested
    if (options.includeDiscounts) {
      const discounts = await fetchDiscounts();
      products = enrichProductsWithDiscounts(products, discounts);
  
    }

    // Enrich with category info if requested
    if (options.includeCategories) {
      const categories = await fetchCategories();
      products = enrichProductsWithCategories(products, categories);
   
    }

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

/**
 * Fetch a single product by ID
 */
export async function fetchProductById(
  id: string,
  options: { includeDiscount?: boolean; includeCategory?: boolean } = {}
): Promise<Product | null> {
  try {
    const db = await getDb();

    // Try multiple query approaches to find the product
    let productDoc = null;

    // First: Try with the original string ID
    productDoc = await db.collection("products").findOne({ id: id });
 

    // Second: Try with _id if not found
    if (!productDoc) {
      try {
        // Try with string literal converted to ObjectId
        const objectId = new ObjectId(id);
        productDoc = await db.collection("products").findOne({ _id: objectId });
     
      } catch (error) {
        console.log("Error when searching by _id string:", error);
      }
    }

    // Third: Try with MongoDB ObjectId if not found yet
    if (!productDoc && id.length === 24) {
      try {
        const objectId = new ObjectId(id);
        productDoc = await db.collection("products").findOne({ _id: objectId });
        if (productDoc) {
        }
      } catch (error) {
        console.log("Error when searching by ObjectId:", error);
      }
    }

    // Check if we found anything after all our attempts
    if (!productDoc) {
      console.log(`Product not found with ID: ${id}`);
      return null;
    }

    // Map to Product interface
    let product = mapMongoProductToProduct(productDoc);

    // Ensure ID is always available in string format
    product.id = product.id || productDoc._id?.toString() || id;

    // Fetch and apply discount if requested
    if (options.includeDiscount && product.discountId) {
   
      const discount = await fetchDiscountById(product.discountId);

      if (discount) {
        console.log(
          `[fetchProductById] Found discount: ${discount.name} (${discount.percentage}%)`
        );

        // Update product with discount info
        product.discount = {
          name: discount.name,
          percentage: discount.percentage,
          startDate: discount.validFrom.toISOString(),
          endDate: discount.validTo.toISOString(),
          type: discount.type || "sale",
        };
      }
    }

    // Fetch and apply category if requested
    if (options.includeCategory && product.categoryId) {
      const category = await fetchCategoryById(product.categoryId);
      if (category) {
        product.category = category.name;
      }
    }

    return product;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
}

/**
 * Convert MongoDB document to Product interface
 */
function mapMongoProductToProduct(doc: any): Product {
  // Make sure _id is converted to string id if not already set
  const id = doc.id || (doc._id ? doc._id.toString() : null);

  return {
    id: id,
    name: doc.name || "Untitled Product",
    description: doc.description || "",
    price: doc.price || 0,
    oldPrice: doc.oldPrice,
    categoryId: doc.categoryId || "",
    category: doc.category || "",
    images: doc.images || [],
    image: doc.image || null,
    features: doc.features || [],
    material: doc.material || "",
    care: doc.care || "",
    sizes: doc.sizes || [],
    colors: doc.colors || null,
    isNew: doc.isNew || false,
    discount: doc.discount || null,
    rating: doc.rating || 0,
    reviews: doc.reviews || 0,
    createdAt: doc.createdAt || new Date(),
    updatedAt: doc.updatedAt || new Date(),
    discountId: doc.discountId || null,
  };
}

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const db = await getDb();
    const categoryDocs = await db.collection("categories").find({}).toArray();
    return categoryDocs.map(mapMongoCategoryToCategory);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * Fetch a single category by ID
 */
export async function fetchCategoryById(id: string): Promise<Category | null> {
  try {
    const db = await getDb();
    
    // Try to convert string ID to ObjectId if it looks like a MongoDB ID
    let categoryDoc = null;
    if (id.length === 24) {
      try {
        const objectId = new ObjectId(id);
        categoryDoc = await db.collection("categories").findOne({ _id: objectId });
      } catch (error) {
        console.log("Error converting to ObjectId:", error);
      }
    }
    
    // If not found with ObjectId, try with string ID
    if (!categoryDoc) {
      categoryDoc = await db.collection("categories").findOne({ id: id });
    }

    if (!categoryDoc) {
      return null;
    }

    return mapMongoCategoryToCategory(categoryDoc);
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error);
    return null;
  }
}

/**
 * Fetch all orders
 */
export async function fetchOrders(): Promise<Order[]> {
  try {
    const db = await getDb();
    const orderDocs = await db.collection("orders").find({}).toArray();
    return orderDocs.map(mapMongoOrderToOrder);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

/**
 * Fetch a single order by ID
 */
export async function fetchOrderById(id: string): Promise<Order | null> {
  try {
    const db = await getDb();
    
    // Try to convert string ID to ObjectId if it looks like a MongoDB ID
    let orderDoc = null;
    if (id.length === 24) {
      try {
        const objectId = new ObjectId(id);
        orderDoc = await db.collection("orders").findOne({ _id: objectId });
      } catch (error) {
        console.log("Error converting to ObjectId:", error);
      }
    }
    
    // If not found with ObjectId, try with string ID
    if (!orderDoc) {
      orderDoc = await db.collection("orders").findOne({ id: id });
    }

    if (!orderDoc) {
      return null;
    }

    return mapMongoOrderToOrder(orderDoc);
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    return null;
  }
}

/**
 * Create a new order
 */
export async function createOrder(orderData: Order): Promise<Order> {
  try {
    console.log("Creating order:", orderData);

    const db = await getDb();

    // Ensure we have a valid date object
    if (typeof orderData.createdAt === "string") {
      orderData.createdAt = new Date(orderData.createdAt);
    }

    // Insert order into database
    const result = await db.collection("orders").insertOne(orderData);

    console.log("Order created successfully:", result);

    return {
      ...orderData,
      id: result.insertedId.toString(),
    };
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}
