const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    githubId: String,
    username: String,
    avatar: String,
    email: String,
    accessToken: String,
    dailyUsage: {
      type: Number,
      default: 0,
    },
    totalUsage: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      default: "user",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
