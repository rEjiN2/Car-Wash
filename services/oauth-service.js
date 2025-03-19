const { User } = require("../models/Users");
const { admin } = require("../config/firebase-config");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Generate access token
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  const tokenId = crypto.randomBytes(16).toString("hex");

  return {
    token: jwt.sign({ userId, tokenId }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    }),
    tokenId,
  };
};

// Verify Firebase ID token
const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      status: true,
      data: decodedToken,
    };
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};

// Handle sign in with Google
const googleSignIn = async (idToken) => {
  try {
    // Verify the Firebase token
    const verifiedToken = await verifyFirebaseToken(idToken);

    if (!verifiedToken.status) {
      return {
        status: false,
        message: "Invalid Firebase token",
      };
    }

    const { uid, email, name, picture } = verifiedToken.data;

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user if not exists
      user = new User({
        username: name || email.split("@")[0], // Use name or first part of email as username
        email,
        password: crypto.randomBytes(16).toString("hex"), // Generate random password for OAuth users
        firebaseUid: uid,
        refreshTokens: [],
        authProvider: "google",
      });
    } else {
      // Update existing user with Firebase UID if not already set
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
      }

      if (!user.username && name) {
        user.username = name;
      }
      user.authProvider = "google";
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const { token: refreshToken, tokenId } = generateRefreshToken(user._id);

    // Store the refresh token ID
    user.refreshTokens.push(tokenId);
    user.lastLogin = new Date();

    await user.save();

    return {
      status: true,
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        accessToken,
        refreshToken,
      },
      message: "Successfully signed in with Google",
    };
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
};

module.exports = {
  googleSignIn,
  verifyFirebaseToken,
};
