const mongoose = require("mongoose");

const SubscriptionPlanSchema = new mongoose.Schema({
  name: String,
  price: Number,
  durationInDays: Number,
  benefits: [String],
});

const SubscriptionPlan = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);


 module.exports = {
    SubscriptionPlan
 }