import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./db/dbconfig.js";
import UserRoutes from "./routes/UserRoutes.js";
import StoryRoutes from "./routes/StoryRoutes.js";
import { v2 as cloudinary } from "cloudinary";

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
await connectDB();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/user", UserRoutes);
app.use("/api/story", StoryRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
