import mongoose from "mongoose";

const audioSchema = new mongoose.Schema({
  // S3 object key (e.g., "uploads/audio/1234567890-recording.wav")
  s3Key: { 
    type: String, 
    required: true 
  },
  // Original filename uploaded by user
  fileName: { 
    type: String, 
    required: true 
  },
  // Legacy field for backwards compatibility (can be removed if no old data exists)
  filePath: { 
    type: String, 
    required: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  score: { 
    type: Number,
    default: 0 
  },
  transcript: { 
    type: String, 
    default: "" 
  },
  wholeStory: { 
    type: String, 
    required: true 
  },
  sid: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Story" 
  },
});

const Audio = mongoose.model("Audio", audioSchema);
export default Audio;
