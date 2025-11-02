import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";

import connectDB from "./db/dbconfig.js";
import UserRoutes from "./routes/UserRoutes.js";
import StoryRoutes from "./routes/StoryRoutes.js";
import AudioRoutes from "./routes/AudioRoutes.js";

const app = express();

dotenv.config();
app.use(
  express.json({
    limit: "50mb",
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // Specify the allowed origin
    credentials: true, // Allow credentials (cookies, authentication)
  })
);

const PORT = process.env.PORT || 3000;

try{
  await connectDB();
  console.log("✅ Connected to MongoDB");
} catch (error) {
  console.error("Error connecting to MongoDB:", error);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", (req, res) => {
  res.send("This is the backend of the AI Storyteller");
});

// Route handlers
app.use("/api/user", UserRoutes);
app.use("/api/story", StoryRoutes);
app.use("/", AudioRoutes); // Handles /upload, /audios, and /audio/finalFeedback routes

// Serve uploaded files statically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
