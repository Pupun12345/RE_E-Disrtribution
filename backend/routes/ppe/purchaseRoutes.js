const express = require("express");
const router = express.Router();
const Purchase = require("../../models/ppe/Purchase");
const Stock = require("../../models/ppe/Stock");

// ✅ POST Purchase (save new)
router.post("/", async (req, res) => {
  try {
    const { partyName, invoiceNumber, invoiceDate, items, total } = req.body;

    if (!partyName || !invoiceNumber || !invoiceDate || !items?.length) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const purchase = await Purchase.create({
      partyName,
      invoiceNumber,
      invoiceDate,
      items,
      total,
    });

    // ✅ Update stock for each item
    for (const it of items) {
      const stock = await Stock.findOne({ itemName: it.itemName });
      if (stock) {
        stock.qty += Number(it.qty);
        await stock.save();
      } else {
        await Stock.create({
          itemName: it.itemName,
          qty: it.qty,
          unit: it.unit,
        });
      }
    }

    const allPurchases = await Purchase.find();
    res.json({ success: true, purchases: allPurchases });
  } catch (err) {
    console.error("Error saving purchase:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ GET all purchases
router.get("/", async (req, res) => {
  try {
    const purchases = await Purchase.find();
    res.json({ success: true, purchases });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ DELETE purchase
// ✅ DELETE purchase + update stock
router.delete("/:id", async (req, res) => {
  try {
    // 1️⃣ Find the purchase being deleted
    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase not found" });
    }

    // 2️⃣ Reverse stock changes
    for (const it of purchase.items) {
      const stock = await Stock.findOne({ itemName: it.itemName });

      if (stock) {
        stock.qty -= Number(it.qty);

        // Prevent negative stock
        if (stock.qty < 0) stock.qty = 0;

        await stock.save();
      }
    }

    // 3️⃣ Delete the purchase
    await Purchase.findByIdAndDelete(req.params.id);

    // 4️⃣ Return updated list
    const purchases = await Purchase.find();
    res.json({ success: true, purchases });
  } catch (err) {
    console.error("Error deleting purchase:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ UPDATE purchase (Edit existing record)
router.put("/:id", async (req, res) => {
  try {
    const { partyName, invoiceNumber, invoiceDate, items, total } = req.body;

    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      { partyName, invoiceNumber, invoiceDate, items, total },
      { new: true }
    );

    if (!purchase)
      return res
        .status(404)
        .json({ success: false, message: "Purchase not found" });

    const allPurchases = await Purchase.find();
    res.json({ success: true, purchases: allPurchases });
  } catch (err) {
    console.error("Error updating purchase:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
