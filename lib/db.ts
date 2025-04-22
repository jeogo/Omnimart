import { MongoClient, Db, ServerApiVersion } from "mongodb";

const uri = "mongodb+srv://admin:admin@ecommerce.rq8hick.mongodb.net/?retryWrites=true&w=majority&appName=Ecommerce";

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let isConnecting = false;
let connectionPromise: Promise<Db> | null = null;

// Health check function to verify connection
async function isDbHealthy(): Promise<boolean> {
  try {
    if (!dbInstance) return false;
    // Ping the database
    await dbInstance.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

export async function getDb(): Promise<Db> {
  // If we already have a healthy database instance, return it
  if (dbInstance && await isDbHealthy()) {
    return dbInstance;
  }

  // If we're already in the process of connecting, wait for that connection
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  // Otherwise, create a new connection
  isConnecting = true;

  connectionPromise = new Promise<Db>(async (resolve, reject) => {
    try {
      // If a client exists but is not connected, close it first
      if (client) {
        try {
          await client.close();
        } catch (e) {
          // ignore
        }
        client = null;
        dbInstance = null;
      }

      client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        // Add options for production reliability
        maxPoolSize: 10,
        minPoolSize: 1,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 20000,
        retryWrites: true,
      });

      console.log("Connecting to MongoDB...");

      await client.connect();
      dbInstance = client.db("test");
      console.log("Connected to MongoDB server and selected database 'test'");

      isConnecting = false;
      resolve(dbInstance);
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);

      // Clean up the failed connection
      if (client) {
        await client.close().catch(() => {});
      }
      client = null;
      dbInstance = null;
      isConnecting = false;
      connectionPromise = null;

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

process.on('SIGTERM', async () => {
  await closeDbConnection();
  process.exit(0);
});
