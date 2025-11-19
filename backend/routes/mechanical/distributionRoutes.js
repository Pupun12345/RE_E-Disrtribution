const express = require("express");
const router = express.Router();
const Distribution = require("../../models/mechanicals/Distribution");
const Stock = require("../../models/mechanicals/Stock");

// Create a new distribution record
router.post("/", async (req, res) => {
  try {
    const { itemName, quantity, unit, issueDate, personName, location } = req.body;

    if (!itemName || !quantity || !unit || !personName) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const stockItem = await Stock.findOne({ itemName });
    if (!stockItem) {
      return res.status(404).json({ success: false, message: "Item not found in stock" });
    }

    if (stockItem.qty < quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${stockItem.qty}` });
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

    // Update stock quantity
    stockItem.qty -= quantity;
    await stockItem.save();

    res.status(201).json({ success: true, record });
  } catch (err) {
    console.error("Error creating distribution:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all distributions
router.get("/", async (req, res) => {
  try {
    const distributions = await Distribution.find().sort({ issueDate: -1 });
    res.status(200).json(distributions);
  } catch (err) {
    console.error("Error fetching distributions:", err);
    res.status(500).json({ success: false, message: "Failed to fetch distributions" });
  }
});

// Update a distribution record
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { itemName, quantity, unit, issueDate, personName, location } = req.body;

    const updated = await Distribution.findByIdAndUpdate(
      id,
      { itemName, quantity, unit, issueDate, personName, location },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Record not found" });

    res.status(200).json({ success: true, record: updated });
  } catch (err) {
    console.error("Error updating distribution:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete a distribution record + restore stock
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Fetch the record to restore stock before deletion
    const record = await Distribution.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    // 2️⃣ Find the stock item
    const stockItem = await Stock.findOne({ itemName: record.itemName });
    if (stockItem) {
      stockItem.qty += Number(record.quantity); // 🔥 Restore qty back to stock
      await stockItem.save();
    }

    // 3️⃣ Delete the record
    await Distribution.findByIdAndDelete(id);

    // 4️⃣ Return updated list
    const all = await Distribution.find().sort({ issueDate: -1 });

    res.status(200).json({ success: true, distributions: all });
  } catch (err) {
    console.error("Error deleting distribution:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;
