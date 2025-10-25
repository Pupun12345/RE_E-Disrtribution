const mongoose = require("mongoose");

const scaffoldingReturnSchema = new mongoose.Schema(
  {
    woNumber: { type: String, trim: true },
    location: { type: String, trim: true },
    personName: { type: String, trim: true },
    returnDate: { type: Date, default: Date.now },
    itemName: { type: String, trim: true },
    unit: { type: String, default: "N/A" }, // ✅ Default safe value
    unitWeight: { type: Number, default: 0 },
    returnQuantity: { type: Number, default: 0 },
    returnWeight: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScaffoldingReturn", scaffoldingReturnSchema);
