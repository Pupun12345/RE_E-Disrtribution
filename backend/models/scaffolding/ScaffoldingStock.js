const mongoose = require("mongoose");

const scaffoldingStockSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    uom: {
      type: String,
      default: "",
    },
    puw: {
      type: Number, // Per Unit Weight
      default: 0,
    },
    unit: {
      type: String,
      default: "",
    },
    qty: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScaffoldingStock", scaffoldingStockSchema);
