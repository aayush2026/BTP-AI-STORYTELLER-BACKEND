import express from "express";
import {
  logoutController,
  userLoginController,
  userSignUpController,
} from "../controllers/UserController.js";

const router = express.Router();
router.post("/signup", userSignUpController);
router.post("/logout", logoutController);
export default router;
