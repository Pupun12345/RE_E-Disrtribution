const mongoose = require("mongoose");

const distributionSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  issueDate: { type: String, required: true },
  personName: { type: String, required: true },
  location: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Mechanical_Distribution", distributionSchema);
