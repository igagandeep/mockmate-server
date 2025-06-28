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

module.exports = { createInterview };
