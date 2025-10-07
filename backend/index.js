require("dotenv").config();
require("./config/database").connect();

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/user");

const app = express();
app.use(express.json());

// ✅ Health check
app.get("/", (req, res) => {
  res.send("Hello World");
});

// ✅ Register user
app.post("/register", async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    if (!(firstname && lastname && email && password)) {
      return res.status(400).send("All fields are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(401).send("User already exists with this email");
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstname,
      lastname,
      email,
      password: encryptedPassword,
    });

    const token = jwt.sign(
      { id: user._id, email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    user.token = token;
    user.password = undefined;

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error registering user");
  }
});

// ✅ Login user
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      return res.status(400).send("Email and password are required");
    }

    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { id: user._id, email },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      user.token = token;
      user.password = undefined;

      return res.status(200).json({ success: true, token, user });
    }

    res.status(400).send("Invalid credentials");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error logging in");
  }
});

// ✅ Protected route
app.get("/protected", async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.status(401).send("Token is required");
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).send("Invalid token");
      }
      res.status(200).json({ message: "Access granted", user: decoded });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong");
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SERVER is running at port: ${PORT}`);
});
