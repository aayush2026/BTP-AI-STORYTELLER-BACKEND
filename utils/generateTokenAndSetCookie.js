import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const isProd = process.env.NODE_ENV === "production";

const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15d", // Token expiry of 15 days
  });

  res.cookie("jwt", token, {
    httpOnly: true, // Secure the cookie from client-side JavaScript
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in milliseconds
    sameSite: isProd ? "none" : "lax",
    secure: isProd, // cookie only over HTTPS in production
  });

  return token;
};

export default generateTokenAndSetCookie;
