const mongoose = require("mongoose");

const distributionSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String },
  issueDate: { type: String, required: true },
  personName: { type: String, required: true },
  location: { type: String },
});

module.exports = mongoose.model("Distribution", distributionSchema);
