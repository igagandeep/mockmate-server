const mongoose = require("mongoose");

const transcriptTurnSchema = new mongoose.Schema({
  speaker: { type: String, enum: ["user", "assistant"] },
  text: String,
  timestamp: { type: Date, default: Date.now },
});

const categoryScoreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
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
    questions: [{ type: String }],
    transcript: [transcriptTurnSchema],
    feedback: {
      totalScore: Number,
      categoryScores: {
        type: [categoryScoreSchema],
        default: [],
      },
      strengths: String,
      areasForImprovement: String,
      finalAssessment: String,
      createdAt: Date,
    },
    finalized: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);
