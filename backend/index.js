require("dotenv").config();
require("./config/database").connect();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Vendor = require("./models/Vendor");
const auth = require("./middleware/auth");
const purchaseRoutes = require("./routes/ppe/purchaseRoutes");
const stockRoutes = require("./routes/ppe/stockRoutes");
const itemRoutes = require("./routes/ppe/itemRoutes");
const distributionRoutes = require("./routes/ppe/distributionRoute");
const mechanicalItemRoutes = require("./routes/mechanical/itemRoutes");
const mechanicalPurchaseRoutes = require("./routes/mechanical/purchaseRoutes");
const mechanicalDistributionRoutes = require("./routes/mechanical/distributionRoutes");
const mechanicalStockRoutes = require("./routes/mechanical/stockRoutes");
const mechanicalReturnRoutes = require("./routes/mechanical/returnRoutes");
const scaffoldingItemRoutes = require("./routes/scaffolding/scaffoldingItemRoutes");
const scaffoldingPurchaseRoutes = require("./routes/scaffolding/scaffoldingPurchaseRoutes");
const scaffoldingDistributionRoutes = require("./routes/scaffolding/scaffoldingDistributionRoutes");
const scaffoldingStockRoutes = require("./routes/scaffolding/scaffoldingstockRoutes");
const scaffoldingReturnRoutes = require("./routes/scaffolding/scaffoldingReturnRoutes");


const app = express();

// =============================
// Middleware
// =============================
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000", // frontend URL
    credentials: true,
  })
);

app.use("/api/purchases", purchaseRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/distribution", distributionRoutes); // ✅ NEW
app.use("/api/mechanical/items", mechanicalItemRoutes);
app.use("/api/mechanical/purchases", mechanicalPurchaseRoutes);
app.use("/api/mechanical/distribution", mechanicalDistributionRoutes);
app.use("/api/mechanical/stock", mechanicalStockRoutes);
app.use("/api/mechanical/returns", mechanicalReturnRoutes); // <-- matches frontend `/api/returns`
app.use("/api/scaffolding-items", scaffoldingItemRoutes);
app.use("/api/scaffolding-purchases", scaffoldingPurchaseRoutes);
app.use("/api/scaffolding-distribution", scaffoldingDistributionRoutes);
app.use("/api/scaffolding-stock", scaffoldingStockRoutes);
app.use("/api/scaffolding-returns", scaffoldingReturnRoutes);

// =============================
// Health Check
// =============================
app.get("/", (req, res) => {
  res.send("✅ Server is up and running");
});

// =============================
// Register User
// =============================
app.post("/register", async (req, res) => {
  try {
    const { firstname, lastname, email, password, role } = req.body;

    if (!(firstname && lastname && email && password)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstname,
      lastname,
      email: email.toLowerCase(),
      password: encryptedPassword,
      role: role || "user",
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    user.token = token;
    user.password = undefined;

    await user.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      role: user.role,
      username: user.firstname,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      success: false,
      message: "Error registering user",
    });
  }
});

// =============================
// Login User
// =============================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    user.token = token;
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      role: user.role,
      username: user.firstname || user.email,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
});

// =============================
// Protected Route Example
// =============================
app.get("/protected", auth, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Access granted",
    user: req.user,
  });
});

// =============================
// Register Vendor (Protected)
// =============================
app.post("/api/vendors", auth, async (req, res) => {
  try {
    const { partyName, address, gstNumber, contactNumber } = req.body;

    if (!(partyName && address && gstNumber && contactNumber)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const vendor = await Vendor.create({
      partyName,
      address,
      gstNumber,
      contactNumber,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Vendor registered successfully",
      vendor,
    });
  } catch (error) {
    console.error("Error registering vendor:", error);
    res.status(500).json({
      success: false,
      message: "Server error while registering vendor",
    });
  }
});

// =============================
// Fetch All Vendors (Protected)
// =============================
app.get("/api/vendors", auth, async (req, res) => {
  try {
    const vendors = await Vendor.find().populate("createdBy", "firstname email");
    res.status(200).json({
      success: true,
      vendors,
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching vendors",
    });
  }
});

// =============================
// Delete Vendor by ID (Protected)
// =============================
app.delete("/api/vendors/:id", auth, async (req, res) => {
  try {
    const vendorId = req.params.id;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    await Vendor.findByIdAndDelete(vendorId);

    res.status(200).json({
      success: true,
      message: "Vendor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting vendor",
    });
  }
});


// =============================
// Start Server
// =============================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 SERVER running on http://localhost:${PORT}`);
});
