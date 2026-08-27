const express = require("express");
const OpenAI = require("openai");

const app = express();

app.use(
  express.json({
    limit: "20mb"
  })
);

app.use(express.static("public"));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/ask", async (req, res) => {
  try {
    const { question, image } = req.body || {};

    if (!question && !image) {
      return res.status(400).json({
        error: "اكتب سؤالاً أو اختر صورة أولاً."
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "مفتاح OpenAI غير موجود في إعدادات الخادم."
      });
    }

    const content = [];

    // إضافة تعليمات السؤال
    content.push({
      type: "input_text",
      text: question
        ? `
أنت مساعد دراسي للطلاب.

حل السؤال التالي بطريقة صحيحة وواضحة ومناسبة للطالب.

المطلوب:
- اقرأ السؤال بعناية.
- إذا كان السؤال رياضياً، وضح خطوات الحل.
- إذا كانت هناك صورة، اقرأ محتواها وحدد السؤال الموجود فيها.
- أجب باللغة المناسبة للسؤال.
- إذا كانت الصورة تحتوي عدة أجزاء مثل Part A وPart B، أجب عن جميع الأجزاء.
- لا تخترع معلومات غير ظاهرة في السؤال أو الصورة.
- اجعل الإجابة منظمة وسهلة الفهم.

السؤال المكتوب:
${question}
`
        : `
أنت مساعد دراسي للطلاب.

اقرأ الصورة المرفقة بعناية وحدد السؤال أو الأسئلة الموجودة فيها.

المطلوب:
- حل جميع الأسئلة الظاهرة في الصورة.
- إذا كان السؤال رياضياً، وضح خطوات الحل.
- إذا كانت هناك أجزاء مثل Part A وPart B وReflect، تعامل معها بوضوح.
- أجب باللغة المناسبة لمحتوى السؤال.
- لا تخترع معلومات غير ظاهرة في الصورة.
- اجعل الإجابة منظمة وسهلة الفهم.
`
    });

    // إضافة الصورة إذا كانت موجودة
    if (image) {
      content.push({
        type: "input_image",
        image_url: image
      });
    }

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "user",
          content: content
        }
      ]
    });

    const answer =
      response.output_text ||
      "تمت معالجة السؤال ولكن لم تصل إجابة نصية.";

    return res.json({
      answer: answer
    });
  } catch (error) {
    console.error("OPENAI ERROR:", error);

    const message =
      error?.error?.message ||
      error?.message ||
      "حدث خطأ غير معروف أثناء معالجة السؤال.";

    return res.status(500).json({
      error: message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`ONE Study server running on port ${PORT}`);
});
