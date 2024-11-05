import User from "../db/schema/UserSchema.js";
import generateTokenAndSetCookie from "../utils/generateTokenAndSetCookie.js";
import bcrypt from "bcryptjs";

const userLoginController = async (req, res) => {
  try {
    const { parentEmail, password } = req.body;
    if (!parentEmail || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const user = await User.findOne({ parentEmail });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(
      password,
      user?.password || ""
    );
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    generateTokenAndSetCookie(user._id, res);
    return res.status(200).json({
      userId: user._id,
      parentName: user.parentName,
      parentEmail: user.parentEmail,
      childName: user.childName,
      childAge: user.childAge,
      childStandard: user.childStandard,
      message: "User logged in successfully",
    });
  } catch (error) {}
};
const userSignUpController = async (req, res) => {
  try {
    const {
      parentName,
      parentEmail,
      childName,
      childAge,
      password,
      childStandard,
    } = req.body;
    if (
      !parentName ||
      !parentEmail ||
      !childName ||
      !childAge ||
      !password ||
      !childStandard
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const user = await User.findOne({ parentEmail });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    if (childStandard < 1 || childStandard > 8) {
      return res
        .status(400)
        .json({ error: "child standard must be between 1st and 8th" });
    }
    if (childAge < 5 || childAge > 15) {
      return res
        .status(400)
        .json({ error: "child age must be between 5 and 15" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      parentName,
      parentEmail,
      childName,
      childAge,
      password: hashedPassword,
      childStandard,
    });
    if (newUser) {
      await newUser.save();
      const userId = newUser._id;
      generateTokenAndSetCookie(userId, res);
      return res.status(201).json({
        userId,
        parentName,
        parentEmail,
        childName,
        childAge,
        childStandard,
        message: "User created successfully",
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.error(error);
  }
};
const logoutController = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 1 });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.error(error);
  }
};

export { userLoginController, userSignUpController, logoutController };
