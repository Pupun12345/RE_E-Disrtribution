const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  qty: { type: Number, required: true },
  unit: { type: String, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
});

const purchaseSchema = new mongoose.Schema({
  partyName: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: String, required: true },
  items: [itemSchema],
  total: { type: Number, required: true },
});

module.exports = mongoose.model("Mechanical_Purchase", purchaseSchema);
