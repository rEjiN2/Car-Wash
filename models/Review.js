const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  washerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now },
});

 const Review = mongoose.model("Review", ReviewSchema);

 module.exports = {Review};	