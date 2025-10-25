const mongoose = require("mongoose");

// ✅ Define item subdocument
const ItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  unit: { type: String, required: true },
  uom: { type: String, required: true },
  qty: { type: Number, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
  workOrderNumber: { type: String, default: "" },
});

// ✅ Main scaffolding purchase schema
const ScaffoldingPurchaseSchema = new mongoose.Schema(
  {
    partyName: { type: String, required: true },
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: String, required: true },
    items: [ItemSchema],
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScaffoldingPurchase", ScaffoldingPurchaseSchema);
