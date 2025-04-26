const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [50, "Username cannot exceed 50 characters"],
      // match: [
      //   /^[a-zA-Z0-9_]+$/,
      //   "Username can only contain letters, numbers and underscores",
      // ],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      validate: {
        validator: function (password) {
          // At least one letter and one number
          return /\d/.test(password) && /[a-zA-Z]/.test(password);
        },
        message: "Password must contain at least one letter and one number",
      },
    },
    firebaseUid: {
      type: String,
      sparse: true,
      index: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },
    refreshTokens: [
      {
        type: String,
        // Storing token IDs for validation and revocation
      },
    ],
    phoneNumber: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\+?\d{9,15}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    role: {
      type: String,
      enum: ["user", "washer"],
      default: "user",
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    resetPasswordOTP: String,
    resetPasswordOTPExpires: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", UserSchema);

module.exports = {
  User,
};
