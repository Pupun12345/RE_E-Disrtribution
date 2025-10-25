// models/Vendor.js
const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    partyName: { type: String, required: true },
    address: { type: String, required: true },
    gstNumber: { type: String, required: true },
    contactNumber: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
