import User from "../db/schema/UserSchema.js";
import jwt from "jsonwebtoken";

const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    //console.log("Token: ", token);

    if (!token) return res.status(401).json({ 
      message: "Unauthorized",
      error: "No token provided"
    });

    // Verify token
    // decoded stores userId in the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user in database 
    // select("-password") is used to exclude the password from the response
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(401).json({ 
      message: "Unauthorized",
      error: "User not found"
    });

    // Attach user to request object
    req.user = user;

    next();
  } catch (err) {
    res.status(500).json({ 
      message: "Internal Server Error for Protect Route",
      error: err.message
    });
    console.error("Error in protectRoute: ", err.message);
  }
};

export default protectRoute;
