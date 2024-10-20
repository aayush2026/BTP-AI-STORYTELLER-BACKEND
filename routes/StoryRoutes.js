import express from "express";
const router = express.Router();
import {
  createStoryController,
  getStoryController,
} from "../controllers/StoryController.js";
import protectRoute from "../middlewares/ProtectRoute.js";

router.post("/create", protectRoute, createStoryController);
router.get("/getStory/:sid", protectRoute, getStoryController);

export default router;
