import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// Get the filename and directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer setup for file storage to store the audio files in the uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads/")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

// Multer instance to upload the audio files
const upload = multer({ storage });

export default upload;

