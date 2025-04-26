const mongoose = require("mongoose");

const PromoCodeSchema = new mongoose.Schema({ code: String, discountPercent: Number, maxDiscount: Number, expiryDate: Date, usageLimit: Number, usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], });

module.exports = mongoose.model("PromoCode", PromoCodeSchema);