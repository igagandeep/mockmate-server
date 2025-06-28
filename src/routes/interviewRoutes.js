const express = require("express");
const router = express.Router();
const { createInterview } = require("../controllers/interviewController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createInterview);

module.exports = router;
