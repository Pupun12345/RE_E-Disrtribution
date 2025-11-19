const express = require("express");
const router = express.Router();
const Distribution = require("../../models/ppe/Distribution");
const Stock = require("../../models/ppe/Stock");

// ✅ Add Distribution Record
router.post("/", async (req, res) => {
  try {
    const { itemName, quantity, unit, issueDate, personName, location } =
      req.body;

    if (!itemName || !quantity || !personName) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const stockItem = await Stock.findOne({ itemName });
    if (!stockItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in stock" });
    }

    if (stockItem.qty < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${stockItem.qty}`,
      });
    }

    const record = new Distribution({
      itemName,
      quantity,
      unit,
      issueDate,
      personName,
      location,
    });
    await record.save();

    stockItem.qty -= quantity;
    await stockItem.save();

    res.status(201).json({ success: true, record });
  } catch (error) {
    console.error("Error creating distribution:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Get All Distributions
router.get("/", async (req, res) => {
  try {
    const distributions = await Distribution.find().sort({ issueDate: -1 });
    res.json(distributions);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch distributions" });
  }
});

// ✅ Update Distribution
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { itemName, quantity, unit, issueDate, personName, location } =
      req.body;

    const updated = await Distribution.findByIdAndUpdate(
      id,
      { itemName, quantity, unit, issueDate, personName, location },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    res.json({ success: true, record: updated });
  } catch (error) {
    console.error("Error updating distribution:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// ✅ Delete Distribution + Restore Stock
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Find the record being deleted
    const record = await Distribution.findById(id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    // 2️⃣ Find stock item
    const stockItem = await Stock.findOne({ itemName: record.itemName });
    if (!stockItem) {
      return res.status(404).json({
        success: false,
        message: `Stock item '${record.itemName}' not found`,
      });
    }

    // 3️⃣ Add quantity back to stock
    stockItem.qty += record.quantity;
    await stockItem.save();

    // 4️⃣ Delete the distribution record
    await Distribution.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Distribution deleted & stock updated",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting record",
    });
  }
});

module.exports = router;
//updated delete button