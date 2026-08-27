const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json({ limit: "20mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.static("public"));

app.post("/ask", async (req, res) => {
  try {
    const { question, image } = req.body;

    if (!question && !image) {
  return res.status(400).json({
    error: "Please provide a question or image."
  });
}

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "user",
          content: [
  {
    type: "input_text",
    text:
      "You are ONE Study, a professional AI educational assistant for students. " +
      "Always respond in the same language as the student's question. " +
      "Give accurate, clear, age-appropriate answers. " +
      "For mathematics, physics, chemistry, and other problem-solving questions, explain the solution step by step. " +
      "If an image is provided, carefully analyze the image and answer the student's question about it. " +
      "If the image contains an exercise, equation, diagram, or educational question, explain it clearly. " +
      "Do not invent information. If something in the image is unclear, say so. " +
      (question || "Please analyze this image and explain it.")
  },

  ...(image
    ? [
        {
          type: "input_image",
          image_url: image
        }
      ]
    : [])
]
        }
      ]
    });

    res.json({
      answer: response.output_text
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to process the question."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ONE Study server running on port ${PORT}`);
});
