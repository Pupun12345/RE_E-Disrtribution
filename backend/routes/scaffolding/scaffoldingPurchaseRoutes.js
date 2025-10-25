const express = require("express");
const router = express.Router();
const ScaffoldingPurchase = require("../../models/scaffolding/ScaffoldingPurchase");

// ===============================
// 📦 GET all purchases
// ===============================
router.get("/", async (req, res) => {
  try {
    const purchases = await ScaffoldingPurchase.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, purchases });
  } catch (err) {
    console.error("Error fetching scaffolding purchases:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching scaffolding purchases",
    });
  }
});

// ===============================
// 🧾 ADD new purchase
// ===============================
router.post("/", async (req, res) => {
  try {
    const { partyName, invoiceNumber, invoiceDate, items, total } = req.body;

    if (!partyName || !invoiceNumber || !invoiceDate || !items?.length) {
      return res.status(400).json({
        success: false,
        message: "All fields and at least one item are required",
      });
    }

    const newPurchase = await ScaffoldingPurchase.create({
      partyName,
      invoiceNumber,
      invoiceDate,
      items,
      total,
    });

    res.status(201).json({ success: true, purchase: newPurchase });
  } catch (err) {
    console.error("Error adding scaffolding purchase:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error adding scaffolding purchase" });
  }
});

// ===============================
// ✏️ UPDATE existing purchase
// ===============================
router.put("/:id", async (req, res) => {
  try {
    const updated = await ScaffoldingPurchase.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }

    res.status(200).json({ success: true, purchase: updated });
  } catch (err) {
    console.error("Error updating scaffolding purchase:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error updating scaffolding purchase" });
  }
});

// ===============================
// ❌ DELETE purchase
// ===============================
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await ScaffoldingPurchase.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }

    res.status(200).json({ success: true, message: "Purchase deleted successfully" });
  } catch (err) {
    console.error("Error deleting scaffolding purchase:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error deleting scaffolding purchase" });
  }
});

module.exports = router;
