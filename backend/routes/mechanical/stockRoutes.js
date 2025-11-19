const express = require("express");
const router = express.Router();
const MechanicalStock = require("../../models/mechanicals/Stock");

// ==================== GET ALL STOCK ====================
router.get("/", async (req, res) => {
  try {
    const stock = await MechanicalStock.find();
    res.status(200).json({ success: true, stock });
  } catch (error) {
    console.error("Error fetching mechanical stock:", error);
    res.status(500).json({ success: false, message: "Error fetching mechanical stock", error });
  }
});

// ==================== ADD OR UPDATE STOCK ====================
router.post("/", async (req, res) => {
  try {
    const { itemName, qty, unit } = req.body;
    if (!itemName || qty === undefined) {
      return res.status(400).json({ success: false, message: "Item name and quantity are required" });
    }

    let item = await MechanicalStock.findOne({ itemName });
    if (item) {
      item.qty += Number(qty);
      if (unit) item.unit = unit; // update unit if provided
      await item.save();
      return res.status(200).json({ success: true, message: "Stock updated successfully", item });
    } else {
      const newItem = new MechanicalStock({ itemName, qty: Number(qty), unit });
      await newItem.save();
      return res.status(201).json({ success: true, message: "New stock item added", item: newItem });
    }
  } catch (error) {
    console.error("Error adding/updating stock:", error);
    res.status(500).json({ success: false, message: "Error adding/updating stock", error });
  }
});

// ==================== REDUCE STOCK QUANTITY ====================
router.put("/reduce", async (req, res) => {
  try {
    const { itemName, qty } = req.body;
    if (!itemName || qty === undefined) {
      return res.status(400).json({ success: false, message: "Item name and quantity are required" });
    }

    const item = await MechanicalStock.findOne({ itemName });
    if (!item) return res.status(404).json({ success: false, message: "Item not found in stock" });

    if (item.qty < qty) {
      return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${item.qty}` });
    }

    item.qty -= Number(qty);
    await item.save();

    res.status(200).json({ success: true, message: "Stock reduced successfully", item });
  } catch (error) {
    console.error("Error reducing stock:", error);
    res.status(500).json({ success: false, message: "Error reducing stock", error });
  }
});

module.exports = router;
//updated delete button