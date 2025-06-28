const Interview = require("../models/Interview");
const { generateText } = require("ai");
const { google } = require("@ai-sdk/google");

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

    // Format for schema
    const formattedQuestions = questions.map((q) => ({
      q,
      generatedAt: new Date(),
    }));

    // Create interview in MongoDB
    const interview = await Interview.create({
      userId,
      role,
      experienceLevel,
      interviewType,
      numQuestions,
      questions: formattedQuestions,
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

module.exports = { createInterview, getInterviews, getInterview, deleteInterview };
