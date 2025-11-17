import Story from "../db/schema/StorySchema.js";
import Audio from "../db/schema/audioSchema.js";
import { getUploadUrl, getObjectUrl } from "../utils/S3Client.js";

// ============ NEW S3 DIRECT UPLOAD FLOW ============

/**
 * Step 1: Generate pre-signed upload URL for frontend to upload directly to S3
 * GET /api/audio/upload-url/:sid
 */
const getUploadUrlController = async (req, res) => {
  try {
    const { sid } = req.params;
    console.log("Generating upload URL for story:", sid);

    // Verify story exists
    const story = await Story.findById(sid);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Generate pre-signed upload URL (valid for 5 minutes)
    const { uploadUrl, key } = await getUploadUrl("recording.wav", "audio/wav");

    console.log("✅ Generated upload URL, S3 key:", key);

    // Return both the upload URL and the key (frontend will send key back after upload)
    return res.status(200).json({ uploadUrl, key });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    res.status(500).json({ message: "Error generating upload URL" });
  }
};

/**
 * Step 2: Confirm upload and save metadata to MongoDB after frontend uploads to S3
 * POST /api/audio/confirm-upload/:sid
 * Body: { s3Key, fileName }
 */
const confirmUploadController = async (req, res) => {
  try {
    const { sid } = req.params;
    const { s3Key, fileName } = req.body;

    console.log("Confirming upload for story:", sid, "S3 key:", s3Key);

    if (!s3Key || !fileName) {
      return res.status(400).json({ message: "Missing s3Key or fileName" });
    }

    // Get the story from the database
    const story = await Story.findById(sid);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Concatenate full story text
    let wholeStory = "";
    for (let i = 0; i < story.storyContent.length; i++) {
      wholeStory += story.storyContent[i].pageText;
    }

    // Create a new audio document with S3 key
    const newAudio = new Audio({
      s3Key,
      fileName,
      createdAt: new Date(),
      sid: story._id,
      wholeStory,
    });
    await newAudio.save();

    console.log("✅ Audio metadata saved to MongoDB:", newAudio._id);
    return res.status(201).json({ audioId: newAudio._id });
  } catch (error) {
    console.error("Error confirming upload:", error);
    res.status(500).json({ message: "Error confirming upload" });
  }
};



// ############################################################################
// ============ LEGACY MULTER UPLOAD (for backwards compatibility) ============

const uploadAudioController = async (req, res) => {
  try {
    const { sid } = req.params;
    console.log("Received sid:", sid);

    // Get the story from the database
    const story = await Story.findById(sid);
    console.log("Story found:", story);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    let wholeStory = "";
    for (let i = 0; i < story.storyContent.length; i++) {
      wholeStory += story.storyContent[i].pageText;
    }

    // Create a new audio object and save it to the database
    const newAudio = new Audio({
      filePath: req.file.path,
      fileName: req.file.originalname,
      s3Key: "", // Empty for legacy uploads
      createdAt: new Date(),
      sid: story._id,
      wholeStory,
    });
    await newAudio.save();
    return res.status(201).json(newAudio._id);
  } catch (error) {
    console.error("Error uploading audio:", error);
    res.status(500).json({ message: "Error uploading audio" });
  }
};
// ############################################################################



// ============ GET AUDIO WITH PRE-SIGNED URL ============

const getFinalFeedbackController = async (req, res) => {
  try {
    const { aid } = req.params;
    const audio = await Audio.findById(aid);
    if (!audio) {
      return res.status(404).json({ message: "Audio not found" });
    }
    const story = await Story.findById(audio.sid);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // If audio is stored in S3, generate pre-signed GET URL
    let audioUrl = null;
    if (audio.s3Key) {
      audioUrl = await getObjectUrl(audio.s3Key);
      console.log("✅ Generated pre-signed GET URL for audio playback");
    }

    res.json({ 
      audio: {
        ...audio.toObject(),
        audioUrl, // Add pre-signed URL to response
      }, 
      story 
    });
  } catch (error) {
    console.error("Error retrieving audio:", error);
    res.status(500).json({ message: "Error retrieving audio" });
  }
};

const getAudiosController = async (req, res) => {
  try {
    // Get all audios from the database
    const audios = await Audio.find();
    res.json(audios);
  } catch (error) {
    console.error("Error retrieving audio list:", error);
    res.status(500).json({ message: "Error retrieving audio list" });
  }
};

export { 
  uploadAudioController, 
  getFinalFeedbackController, 
  getAudiosController,
  getUploadUrlController,
  confirmUploadController 
};

