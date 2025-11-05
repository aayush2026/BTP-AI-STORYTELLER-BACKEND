import mongoose from "mongoose";

const audioSchema = new mongoose.Schema({

  filePath: { 
    type: String, 
    required: true 
  },
  fileName: { 
    type: String, 
    required: true 
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
