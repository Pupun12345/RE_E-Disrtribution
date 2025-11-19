const express = require("express");
const router = express.Router();
const ScaffoldingItem = require("../../models/scaffolding/ScaffoldingItem");

// ✅ Get all scaffolding items
router.get("/", async (req, res) => {
  try {
    const items = await ScaffoldingItem.find().sort({ itemName: 1 });
    res.status(200).json({ success: true, items });
  } catch (err) {
    console.error("Error fetching scaffolding items:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching scaffolding items",
    });
  }
});

// ✅ Add new scaffolding item
router.post("/", async (req, res) => {
  try {
    let { itemName, puw, unit } = req.body;

    if (!itemName || !puw || !unit) {
      return res.status(400).json({
        success: false,
        message: "All fields (itemName, puw, unit) are required",
      });
    }

    itemName = itemName.trim();
    unit = unit.trim();

    // Check for duplicates (case-insensitive)
    const existing = await ScaffoldingItem.findOne({
      itemName: { $regex: new RegExp(`^${itemName}$`, "i") },
    });

    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Item already exists" });
    }

    const newItem = await ScaffoldingItem.create({
      itemName,
      puw,
      unit,
    });

    res.status(201).json({ success: true, item: newItem });
  } catch (err) {
    console.error("Error adding scaffolding item:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error adding scaffolding item" });
  }
});

module.exports = router;
//updated delete button