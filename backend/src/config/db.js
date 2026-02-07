import mongoose from "mongoose";

export const ConnectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("✅ Database connected successfully");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ Database connection error:", err);
  });

  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined in .env file");
    }

    await mongoose.connect(mongoURI, {
      dbName: process.env.DB_NAME || "thinkboard",
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.log("💡 Make sure MONGODB_URI is set in your .env file");
    process.exit(1);
  }
};