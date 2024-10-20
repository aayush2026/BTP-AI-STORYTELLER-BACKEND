import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15d", // Token expiry of 15 days
  });

  res.cookie("jwt", token, {
    httpOnly: true, // Secure the cookie from client-side JavaScript
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in milliseconds
    sameSite: "lax", // Basic CSRF protection, lax mode is good for most cases
    secure: false, // Not using HTTPS in development mode
  });

  return token;
};

export default generateTokenAndSetCookie;
