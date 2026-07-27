const { OpenAI } = require("openai");
const { GoogleGenAI } = require("@google/genai");
const {
  conceptExplainPrompt,
  questionAnswerPrompt,
} = require("../utils/prompts");

// Helper to get Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// Helper to get OpenAI client
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const config = { apiKey };
  if (apiKey.startsWith("sk-or-")) {
    config.baseURL = "https://openrouter.ai/api/v1";
  }
  return new OpenAI(config);
};

// Helper to extract JSON from model responses
const extractJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    // If parsing fails, clean markdown and try again
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch (err) {
      // Find JSON block start and end if formatting is still present
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          return JSON.parse(text.substring(firstBrace, lastBrace + 1));
        } catch (subErr) {}
      }
      const firstBracket = text.indexOf("[");
      const lastBracket = text.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        try {
          return JSON.parse(text.substring(firstBracket, lastBracket + 1));
        } catch (subErr) {}
      }
      throw e; // throw the original error if we couldn't parse
    }
  }
};

// @desc    Generate interview questions and answers using OpenAI or Gemini
// @route   POST /api/ai/generate-questions
// @access  Private
const generateInterviewQuestions = async (req, res) => {
  try {
    const { role, experience, topicsToFocus, numberOfQuestions } = req.body;

    if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const prompt = questionAnswerPrompt(
      role,
      experience,
      topicsToFocus,
      numberOfQuestions,
    );

    const geminiClient = getGeminiClient();
    let data;

    if (geminiClient) {
      const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const response = await geminiClient.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" }
                  },
                  required: ["question", "answer"]
                }
              }
            },
            required: ["questions"]
          }
        }
      });

      const responseText = response.text;
      const parsed = extractJSON(responseText);
      data = parsed.questions || parsed;
    } else {
      const openaiClient = getOpenAIClient();
      if (!openaiClient) {
        return res.status(500).json({
          message: "No AI API keys configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in the environment.",
        });
      }

      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      let rawText = response.choices[0].message.content;
      data = extractJSON(rawText);

      if (data && !Array.isArray(data) && data.questions) {
        data = data.questions;
      }
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error in generateInterviewQuestions:", error);
    res.status(500).json({
      message: "Failed to generate questions",
      error: error.message,
    });
  }
};

// @desc    Generate explanation for an interview question using OpenAI or Gemini
// @route   POST /api/ai/generate-explanation
// @access  Private
const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const prompt = conceptExplainPrompt(question);

    const geminiClient = getGeminiClient();
    let data;

    if (geminiClient) {
      const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const response = await geminiClient.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              explanation: { type: "string" }
            },
            required: ["title", "explanation"]
          }
        }
      });

      data = extractJSON(response.text);
    } else {
      const openaiClient = getOpenAIClient();
      if (!openaiClient) {
        return res.status(500).json({
          message: "No AI API keys configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in the environment.",
        });
      }

      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      let rawText = response.choices[0].message.content;
      data = extractJSON(rawText);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error in generateConceptExplanation:", error);
    res.status(500).json({
      message: "Failed to generate explanation",
      error: error.message,
    });
  }
};

module.exports = {
  generateInterviewQuestions,
  generateConceptExplanation,
};

