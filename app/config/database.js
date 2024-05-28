import mongoose from "mongoose";

const dbURI = process.env.MONGODB_URI || "mongodb://localhost:27017/next-sharp";

const connectDB = async () => {
  if (mongoose.connnections?.[0].readyState) {
    return true;
  }
  try {
    await mongoose.connect(dbURI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log("Error connecting to MongoDB", err);
  }
};

export default connectDB;
