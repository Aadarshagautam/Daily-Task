import mongoose from "mongoose";

let listenersBound = false;
let connectionPromise = null;

export const ConnectDB = async () => {
  if (!listenersBound) {
    mongoose.connection.on("connected", () => {
      console.log("Database connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("Database connection error:", err);
    });

    listenersBound = true;
  }

  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    const error = new Error("MONGODB_URI is not defined in .env file");
    console.error("Database connection failed:", error.message);
    throw error;
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(mongoURI, {
        dbName: process.env.DB_NAME || "thinkboard",
      })
      .catch((error) => {
        connectionPromise = null;
        console.error("Database connection failed:", error.message);
        throw error;
      });
  }

  await connectionPromise;
  return mongoose.connection;
};
