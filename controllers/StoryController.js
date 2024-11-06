import Assignment from "../db/schema/AssignmentSchema.js";
import Story from "../db/schema/StorySchema.js";
import User from "../db/schema/UserSchema.js";
import { generateImage } from "../openai/generateImage.js";
import { generateStory } from "../openai/generateStory.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import { generateQuestions } from "../openai/generateQuestions.js";
import { generateFeedback } from "../openai/generateFeedback.js";
import Feedback from "../db/schema/FeedbackSchema.js";
// For downloading images if needed

const createStoryController = async (req, res) => {
  try {
    const { storyDescription, storyTitle, maxPages, includeImage, childAge } =
      req.body;

    const userId = req.user._id;
    const author = req.user.parentName;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const storyData = await generateStory({
      storyDescription,
      storyTitle,
      maxPages,
      includeImage,
      childAge,
    });

    let storyContents = [];
    let cnt = 0;

    for (let i = 0; i < maxPages; i++) {
      let pageImage = null;
      const pageText = storyData.storyContent[i].pageText;

      if (includeImage && (cnt == 0 || cnt == 2)) {
        const generatedImageUrl = await generateImage({ pageText });

        if (generatedImageUrl) {
          // Optionally download the image if necessary
          const uploadedImage = await cloudinary.uploader.upload(
            generatedImageUrl
          );

          pageImage = uploadedImage.secure_url; // Cloudinary-secured URL
        }
      }
      cnt++;

      // Add the page content and image to the storyContent array
      storyContents.push({ pageText, pageImage });
    }

    // Return the generated story and content in the response
    const story = new Story({
      storyTitle,
      storyDescription,
      storyContent: storyContents,
      storyAuthor: author,
      createdBy: userId,
      maxPages,
    });

    await story.save();
    return res.status(201).json({
      message: "Story created successfully",
      story,
    });
  } catch (error) {
    console.error("Error generating story:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to generate story" });
  }
};

const getStoryController = async (req, res) => {
  const { sid } = req.params;

  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const story = await Story.findById(sid.toString());

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    if (story.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    return res.status(200).json({ story });
  } catch (error) {
    console.error("Error getting story:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllStoriesController = async (req, res) => {
  const { uid } = req.params;

  try {
    // Validate the uid before querying the database
    if (!mongoose.Types.ObjectId.isValid(uid)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Fetch stories created by the user
    const stories = await Story.find({
      createdBy: new mongoose.Types.ObjectId(uid), // Convert uid to ObjectId if necessary
    });

    return res.status(200).json({ stories });
  } catch (error) {
    console.error("Error getting all stories:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
const createAssignmentController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sid } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const story = await Story.findById(sid);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    if (story.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    const assignmentExists = await Assignment.findOne({ sid, uid: userId });
    if (assignmentExists) {
      console.log("Assignment already exists", assignmentExists); // Log the existing assignment instead
      return res.status(200).json({
        assignment: assignmentExists,
      });
    }
    const storyContent = story?.storyContent;
    const storyTitle = story?.storyTitle;
    const { questions } = await generateQuestions({ storyContent, storyTitle });
    const assignment = new Assignment({
      sid,
      uid: userId,
      questions,
    });
    await assignment.save();
    console.log("Assignment created successfully", assignment);
    return res.status(201).json({ assignment });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const feedbackAssignmentController = async (req, res) => {
  const { sid } = req.params;
  const { answers } = req.body;
  const userId = req.user._id;
  const assignment = await Assignment.findOne({ sid, uid: userId });
  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }
  const story = await Story.findById(sid);
  if (!story) {
    return res.status(404).json({ message: "Story not found" });
  }
  const storyContent = story.storyContent;
  const questions = assignment.questions;
  for (let i = 0; i < questions.length; i++) {
    questions[i].userAnswer = answers[i];
  }
  const feedback = await generateFeedback({ questions, storyContent });
  const saveFeedbacks = new Feedback({
    sid,
    uid: userId,
    feedbacks: feedback.results,
  });
  await saveFeedbacks.save();
  return res.status(200).json({ saveFeedbacks });
};
const getFeedbackController = async (req, res) => {
  const { sid } = req.params;
  const userId = req.user._id;
  const feedback = await Feedback.findOne({ sid, uid: userId });
  if (!feedback) {
    return res.status(404).json({ message: "Feedback not found" });
  }
  return res.status(200).json({ feedback });
};
const getFullStoryController = async (req, res) => {
  const { sid } = req.params;
  const userId = req.user._id;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const story = await Story.findById(sid);

  if (!story) {
    return res.status(404).json({ message: "Story not found" });
  }
  let wholeStory = "";
  for (let i = 0; i < story.storyContent.length; i++) {
    wholeStory += story.storyContent[i].pageText;
  }
  return res.status(200).json({ wholeStory });
};
export {
  createStoryController,
  getStoryController,
  getAllStoriesController,
  createAssignmentController,
  feedbackAssignmentController,
  getFeedbackController,
  getFullStoryController,
};
