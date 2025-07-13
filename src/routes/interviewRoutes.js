const express = require("express");
const router = express.Router();
const {
  createInterview,
  getInterviews,
  getInterview,
  deleteInterview,
  saveTranscript,
  generateFeedback,
  getFeedbackByInterviewId,
} = require("../controllers/interviewController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createInterview);
router.get("/", authMiddleware, getInterviews);
router.get("/:id", authMiddleware, getInterview);
router.delete("/:id", authMiddleware, deleteInterview);
router.patch("/:id/transcript", authMiddleware, saveTranscript);
router.post("/:id/feedback", authMiddleware, generateFeedback);
router.get("/:id/feedback", authMiddleware, getFeedbackByInterviewId);

module.exports = router;
