const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * GET ALL USERS (Admin only)
 */
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const users = await User.find({}, "firstname lastname email role");
    res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * CHANGE PASSWORD (Admin only)
 */
router.put("/change-password/:id", auth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.params.id;

    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 6 characters",
        });
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(userId, { password: encryptedPassword });

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
