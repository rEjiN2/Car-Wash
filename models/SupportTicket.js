const mongoose = require("mongoose");

const SupportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  subject: String,
  message: String,
  status: {
    type: String,
    enum: ["open", "in-progress", "closed"],
    default: "open",
  },
  replies: [
    {
      sender: String,
      message: String,
      date: { type: Date, default: Date.now },
    },
  ],
});

const SupportTicket = mongoose.model("SupportTicket", SupportTicketSchema);


 module.exports = {
    SupportTicket,
 }