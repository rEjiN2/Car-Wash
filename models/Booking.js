const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    washerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    carId: { type: mongoose.Schema.Types.ObjectId, ref: "Car" },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: "ServicePackage" },
    status: {
      type: String,
      enum: ["pending", "accepted", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    locationType: { type: String, enum: ["doorstep", "station"] },
    serviceAddress: {
      addressLine: String,
      coordinates: { lat: Number, lng: Number },
    },
    schedule: Date,
    totalPrice: Number,
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    review: { rating: Number, comment: String },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", BookingSchema);


module.exports = {
  Booking,
};