const { validationResult, body, param, query } = require("express-validator");

// Middleware to check validation results
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Auth validation rules
const authValidationRules = {
  register: [
    body("username")
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be between 3 and 50 characters")
      // .matches(/^[a-zA-Z0-9_]+$/)
      // .withMessage("Username can only contain letters, numbers and underscores")
      .escape(),
    body("email")
      .trim()
      .isEmail()
      .withMessage("Must be a valid email address")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/\d/)
      .withMessage("Password must contain at least one number")
      .matches(/[a-zA-Z]/)
      .withMessage("Password must contain at least one letter"),
  ],
  login: [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Must be a valid email address")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  refreshToken: [
    body("refreshToken")
      .optional()
      .isString()
      .withMessage("Refresh token must be a string"),
  ],
};

module.exports = {
  validateRequest,
  authValidationRules,
};
