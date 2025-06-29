const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  q: String,
  generatedAt: Date,
});

const transcriptTurnSchema = new mongoose.Schema({
  speaker: { type: String, enum: ["user", "ai"] },
  text: String,
  timestamp: { type: Date, default: Date.now },
});

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    experienceLevel: {
      type: String,
      required: true,
      enum: ["junior", "mid", "senior"],
    },
    interviewType: {
      type: String,
      required: true,
      enum: ["technical", "behavioral", "general"],
    },
    numQuestions: {
      type: Number,
      default: 3,
    },
    questions: [questionSchema],
    transcript: [transcriptTurnSchema],
    feedback: {
      totalScore: Number,
      categoryScores: {
        communication: Number,
        technicalKnowledge: Number,
        problemSolving: Number,
        culturalFit: Number,
        confidence: Number,
      },
      strengths: String,
      areasForImprovement: String,
      finalAssessment: String,
      createdAt: Date,
    },
    status: {
      type: String,
      enum: ["pending", "ready", "in-progress", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);
