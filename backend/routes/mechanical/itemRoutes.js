const express = require("express");
const router = express.Router();
const MechanicalItem = require("../../models/mechanicals/MechanicalItem");

// ✅ Get all mechanical items
router.get("/", async (req, res) => {
  try {
    const items = await MechanicalItem.find().sort({ itemName: 1 });
    res.status(200).json({ success: true, items });
  } catch (err) {
    console.error("Error fetching mechanical items:", err);
    res.status(500).json({ success: false, message: "Server error fetching mechanical items" });
  }
});

// ✅ Add new mechanical item
router.post("/", async (req, res) => {
  try {
    let { itemName, unit } = req.body;
    if (!itemName || !unit) {
      return res.status(400).json({ success: false, message: "Item name and unit are required" });
    }

    itemName = itemName.trim();
    unit = unit.trim();

    // Check for duplicates case-insensitively
    const existing = await MechanicalItem.findOne({
      itemName: { $regex: new RegExp(`^${itemName}$`, "i") },
    });

    if (existing) {
      return res.status(409).json({ success: false, message: "Item already exists" });
    }

    const newItem = await MechanicalItem.create({ itemName, unit });
    res.status(201).json({ success: true, item: newItem });
  } catch (err) {
    console.error("Error adding mechanical item:", err);
    res.status(500).json({ success: false, message: "Server error adding mechanical item" });
  }
});

module.exports = router;
//updated delete button