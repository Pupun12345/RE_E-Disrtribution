const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, default: null },
    lastname: { type: String, default: null },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.+-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "vendor", "user"],
      default: "user",
    },
    token: { type: String, default: null },
  },
  { timestamps: true }
);
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
