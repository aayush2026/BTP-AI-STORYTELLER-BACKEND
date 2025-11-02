import Story from "../db/schema/StorySchema.js";
import Audio from "../db/schema/audioSchema.js";

const uploadAudioController = async (req, res) => {
  try {
    const { sid } = req.params;
    console.log("Received sid:", sid);
    const story = await Story.findById(sid);
    console.log("Story found:", story);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

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
    console.error("Error uploading audio:", error);
    res.status(500).json({ message: "Error uploading audio" });
  }
};

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

    res.json({ audio, story });
  } catch (error) {
    console.error("Error retrieving audio:", error);
    res.status(500).json({ message: "Error retrieving audio" });
  }
};

const getAudiosController = async (req, res) => {
  try {
    const audios = await Audio.find();
    res.json(audios);
  } catch (error) {
    console.error("Error retrieving audio list:", error);
    res.status(500).json({ message: "Error retrieving audio list" });
  }
};

export { uploadAudioController, getFinalFeedbackController, getAudiosController };

