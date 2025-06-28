const express = require("express");
const router = express.Router();
const {
  createInterview,
  getInterviews,
  getInterview,
  deleteInterview,
} = require("../controllers/interviewController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createInterview);
router.get("/", authMiddleware, getInterviews);
router.get("/:id", authMiddleware, getInterview);
router.delete("/:id", authMiddleware, deleteInterview);


module.exports = router;
