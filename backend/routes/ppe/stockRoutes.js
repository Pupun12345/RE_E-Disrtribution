const express = require("express");
const router = express.Router();
const Stock = require("../../models/ppe/Stock");

// ✅ Get stock list
router.get("/", async (req, res) => {
  const stock = await Stock.find();
  res.json(stock);
});

module.exports = router;
