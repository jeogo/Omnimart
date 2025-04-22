import { MongoClient, Db, ServerApiVersion } from "mongodb";

const uri = "mongodb+srv://admin:admin@ecommerce.rq8hick.mongodb.net/?retryWrites=true&w=majority&appName=Ecommerce";

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let isConnecting = false;
let connectionPromise: Promise<Db> | null = null;

export async function getDb(): Promise<Db> {
  // If we already have a database instance, return it
  if (dbInstance) {
    return dbInstance;
  }
  
  // If we're already in the process of connecting, wait for that connection
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  // Otherwise, create a new connection
  isConnecting = true;
  
  // Create a promise to connect to the database
  connectionPromise = new Promise<Db>(async (resolve, reject) => {
    try {
      // Create a new client
      client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        }
      });
      
      console.log("Connecting to MongoDB...");
      
      // Connect to the MongoDB server
      await client.connect();
      console.log("Connected to MongoDB server");
      
      // Get the database instance - use "test" as specified
      dbInstance = client.db("test");
      console.log("Database 'test' selected");
      
      // We're no longer connecting
      isConnecting = false;
      
      // Return the database instance
      resolve(dbInstance);
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      
      // Clean up the failed connection
      if (client) {
        await client.close().catch(console.error);
      }
      
      // Reset connection state
      client = null;
      dbInstance = null;
      isConnecting = false;
      connectionPromise = null;
      
      // Reject with the error
      reject(error);
    }
  });
  
  return connectionPromise;
}

// Cleanup function
export async function closeDbConnection(): Promise<void> {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed");
    client = null;
    dbInstance = null;
    connectionPromise = null;
    isConnecting = false;
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await closeDbConnection();
  process.exit(0);
});
