const mongoose = require("mongoose");

const ScaffoldingItemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    puw: {
      type: String,
      required: [true, "Per unit weight is required"],
      trim: true,
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScaffoldingItem", ScaffoldingItemSchema);
