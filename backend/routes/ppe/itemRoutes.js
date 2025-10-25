const express = require("express");
const router = express.Router();
const Item = require("../../models/ppe/Item");

// ✅ Create new item
router.post("/", async (req, res) => {
  try {
    const { itemName, unit } = req.body;
    if (!itemName || !unit) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const exists = await Item.findOne({ itemName: new RegExp(`^${itemName}$`, "i") });
    if (exists) {
      return res.status(400).json({ success: false, message: "Item already exists" });
    }

    const item = await Item.create({ itemName, unit });
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Get all items
router.get("/", async (req, res) => {
  const items = await Item.find().sort({ itemName: 1 });
  res.json(items);
});

module.exports = router;
