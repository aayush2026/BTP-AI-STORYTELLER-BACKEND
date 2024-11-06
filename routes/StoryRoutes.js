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

router.post("/create", protectRoute, createStoryController);
router.get("/getStory/:sid", protectRoute, getStoryController);
router.get("/stories/:uid", getAllStoriesController);
router.get("/getQuestions/:sid", protectRoute, createAssignmentController);
router.post("/feedback/:sid", protectRoute, feedbackAssignmentController);
router.get("/getFeedback/:sid", protectRoute, getFeedbackController);
router.get("/getFullStory/:sid", protectRoute, getFullStoryController);

export default router;
