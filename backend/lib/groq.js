const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// ─────────────────────────────────────────────
// Clean JSON response
// ─────────────────────────────────────────────
function cleanJSON(text) {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

// ─────────────────────────────────────────────
// Ask AI
// ─────────────────────────────────────────────
async function askAI(prompt) {
  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
  });

  return completion.choices[0].message.content;
}

// ─────────────────────────────────────────────
// Generate Summary
// ─────────────────────────────────────────────
const generateSummary = async (text) => {
  const prompt = `
Create a structured study summary of this lesson.

Return ONLY valid JSON.

Format:
{
  "title": "",
  "overview": "",
  "keyPoints": [],
  "conclusion": ""
}

Lesson:
${text}
`;

  const response = await askAI(prompt);
  return JSON.parse(cleanJSON(response));
};

// ─────────────────────────────────────────────
// Generate Quiz
// ─────────────────────────────────────────────
const generateQuiz = async (text) => {
  const prompt = `
Create a multiple choice quiz from this lesson.

Return ONLY valid JSON.

Format:
{
  "title": "",
  "questions": [
    {
      "question": "",
      "options": ["", "", "", ""],
      "correctIndex": 0
    }
  ]
}

Lesson:
${text}
`;

  const response = await askAI(prompt);
  return JSON.parse(cleanJSON(response));
};

// ─────────────────────────────────────────────
// Generate Flashcards
// ─────────────────────────────────────────────
const generateFlashcards = async (text) => {
  const prompt = `
Create flashcards from this lesson.

Return ONLY valid JSON.

Format:
{
  "title": "",
  "cards": [
    {
      "front": "",
      "back": ""
    }
  ]
}

Lesson:
${text}
`;

  const response = await askAI(prompt);
  return JSON.parse(cleanJSON(response));
};

// ─────────────────────────────────────────────
// Answer Question
// ─────────────────────────────────────────────
const answerQuestion = async (question) => {
  const prompt = `
Answer this academic question clearly.

Return ONLY valid JSON.

Format:
{
  "answer": "",
  "keyPoints": []
}

Question:
${question}
`;

  const response = await askAI(prompt);
  return JSON.parse(cleanJSON(response));
};

module.exports = {
  generateSummary,
  generateQuiz,
  generateFlashcards,
  answerQuestion
};