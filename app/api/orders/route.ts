import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { Order } from '@/lib/types/entities';

export async function POST(request: Request) {
  try {
    const orderData: Order = await request.json();
    
    
    // Validate required fields
    if (!orderData.customerName || !orderData.customerPhone || !orderData.wilaya) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB (only runs on server)
    const db = await getDb();
    
    // Ensure proper date handling
    if (typeof orderData.createdAt === 'string') {
      orderData.createdAt = new Date(orderData.createdAt);
    } else if (!orderData.createdAt) {
      orderData.createdAt = new Date();
    }
    
    // Insert order into database
    const result = await db.collection("orders").insertOne(orderData);
    
    if (!result.acknowledged) {
      throw new Error("Failed to insert order");
    }
    
    // Return success with the created order
    return NextResponse.json({
      ...orderData,
      id: result.insertedId.toString(),
      message: "Order created successfully" 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = await getDb();
    
    // Fetch orders from the database
    const orders = await db.collection("orders")
      .find({})
      .sort({ createdAt: -1 }) // Most recent first
      .toArray();
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
