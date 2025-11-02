import express from "express";
const router = express.Router();
import {
  createAssignmentController,
  createStoryController,
  feedbackAssignmentController,
  getAllStoriesController,
  getFeedbackController,
  getFullStoryController,
  getStoryController,
} from "../controllers/StoryController.js";
import protectRoute from "../middlewares/ProtectRoute.js";

// Creates a new story
router.post("/create", protectRoute, createStoryController);
// Gets all stories for a user
router.get("/stories/:uid", protectRoute, getAllStoriesController);
// Gets a single story
router.get("/getStory/:sid", protectRoute, getStoryController);
// Gets the full story
router.get("/getFullStory/:sid", protectRoute, getFullStoryController);

// Creates a new assignment
router.get("/getQuestions/:sid", protectRoute, createAssignmentController);

// Submits feedback for an assignment
router.post("/feedback/:sid", protectRoute, feedbackAssignmentController);
// Gets feedback for an assignment
router.get("/getFeedback/:sid", protectRoute, getFeedbackController);

export default router;
