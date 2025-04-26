const mongoose = require("mongoose");

const ServicePackageSchema = new mongoose.Schema({
     name: String, 
     description: String, 
     price: Number, 
     duration: Number, // in minutes 
     features: [String], 
     active: { type: Boolean, default: true, }, 
    });

const ServicePackage = mongoose.model("ServicePackage", ServicePackageSchema);

module.exports = {
    ServicePackage
}