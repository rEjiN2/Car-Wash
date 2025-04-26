const mongoose = require("mongoose");

const WasherProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  availability: { type: Boolean, default: true },
  location: { type: { type: String, default: "Point" } },
  coordinates: [Number], // [longitude, latitude] },
  rating: { type: Number, default: 0 },
  totalJobs: { type: Number, default: 0 },
});

WasherProfileSchema.index({ location: "2dsphere" });

const WasherProfile  = mongoose.model("WasherProfile", WasherProfileSchema);


module.exports = {
    WasherProfile
}