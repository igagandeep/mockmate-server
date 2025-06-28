const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const app = express();
dotenv.config();

// Middleware
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`✅ Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
