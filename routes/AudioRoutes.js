import express from "express";
const router = express.Router();
import {
  uploadAudioController,
  getFinalFeedbackController,
  getAudiosController,
  getUploadUrlController,
  confirmUploadController,
} from "../controllers/AudioController.js";
import upload from "../utils/multerConfig.js";

// ============ NEW S3 DIRECT UPLOAD ROUTES ============
// Step 1: Get pre-signed upload URL
router.get("/api/audio/upload-url/:sid", getUploadUrlController);

// Step 2: Confirm upload after frontend uploads to S3
router.post("/api/audio/confirm-upload/:sid", confirmUploadController);

// ============ LEGACY ROUTES (backwards compatibility) ============
// Root level routes
router.post("/upload/:sid", upload.single("audio"), uploadAudioController);
router.get("/audios", getAudiosController);

// Audio prefix routes  
router.get("/audio/finalFeedback/:aid", getFinalFeedbackController);

export default router;

