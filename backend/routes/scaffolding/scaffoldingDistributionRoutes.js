const express = require("express");
const router = express.Router();
const ScaffoldingDistribution = require("../../models/scaffolding/ScaffoldingDistribution");

// ✅ GET all distributions
router.get("/", async (req, res) => {
  try {
    const distributions = await ScaffoldingDistribution.find().sort({ createdAt: -1 });
    res.json(distributions);
  } catch (err) {
    console.error("Error fetching distributions:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ POST new distribution
router.post("/", async (req, res) => {
  try {
    const newDistribution = new ScaffoldingDistribution({
      woNumber: req.body.woNumber,
      location: req.body.location,
      tslManager: req.body.tslManager,
      supervisorName: req.body.supervisorName,
      issueDate: req.body.issueDate,
      itemName: req.body.itemName,
      unit: req.body.unit,
      unitWeight: req.body.unitWeight,
      issuedQuantity: req.body.issuedQuantity,
      issuedWeight: req.body.issuedWeight,
    });

    const saved = await newDistribution.save();
    res.status(201).json({ success: true, record: saved });
  } catch (err) {
    console.error("Error saving distribution:", err);
    res.status(500).json({ success: false, message: "Failed to save record" });
  }
});

// ✅ PUT (update) existing record
router.put("/:id", async (req, res) => {
  try {
    const updated = await ScaffoldingDistribution.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    res.json({ success: true, record: updated });
  } catch (err) {
    console.error("Error updating distribution:", err);
    res.status(500).json({ success: false, message: "Failed to update record" });
  }
});

// ✅ DELETE distribution
router.delete("/:id", async (req, res) => {
  try {
    const record = await ScaffoldingDistribution.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    // restore stock
    const Stock = require("../../models/scaffolding/ScaffoldingStock");

    await Stock.findOneAndUpdate(
      { itemName: record.itemName },
      { $inc: { qty: record.issuedQuantity } }
    );

    // delete record
    await record.deleteOne();

    res.json({ success: true, message: "Record deleted & stock updated" });

  } catch (err) {
    console.error("Error deleting distribution:", err);
    res.status(500).json({ success: false, message: "Failed to delete record" });
  }
});


module.exports = router;
