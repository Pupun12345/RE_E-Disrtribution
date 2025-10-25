const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  itemName: { type: String, required: true, unique: true },
  qty: { type: Number, default: 0 },
  unit: String,
});

module.exports = mongoose.model("Stock", stockSchema);
