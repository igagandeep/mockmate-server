const Interview = require("../models/Interview");
const { generateText, generateObject } = require("ai");
const { google } = require("@ai-sdk/google");
const { z } = require("zod");

const createInterview = async (req, res) => {
  try {
    const { role, experienceLevel, interviewType, numQuestions } = req.body;
    const userId = req.user.id;
    // Build prompt for Gemini
    const prompt = `
      Prepare exactly ${numQuestions} ${interviewType} interview questions for the role "${role}" at ${experienceLevel} level.
      Return them as a JSON array like: ["Q1", "Q2", ..., "Q${numQuestions}"]
      Do not include explanations or markdown.
      `.trim();

    const { text: aiOutput } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt,
    });

    // Parse questions
    const match = aiOutput.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array in AI output");

    let questions = JSON.parse(match[0]);
    questions = questions.slice(0, numQuestions);

    // Create interview in MongoDB
    const interview = await Interview.create({
      userId,
      role,
      experienceLevel,
      interviewType,
      numQuestions,
      questions,
      status: "ready",
    });

    res.json({ success: true, interviewId: interview._id });
  } catch (error) {
    console.error("Error creating interview:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user.id });
    res.json({ success: true, interviews });
  } catch (error) {
    console.error("Error fetching interviews:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getInterview = async (req, res) => {
  try {
    const interviewId = req.params.id;
    const userId = req.user.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId: userId,
    });

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    res.json({ success: true, interview });
  } catch (error) {
    console.error("Error fetching interview:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteInterview = async (req, res) => {
  try {
    const interviewId = req.params.id;
    const userId = req.user.id;

    const interview = await Interview.findOneAndDelete({
      _id: interviewId,
      userId: userId,
    });

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    res.json({ success: true, message: "Interview deleted" });
  } catch (error) {
    console.error("Error deleting interview:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const saveTranscript = async (req, res) => {
  try {
    const interviewId = req.params.id;
    const userId = req.user.id;
    const { transcript } = req.body;

    if (!Array.isArray(transcript) || transcript.length === 0) {
      return res
        .status(400)
        .json({ message: "Transcript must be a non-empty array" });
    }

    // Validate each entry
    const formattedTranscript = transcript.map((turn) => ({
      speaker: turn.speaker,
      text: turn.text,
      timestamp: turn.timestamp ? new Date(turn.timestamp) : new Date(),
    }));

    const interview = await Interview.findOneAndUpdate(
      { _id: interviewId, userId: userId },
      {
        $set: {
          transcript: formattedTranscript,
          status: "completed",
        },
      },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    res.json({ success: true, interview });
  } catch (error) {
    console.error("Error saving transcript:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const feedbackSchema = z.object({
  totalScore: z.number(),
  categoryScores: z.array(
    z.object({
      name: z.string(),
      score: z.number(),
      comment: z.string(),
    })
  ),
  strengths: z.string(),
  areasForImprovement: z.string(),
  finalAssessment: z.string(),
});

const generateFeedback = async (req, res) => {
  try {
    const interviewId = req.params.id;
    const userId = req.user.id;

    // 1. Load the interview
    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (!interview.transcript || interview.transcript.length === 0) {
      return res.status(400).json({ message: "Transcript is empty" });
    }

    // 2. Format transcript
    const formattedTranscript = interview.transcript
      .map((turn) => `- ${turn.speaker}: ${turn.text}`)
      .join("\n");

    // 3. Call Gemini
    const {
      object: {
        totalScore,
        categoryScores,
        strengths,
        areasForImprovement,
        finalAssessment,
      },
    } = await generateObject({
      model: google("gemini-1.5-flash"),
      schema: feedbackSchema,
      prompt: `You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    // 4. Save feedback in Interview
    interview.feedback = {
      totalScore,
      categoryScores,
      strengths,
      areasForImprovement,
      finalAssessment,
      createdAt: new Date(),
    };

    interview.finalized = true;

    await interview.save();

    res.json({ success: true, feedback: interview.feedback });
  } catch (error) {
    console.error("Error generating feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getFeedbackByInterviewId = async (req, res) => {
  try {
    const interviewId = req.params.id;
    const userId = req.user.id;

    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    res.json({
      success: true,
      feedback: interview.feedback,
      finalized: interview.finalized,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createInterview,
  getInterviews,
  getInterview,
  deleteInterview,
  saveTranscript,
  generateFeedback,
  getFeedbackByInterviewId,
};
