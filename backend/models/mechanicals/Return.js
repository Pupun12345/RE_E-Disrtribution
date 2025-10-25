const mongoose = require("mongoose");

const returnItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  qty: { type: Number, required: true },
  unit: { type: String },
  returnDate: { type: String },
  personName: { type: String },
  location: { type: String },
});

const returnSchema = new mongoose.Schema(
  {
    items: [returnItemSchema],
    totalQty: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MechanicalReturn", returnSchema);
