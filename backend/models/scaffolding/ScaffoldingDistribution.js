const mongoose = require("mongoose");

const scaffoldingDistributionSchema = new mongoose.Schema(
  {
    woNumber: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    tslManager: {
      type: String,
      required: true,
      trim: true,
    },
    supervisorName: {
      type: String,
      trim: true,
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
    },
    unitWeight: {
      type: Number,
      default: 0,
    },
    issuedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    issuedWeight: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ScaffoldingDistribution",
  scaffoldingDistributionSchema
);
