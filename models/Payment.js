const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    amount: Number,
    status: { type: String, enum: ["pending", "success", "failed"] },
    method: { type: String, enum: ["card", "cash", "wallet"] },
    transactionId: String,
    paymentDate: Date,
  },
  { timestamps: true }
);

const Payment  = mongoose.model("Payment", PaymentSchema);

module.exports = {
    Payment
};