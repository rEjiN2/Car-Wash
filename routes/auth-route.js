const express = require("express");
const { authController, oauthController } = require("../controllers");
const authMiddleware = require("../middlewares/auth-middleware");
const {
  authValidationRules,
  validateRequest,
} = require("../middlewares/validation-middleware");
const router = express.Router();

router.post(
  "/register",
  authValidationRules.register,
  validateRequest,
  authController.register
);
router.post(
  "/login",
  authValidationRules.login,
  validateRequest,
  authController.login
);
router.post("/google/signin", oauthController.googleAuth);
router.post(
  "/refresh-token",
  authValidationRules.refreshToken,
  validateRequest,
  authController.refreshAccessToken
);
router.post("/forgot-password", authController.forgotPassword)
router.get("/logout", authMiddleware, authController.logout);
router.get("/logout-all", authMiddleware, authController.logoutAll);

module.exports = router;
