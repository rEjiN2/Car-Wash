const express = require("express");

const authMiddleware = require("../middlewares/auth-middleware");
const {
  authValidationRules,
  validateRequest,
} = require("../middlewares/validation-middleware");
const { userController } = require("../controllers");
const router = express.Router();

router.post("/users", authMiddleware, userController.getAllUsers);

module.exports = router;
