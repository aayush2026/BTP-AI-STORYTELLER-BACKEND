import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

import User from "../db/schema/UserSchema.js";
import Story from "../db/schema/StorySchema.js";
import Assignment from "../db/schema/AssignmentSchema.js";
import Feedback from "../db/schema/FeedbackSchema.js";

// Import from the provider switcher - will use OpenAI or Gemini based on AI_PROVIDER env variable
import { generateStory, generateImage, generateQuestions, generateFeedback } from "../ai/index.js";


// Story Controller Functions
// Controller for creating a new story
/** parameters are: storyDescription, storyTitle, maxPages, includeImage, childAge
 *  returns: message: "Story created successfully", story
 *  throws error if there is an error
 */

const createStoryController = async (req, res) => {
  try {
    const { storyTitle, storyDescription, maxPages, childAge, includeImage } =
      req.body;

    const userId = req.user._id;
    const author = req.user.parentName;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: "User not found",
        error: "User not found in createStoryController"
      });
    }

    // Generate story
    // returns storyData.storyContent in format:
    // { storyTitle, storyDescription, storyContent: [ { pageText: "Text for page 1" }, { pageText: "Text for page 2" }, ... ] }
    const storyData = await generateStory({
      storyTitle,
      storyDescription,
      maxPages,
      childAge,
      includeImage,
    });

    let storyContents = [];

    for (let i = 0; i < maxPages; i++) {
      let pageImage = null;
      const pageText = storyData.storyContent[i].pageText;

      if (includeImage && (i == 0 || i == 2)) {
        // Generate image
        // returns generatedImageUrl in format: "https://example.com/image.png"
        const generatedImageUrl = await generateImage({ pageText });

        if (generatedImageUrl) {
          // Upload image to Cloudinary
          const uploadedImage = await cloudinary.uploader.upload(
            generatedImageUrl
          );

          pageImage = uploadedImage.secure_url; // Cloudinary-secured URL
        }
      }

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

/** To get a single story by sid
/** parameters are: sid
 *  returns: story
 *  throws error if there is an error
 */
const getStoryController = async (req, res) => {
  const { sid } = req.params;

  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: "User not found",
        error: "User not found in getStoryController"
      });
    }

    // Find the story by sid
    const story = await Story.findById(sid.toString());
    if (!story) {
      return res.status(404).json({ 
        message: "Story not found",
        error: "Story not found in getStoryController"
      });
    }

    // Check if the story was created by the user
    if (story.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: "Unauthorized access",
        error: "Unauthorized access in getStoryController"
      });
    }

    return res.status(200).json({ story });
  } catch (error) {
    console.error("Error getting story:", error);
    return res.status(500).json({ 
      message: "Internal Server Error",
      error: "Internal Server Error in getStoryController"
    });
  }
};

/** To get all stories for a user by uid
/** parameters are: uid
 *  returns: stories
 *  throws error if there is an error
 */
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

/** To get the full story by sid
/** parameters are: sid
 *  returns: wholeStory
 *  throws error if there is an error
 */
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

  // Get the full story in one single text/paragraph instead of an array of pages
  let wholeStory = "";
  for (let i = 0; i < story.storyContent.length; i++) {
    wholeStory += story.storyContent[i].pageText;
  }
  return res.status(200).json({ wholeStory });
};


// Assignment Controller Functions
/** To create an assignment for a story by sid
/** parameters are: sid
 *  returns: assignment
 *  throws error if there is an error
 */
const createAssignmentController = async (req, res) => {
  try {
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
    
    // Check if the story was created by the user
    if (story.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: "Unauthorized access",
        error: "Unauthorized access in createAssignmentController"
      });
    }

    // Check if the assignment already exists
    const assignmentExists = await Assignment.findOne({ sid, uid: userId });
    if (assignmentExists) {
      console.log("Assignment already exists", assignmentExists); // Log the existing assignment instead
      return res.status(200).json({
        assignment: assignmentExists,
      });
    }

    const storyContent = story?.storyContent;
    const storyTitle = story?.storyTitle;

    // Generate questions
    // returns questions in format: [ { question: "Question 1", answer: "Answer 1" }, { question: "Question 2", answer: "Answer 2" }, ... ]
    const questionsResult = await generateQuestions({ storyContent, storyTitle });
    
    // Check if there was an error in question generation
    if (questionsResult.error) {
      console.error("Error generating questions:", questionsResult.error);
      console.error("Raw response:", questionsResult.rawResponse || questionsResult.details);
      return res.status(500).json({
        message: "Failed to generate questions",
        error: questionsResult.error,
        details: questionsResult.details || questionsResult.rawResponse,
      });
    }

    // Extract questions from the result
    const { questions } = questionsResult;
    
    // Validate that questions exist and is an array
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      console.error("Invalid questions format:", questions);
      return res.status(500).json({
        message: "Failed to generate questions",
        error: "Invalid questions format returned from AI",
      });
    }

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
    return res.status(500).json({ 
      message: "Internal server error",
      error: "Internal server error in createAssignmentController"
    });
  }
};

/** To submit feedback for an assignment for a story by sid
/** parameters are: sid
 *  returns: feedback
 *  throws error if there is an error
 */
const feedbackAssignmentController = async (req, res) => {
  const { sid } = req.params;
  const { answers } = req.body;
  const userId = req.user._id;

  // Check if the user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Check if the story exists
  const story = await Story.findById(sid);
  if (!story) {
    return res.status(404).json({ message: "Story not found" });
  }

  // Check if the assignment exists
  const assignment = await Assignment.findOne({ sid, uid: userId });
  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  // Get the story content and questions from the assignment
  const storyContent = story.storyContent;
  const questions = assignment.questions;
  
  // Update the user's answers in the assignment
  for (let i = 0; i < questions.length; i++) {
    questions[i].userAnswer = answers[i];
  }

  // Generate feedback
  // returns feedback in format: [ { question: "Question 1", answer: "Answer 1", userAnswer: "User's Answer 1", rating: 1, feedback: "Feedback 1" }, { question: "Question 2", answer: "Answer 2", userAnswer: "User's Answer 2", rating: 2, feedback: "Feedback 2" }, ... ]
  const feedback = await generateFeedback({ questions, storyContent });
  
  // Save the feedback to the database
  const saveFeedbacks = new Feedback({
    sid,
    uid: userId,
    feedbacks: feedback.results,
  });
  await saveFeedbacks.save();

  return res.status(200).json({ saveFeedbacks });
};

/** To get feedback for an assignment for a story by sid
/** parameters are: sid
 *  returns: feedback
 *  throws error if there is an error
 */
const getFeedbackController = async (req, res) => {
  const { sid } = req.params;
  const userId = req.user._id;

  // check if story exists
  const story = await Story.findById(sid);
  if (!story) {
    return res.status(404).json({ message: "Story not found" });
  }

  // check if the story was created by the user
  if (story.createdBy.toString() !== userId.toString()) {
    return res.status(403).json({ message: "Unauthorized access" });
  }

  // get the feedback from the database
  const feedback = await Feedback.findOne({ sid, uid: userId });
  if (!feedback) {
    return res.status(404).json({ message: "Feedback not found" });
  }

  return res.status(200).json({ feedback });
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
