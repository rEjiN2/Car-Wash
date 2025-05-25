const express = require("express");

const authMiddleware = require("../middlewares/auth-middleware");
const {
  authValidationRules,
  validateRequest,
} = require("../middlewares/validation-middleware");
const { userController } = require("../controllers");
const router = express.Router();

router.post("/users", authMiddleware, userController.getAllUsers);

router.get(
  "/users/:id",
  authMiddleware,
  userController.getUserById
);

module.exports = router;
