const jwt = require("jsonwebtoken");
const config = require("../config/config");
const { User } = require("../models/Users");

const authMiddleware = async (req, res, next) => {
  try {
    // Allow public routes to pass through
    if (config.passUrl.includes(req.path)) {
      return next();
    }

    const token = req.header("Authorization")?.replace("Bearer ", "");
      console.log("token", token);
    if (!token) {
      return res.status(401).json({
        status: false,
        message: "No token, authorization denied",
      });
    }

    // Verify access token (not refresh token)
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findOne({ _id: decoded.userId });

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: false,
        message: "Token expired",
      });
    }

    res.status(500).json({
      status: false,
      message: "Server error during authentication",
    });
  }
};

module.exports = authMiddleware;
