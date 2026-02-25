/**
 * Database Configuration
 * Handles MongoDB connection with robust error handling and logging
 */

import mongoose from "mongoose";
import { envConfig } from "./env.js";
import dns from "node:dns";

// Fix for Node.js 17+ and MongoDB Atlas (IPv6/IPv4 resolution)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}
// Force Google DNS to bypass local ISP blocks on SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore if error
}

/**
 * Interface for database connection options
 */
interface DBConnectionOptions {
  autoIndex: boolean;
  maxPoolSize: number;
  serverSelectionTimeoutMS: number;
  socketTimeoutMS: number;
}

// Simplified options to reduce potential conflicts
const dbOptions: DBConnectionOptions = {
  autoIndex: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

/**
 * Connect to MongoDB with retry logic
 */
export const connectDB = async (retries = 5): Promise<void> => {
  while (retries > 0) {
    try {
      console.log(`📡 Connecting to MongoDB... (Attempts remaining: ${retries})`);
      // console.log("URL:", envConfig.MONGODB_URL); // Debug if needed

      const conn = await mongoose.connect(envConfig.MONGODB_URL, dbOptions as mongoose.ConnectOptions);

      console.log(`
✅ ================================
   MongoDB Connected! 
   ================================
   📦 Host: ${conn.connection.host}
   🗄️  Name: ${conn.connection.name}
   ================================
      `);

      // Handle connection events
      mongoose.connection.on("error", (err) => {
        console.error("❌ MongoDB connection error:", err);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
      });

      mongoose.connection.on("reconnected", () => {
        console.log("✅ MongoDB reconnected");
      });

      return; // Success, exit function

    } catch (error: any) {
      console.error(`❌ Connection failed: ${error.message}`);

      // Check for specific error types
      if (error.code === 'ECONNREFUSED' || error.message.includes('querySrv')) {
        console.error("💡 Hint: This often means your IP is not whitelisted in MongoDB Atlas or a firewall is blocking the connection.");
      }

      retries -= 1;
      if (retries === 0) {
        console.error(`
❌ ================================
   MongoDB Connection Failed
   ================================
   Could not connect after multiple attempts.
   Exiting...
   ================================
        `);
        process.exit(1);
      }
      // Wait 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};
