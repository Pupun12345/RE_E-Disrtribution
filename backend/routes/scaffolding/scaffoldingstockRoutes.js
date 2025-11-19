const express = require("express");
const router = express.Router();
const ScaffoldingPurchase = require("../../models/scaffolding/ScaffoldingPurchase");
const ScaffoldingDistribution = require("../../models/scaffolding/ScaffoldingDistribution");
const ScaffoldingReturn = require("../../models/scaffolding/ScaffoldingReturn");

// ===============================
// 📦 GET live stock (purchase - issued + returned)
// ===============================
router.get("/", async (req, res) => {
  try {
    const purchases = await ScaffoldingPurchase.find();
    const distributions = await ScaffoldingDistribution.find();
    const returns = await ScaffoldingReturn.find();

    const stockMap = {};

    // 1️⃣ Add purchase quantities
    purchases.forEach((p) => {
      p.items.forEach((item) => {
        if (!stockMap[item.itemName]) {
          stockMap[item.itemName] = {
            itemName: item.itemName,
            unit: item.unit,
            qty: 0,
          };
        }
        stockMap[item.itemName].qty += Number(item.qty) || 0;
      });
    });

    // 2️⃣ Subtract issued (distribution) quantities
    distributions.forEach((d) => {
      const name = d.itemName?.trim();
      if (name) {
        if (!stockMap[name]) {
          stockMap[name] = { itemName: name, unit: d.unit, qty: 0 };
        }
        stockMap[name].qty -= Number(d.issuedQuantity) || 0;
      }
    });

    // 3️⃣ Add returned quantities
    returns.forEach((r) => {
      const name = r.itemName?.trim();
      if (name) {
        if (!stockMap[name]) {
          stockMap[name] = { itemName: name, unit: r.unit, qty: 0 };
        }
        stockMap[name].qty += Number(r.returnQuantity) || 0;
      }
    });

    // 4️⃣ Format response
    const stockList = Object.values(stockMap).map((item) => ({
      itemName: item.itemName,
      unit: item.unit,
      qty: item.qty < 0 ? 0 : item.qty, // prevent negative stock
    }));

    res.json(stockList);
  } catch (err) {
    console.error("❌ Error computing live stock:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock",
      error: err.message,
    });
  }
});

module.exports = router;
//updated delete button