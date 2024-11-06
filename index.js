import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./db/dbconfig.js";
import UserRoutes from "./routes/UserRoutes.js";
import StoryRoutes from "./routes/StoryRoutes.js";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import Story from "./db/schema/StorySchema.js";
import Audio from "./db/schema/audioSchema.js";

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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err)); */

// Multer setup for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Route to upload audio
app.post("/upload/:sid", upload.single("audio"), async (req, res) => {
  try {
    const { sid } = req.params;
    console.log("Received sid:", sid);
    const story = await Story.findById(sid);
    console.log("Story found:", story);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    console.log("Story found:", story);
    let wholeStory = "";
    for (let i = 0; i < story.storyContent.length; i++) {
      wholeStory += story.storyContent[i].pageText;
    }

    const newAudio = new Audio({
      filePath: req.file.path,
      fileName: req.file.originalname,
      createdAt: new Date(),
      sid: story._id,
      wholeStory,
    });
    await newAudio.save();
    return res.status(201).json(newAudio._id);
  } catch (error) {
    res.status(500).json({ message: "Error uploading audio" });
  }
});

app.get("/audio/finalFeedback/:aid", async (req, res) => {
  try {
    const { aid } = req.params;
    const audio = await Audio.findById(aid);
    if (!audio) {
      return res.status(404).json({ message: "Audio not found" });
    }
    //const story = await audio.wholeStory;
    const story = await Story.findById(audio.sid);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    res.json({ audio, story });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving audio" });
  }
});

// Route to get list of audio files
app.get("/audios", async (req, res) => {
  try {
    const audios = await Audio.find();
    res.json(audios);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving audio list" });
  }
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
