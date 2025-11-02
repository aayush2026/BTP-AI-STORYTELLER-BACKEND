import express from "express";
const router = express.Router();
import {
  uploadAudioController,
  getFinalFeedbackController,
  getAudiosController,
} from "../controllers/AudioController.js";
import upload from "../utils/multerConfig.js";

// Routes matching original paths to avoid frontend changes
// Root level routes
router.post("/upload/:sid", upload.single("audio"), uploadAudioController);
router.get("/audios", getAudiosController);

// Audio prefix routes  
router.get("/audio/finalFeedback/:aid", getFinalFeedbackController);

export default router;

