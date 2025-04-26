const mongoose = require("mongoose");

const CarSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  brand: String,
  model: String,
  color: String,
  plateNumber: { type: String, unique: true },
  carType: { type: String, enum: ["sedan", "suv", "truck", "hatchback"] },
});

module.exports = mongoose.model("Car", CarSchema);
