const express = require("express");
const router = express.Router();
const ScaffoldingReturn = require("../../models/scaffolding/ScaffoldingReturn");
const ScaffoldingStock = require("../../models/scaffolding/ScaffoldingStock");

// ===========================
// GET ALL RETURNS
// ===========================
router.get("/", async (req, res) => {
  try {
    const returns = await ScaffoldingReturn.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, returns });
  } catch (err) {
    console.error("❌ Error fetching returns:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch returns",
      error: err.message,
    });
  }
});

// ===========================
// ADD NEW RETURN
// ===========================
router.post("/", async (req, res) => {
  try {
    console.log("📥 Incoming Return Body:", req.body);

    const {
      woNumber,
      location,
      personName,
      returnDate,
      itemName,
      unitWeight,
      returnQuantity,
      returnWeight,
    } = req.body;

    const returnQtyNum = Number(returnQuantity) || 0;
    const unitWeightNum = Number(unitWeight) || 0;
    const returnWeightNum = Number(returnWeight) || 0;
    const dateObj = returnDate ? new Date(returnDate) : new Date();

    const stockItem = await ScaffoldingStock.findOne({
      itemName: itemName?.trim(),
    });

    const newReturn = new ScaffoldingReturn({
      woNumber: woNumber?.trim() || "N/A",
      location: location?.trim() || "N/A",
      personName: personName?.trim() || "N/A",
      returnDate: isNaN(dateObj.getTime()) ? new Date() : dateObj,
      itemName: itemName?.trim() || "Unknown",
      unit: stockItem?.unit || "N/A",
      unitWeight: unitWeightNum,
      returnQuantity: returnQtyNum,
      returnWeight: returnWeightNum,
    });

    const savedReturn = await newReturn.save();

    if (stockItem) {
      stockItem.qty += returnQtyNum;
      await stockItem.save();
    }

    res.status(201).json({
      success: true,
      message: "Return saved successfully",
      record: savedReturn,
    });
  } catch (err) {
    console.error("🔥 Error saving return:", err);
    res.status(500).json({
      success: false,
      message: "Failed to save return",
      error: err.message,
    });
  }
});

// ===========================
// UPDATE RETURN  ✅ NEW
// ===========================
router.put("/:id", async (req, res) => {
  try {
    console.log("🛠️ Update request body:", req.body);

    const {
      woNumber,
      location,
      personName,
      returnDate,
      itemName,
      unitWeight,
      returnQuantity,
      returnWeight,
    } = req.body;

    const returnQtyNum = Number(returnQuantity) || 0;
    const unitWeightNum = Number(unitWeight) || 0;
    const returnWeightNum = Number(returnWeight) || 0;
    const dateObj = returnDate ? new Date(returnDate) : new Date();

    const existingReturn = await ScaffoldingReturn.findById(req.params.id);
    if (!existingReturn) {
      return res
        .status(404)
        .json({ success: false, message: "Return record not found" });
    }

    const stockItem = await ScaffoldingStock.findOne({
      itemName: itemName?.trim(),
    });

    // ✅ Adjust stock if quantity changed
    if (stockItem) {
      const qtyDiff = returnQtyNum - existingReturn.returnQuantity;
      stockItem.qty += qtyDiff;
      await stockItem.save();
    }

    existingReturn.woNumber = woNumber?.trim() || existingReturn.woNumber;
    existingReturn.location = location?.trim() || existingReturn.location;
    existingReturn.personName = personName?.trim() || existingReturn.personName;
    existingReturn.returnDate = isNaN(dateObj.getTime())
      ? existingReturn.returnDate
      : dateObj;
    existingReturn.itemName = itemName?.trim() || existingReturn.itemName;
    existingReturn.unit = stockItem?.unit || existingReturn.unit;
    existingReturn.unitWeight = unitWeightNum;
    existingReturn.returnQuantity = returnQtyNum;
    existingReturn.returnWeight = returnWeightNum;

    const updatedReturn = await existingReturn.save();

    res.status(200).json({
      success: true,
      message: "Return updated successfully",
      record: updatedReturn,
    });
  } catch (err) {
    console.error("🔥 Error updating return:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update return",
      error: err.message,
    });
  }
});

// ===========================
// DELETE RETURN
// ===========================
router.delete("/:id", async (req, res) => {
  try {
    const returnRecord = await ScaffoldingReturn.findById(req.params.id);
    if (!returnRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Return record not found" });
    }

    const stockItem = await ScaffoldingStock.findOne({
      itemName: returnRecord.itemName,
    });

    if (stockItem) {
      stockItem.qty -= returnRecord.returnQuantity;
      await stockItem.save();
    }

    await ScaffoldingReturn.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Return deleted and stock adjusted successfully",
    });
  } catch (err) {
    console.error("❌ Error deleting return:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete return",
      error: err.message,
    });
  }
});

module.exports = router;
//updated delete button