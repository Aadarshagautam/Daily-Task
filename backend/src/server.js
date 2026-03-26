import dotenv from "dotenv";
import app from "./app.js";
import { ConnectDB } from "./core/config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await ConnectDB();

    const server = app.listen(PORT, () => {
      console.log(`Server running on PORT: ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });

    server.on("error", (error) => {
      if (error?.code === "EADDRINUSE") {
        console.error(
          `Failed to start server: port ${PORT} is already in use. Stop the other server or change PORT in backend/.env.`
        );
        process.exit(1);
      }

      console.error("Server listen error:", error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
