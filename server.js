const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json({ limit: "20mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/", (req, res) => {
  res.json({
    status: "ONE Study API is running"
  });
});

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "Please provide a question."
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
                "You are ONE Study, an educational study assistant. " +
                "Answer the student's question clearly, accurately, " +
                "and step by step when appropriate.\n\nQuestion: " +
                question
            }
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
