const express = require("express");
const OpenAI = require("openai");

const app = express();


/* =========================
   EXPRESS
   ========================= */

app.use(
  express.json({
    limit: "30mb"
  })
);

app.use(
  express.static("public")
);


/* =========================
   OPENAI
   ========================= */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


/* =========================
   STUDY PROMPT
   ========================= */

function buildStudyPrompt(
  question,
  hasImage,
  hasFile
) {

  return `
أنت مساعد دراسي عربي متخصص في شرح وحل الأسئلة التعليمية للطلاب.

المطلوب:
اقرأ جميع المدخلات المرسلة إليك بعناية، ثم قدم إجابة صحيحة ومنظمة وواضحة باللغة العربية.

${hasImage
  ? `
هناك صورة مرفقة.
اقرأ السؤال الموجود في الصورة بدقة.
إذا احتوت الصورة على أكثر من سؤال أو جزء فأجب عن جميع الأجزاء.
لا تخترع معلومات غير ظاهرة في الصورة.
`
  : ""
}

${hasFile
  ? `
هناك ملف دراسي مرفق.
اقرأ محتوى الملف واستفد منه في فهم السؤال والإجابة عنه.
إذا كان المطلوب تلخيص الملف أو حل أسئلة داخله، نفذ المطلوب بشكل مرتب.
`
  : ""
}

${question
  ? `
سؤال الطالب:

${question}
`
  : ""
}

قواعد الإجابة:

1. استخدم اللغة العربية الواضحة.
2. ابدأ بعنوان مناسب مثل: الحل.
3. اشرح خطوات الحل بترتيب منطقي.
4. إذا كان السؤال يحتوي على أكثر من جزء، أجب عن كل جزء.
5. لا تخترع معلومة غير موجودة في السؤال أو الملف أو الصورة.
6. عند عدم وضوح جزء من الصورة أو الملف، وضح ذلك بدل التخمين.
7. لا تستخدم Markdown code blocks في الإجابة.

قواعد الرياضيات:

- افصل المعادلات المهمة عن النص العربي.
- استخدم LaTeX للرياضيات.

المعادلة المستقلة تكتب هكذا:

\$begin:math:display$
f\(x\)\=x\^2\+3x\+2
\\$end:math:display$

والرياضيات القصيرة داخل النص تكتب هكذا:

\$begin:math:text$x\=2\\$end:math:text$

استخدم:
\\sqrt{} للجذور.
\\frac{}{} للكسور.
^{} للأسس.
\\pm للزائد أو الناقص.
\\times للضرب.
\\Rightarrow عند الحاجة.

لا تضع جملة عربية كاملة داخل معادلة LaTeX.

في النهاية اذكر النتيجة النهائية بوضوح إذا كان السؤال يتطلب نتيجة.
`;

}


/* =========================
   POST /ask
   ========================= */

app.post(
  "/ask",
  async (req, res) => {

    try {

      const {
        question,
        image,
        file
      } = req.body || {};


      /* =====================
         VALIDATION
         ===================== */

      if (
        !question &&
        !image &&
        !file
      ) {

        return res.status(400).json({
          error:
            "اكتب سؤالاً أو اختر صورة أو أرفق ملفاً."
        });

      }


      if (
        !process.env.OPENAI_API_KEY
      ) {

        return res.status(500).json({
          error:
            "مفتاح OpenAI غير موجود في إعدادات الخادم."
        });

      }


      /* =====================
         CONTENT
         ===================== */

      const content = [];


      const prompt =
        buildStudyPrompt(
          question || "",
          Boolean(image),
          Boolean(file)
        );


      content.push({
        type: "input_text",
        text: prompt
      });


      /* =====================
         IMAGE
         ===================== */

      if (image) {

        content.push({
          type: "input_image",
          image_url: image
        });

      }


      /* =====================
         FILE
         ===================== */

      if (
        file &&
        file.data
      ) {

        content.push({
          type: "input_file",

          file_data:
            file.data,

          filename:
            file.name ||
            "student-file"
        });

      }


      /* =====================
         OPENAI RESPONSE
         ===================== */

      const response =
        await openai.responses.create({

          model:
            "gpt-5-mini",

          input: [
            {
              role: "user",
              content
            }
          ]

        });


      const answer =
        response.output_text;


      if (!answer) {

        return res.status(500).json({
          error:
            "تمت معالجة الطلب ولكن لم تصل إجابة نصية."
        });

      }


      return res.json({
        answer
      });


    } catch (error) {

      console.error(
        "OPENAI ERROR:",
        error
      );


      const message =

        error?.error?.message ||

        error?.message ||

        "حدث خطأ غير معروف أثناء معالجة السؤال.";


      return res.status(500).json({
        error: message
      });

    }

  }
);


/* =========================
   SERVER
   ========================= */

const PORT =
  process.env.PORT ||
  3000;


app.listen(
  PORT,
  () => {

    console.log(
      `ONE Study server running on port ${PORT}`
    );

  }
);
