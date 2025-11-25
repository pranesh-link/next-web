import mongoose from "mongoose";

const dbURI = process.env.MONGODB_URI || "mongodb://localhost:27017/next-sharp";

// Connection pool optimization
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
  retryWrites: true,
  retryReads: true,
};

// Cache the connection promise
let cachedConnection = null;
let connectionPromise = null;

const connectDB = async () => {
  // Return cached connection if available
  if (cachedConnection && mongoose.connections[0].readyState === 1) {
    return cachedConnection;
  }

  // If connection is in progress, return that promise
  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    connectionPromise = mongoose.connect(dbURI, options);
    cachedConnection = await connectionPromise;
    console.log("Connected to MongoDB");
    return cachedConnection;
  } catch (err) {
    console.error("Error connecting to MongoDB", err);
    connectionPromise = null;
    cachedConnection = null;
    throw err;
  }
};

export default connectDB;
