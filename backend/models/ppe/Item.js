const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  itemName: { type: String, required: true, unique: true },
  unit: { type: String, required: true },
});

module.exports = mongoose.model("Item", itemSchema);
