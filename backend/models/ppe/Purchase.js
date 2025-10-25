const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  itemName: String,
  qty: Number,
  unit: String,
  rate: Number,
  amount: Number,
});

const purchaseSchema = new mongoose.Schema({
  partyName: String,
  invoiceNumber: String,
  invoiceDate: String,
  items: [itemSchema],
  total: Number,
});

module.exports = mongoose.model("Purchase", purchaseSchema);
