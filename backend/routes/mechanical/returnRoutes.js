const express = require("express");
const router = express.Router();
const MechanicalReturn = require("../../models/mechanicals/Return");
const MechanicalStock = require("../../models/mechanicals/Stock");

// ✅ Fetch all return records
router.get("/", async (req, res) => {
  try {
    const records = await MechanicalReturn.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Error fetching returns", error: err });
  }
});

// ✅ Add new return record
router.post("/", async (req, res) => {
  try {
    const { items, totalQty } = req.body;

    // 1️⃣ Save return record
    const newRecord = new MechanicalReturn({ items, totalQty });
    await newRecord.save();

    // 2️⃣ Update stock quantities
    for (const item of items) {
      const stockItem = await MechanicalStock.findOne({ itemName: item.itemName });
      if (stockItem) {
        stockItem.qty += Number(item.qty); // increment stock
        await stockItem.save();
      } else {
        // If the item is not in stock, create it
        const newStock = new MechanicalStock({
          itemName: item.itemName,
          qty: Number(item.qty),
          unit: item.unit || "",
        });
        await newStock.save();
      }
    }

    res.json({ message: "Return record saved and stock updated", newRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving return record", error: err });
  }
});

// ✅ Update an existing return record
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { items, totalQty } = req.body;

    const oldRecord = await MechanicalReturn.findById(id);
    if (!oldRecord) return res.status(404).json({ message: "Return record not found" });

    // 1️⃣ Revert old quantities from stock
    for (const item of oldRecord.items) {
      const stockItem = await MechanicalStock.findOne({ itemName: item.itemName });
      if (stockItem) {
        stockItem.qty -= Number(item.qty); // remove old qty
        if (stockItem.qty < 0) stockItem.qty = 0;
        await stockItem.save();
      }
    }

    // 2️⃣ Update the return record
    const updated = await MechanicalReturn.findByIdAndUpdate(
      id,
      { items, totalQty },
      { new: true }
    );

    // 3️⃣ Add new quantities to stock
    for (const item of items) {
      const stockItem = await MechanicalStock.findOne({ itemName: item.itemName });
      if (stockItem) {
        stockItem.qty += Number(item.qty);
        await stockItem.save();
      } else {
        const newStock = new MechanicalStock({
          itemName: item.itemName,
          qty: Number(item.qty),
          unit: item.unit || "",
        });
        await newStock.save();
      }
    }

    res.json({ message: "Return record updated and stock synced", updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating return record", error: err });
  }
});

// ✅ Delete a record
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const record = await MechanicalReturn.findById(id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    // Decrement stock based on deleted return
    for (const item of record.items) {
      const stockItem = await MechanicalStock.findOne({ itemName: item.itemName });
      if (stockItem) {
        stockItem.qty -= Number(item.qty);
        if (stockItem.qty < 0) stockItem.qty = 0;
        await stockItem.save();
      }
    }

    await MechanicalReturn.findByIdAndDelete(id);
    res.json({ message: "Return record deleted and stock adjusted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting return record", error: err });
  }
});

module.exports = router;
//updated delete button