require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

// connect to DB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to DB for seeding...");

    // clear existing users
    await User.deleteMany({});

    // create default users with roles
    const users = [
      {
        firstname: "Admin",
        lastname: "User",
        email: "admin@example.com",
        password: await bcrypt.hash("admin123", 10),
        role: "admin", // ✅ Added role
      },
      {
        firstname: "Vendor",
        lastname: "User",
        email: "vendor@example.com",
        password: await bcrypt.hash("vendor123", 10),
        role: "vendor", // ✅ Added role
      },
    ];

    await User.insertMany(users);
    console.log("✅ Users seeded successfully!");
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    mongoose.connection.close();
  });
