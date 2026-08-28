const express = require("express");
const OpenAI = require("openai");

const app = express();

/* =========================
   إعدادات Express
   ========================= */

app.use(
  express.json({
    limit: "20mb"
  })
);

app.use(
  express.static("public")
);


/* =========================
   OpenAI
   ========================= */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


/* =========================
   تعليمات المساعد الدراسي
   ========================= */

function buildStudyPrompt(question, hasImage) {

  return `
أنت مساعد دراسي عربي متخصص في شرح وحل الأسئلة التعليمية للطلاب.

مهمتك:
اقرأ السؤال بعناية شديدة، ثم قدم حلاً صحيحاً ومنظماً وواضحاً باللغة العربية.

${hasImage
  ? `
هناك صورة مرفقة.

اقرأ محتوى الصورة بعناية.
استخرج السؤال أو الأسئلة الظاهرة فيها.
إذا كانت الصورة تحتوي على أكثر من جزء، أجب عن جميع الأجزاء.
لا تخترع أي معلومات غير ظاهرة في الصورة.
`
  : ""
}

${question
  ? `
السؤال المكتوب من الطالب:

${question}
`
  : ""
}

قواعد الحل:

1. ابدأ بعنوان واضح مثل:
الحل

2. اشرح خطوات الحل باللغة العربية بشكل مرتب.

3. إذا كان السؤال رياضياً:
- اشرح الفكرة باللغة العربية.
- اعرض خطوات الحل بالتسلسل.
- تحقق من النتيجة قدر الإمكان.
- اكتب النتيجة النهائية بوضوح.

4. إذا كان السؤال يحتوي على عدة أجزاء:
أجب عن كل جزء على حدة وبالترتيب.

5. لا تختصر الحل اختصاراً يضر بالفهم.

6. لا تذكر أنك ذكاء اصطناعي.

7. لا تستخدم جداول إلا إذا كانت مفيدة فعلاً.


مهم جداً — قواعد تنسيق الرياضيات:

يجب الفصل بين النص العربي والمعادلات الرياضية.

النص العربي يكتب كسطر عربي عادي.

أما أي معادلة رياضية مستقلة فيجب كتابتها بصيغة LaTeX بين:

\$begin:math:display$
المعادلة
\\$end:math:display$

مثال صحيح:

نحسب مشتقة الدالة:

\$begin:math:display$
f\'\(x\)\=3x\^2\-12x\+9
\\$end:math:display$

ثم نساوي المشتقة بميل المستقيم:

\$begin:math:display$
3a\^2\-12a\+9\=3
\\$end:math:display$

ومنها:

\$begin:math:display$
a\=2\\\\pm\\\\sqrt\{2\}
\\$end:math:display$

مثال آخر:

نستخدم قانون الميل:

\$begin:math:display$
m\=\\\\frac\{y\_2\-y\_1\}\{x\_2\-x\_1\}
\\$end:math:display$


قواعد إلزامية:

- لا تضع جملة عربية كاملة داخل \$begin:math:display$ \\$end:math:display$.
- لا تخلط الكلمات العربية داخل المعادلة الرياضية.
- لا تستخدم الرمز √ داخل المعادلات.
- استخدم \\sqrt{} للجذور.
- استخدم \\frac{}{} للكسور.
- استخدم ^{} للأسس.
- استخدم \\pm للزائد أو الناقص.
- استخدم \\times عند الحاجة للضرب.
- استخدم \\le و \\ge عند الحاجة.
- استخدم \\Rightarrow للأسهم المنطقية.
- لا تستخدم Markdown code blocks.
- لا تضع المعادلات بين backticks.
- لا تستخدم علامات الدولار $ للرياضيات.
- استخدم فقط \$begin:math:text$ \.\.\. \\$end:math:text$ للرياضيات القصيرة داخل النص عند الضرورة.
- استخدم \$begin:math:display$ \.\.\. \\$end:math:display$ للمعادلات المهمة والمستقلة.

عند ذكر قيمة رياضية داخل جملة عربية، استخدم:

\$begin:math:text$ a\=2 \\$end:math:text$

وليس كتابتها مباشرة بطريقة قد تسبب اختلاط اتجاه النص.

مثال:

إذن قيم المتغير هي \$begin:math:text$a\=2\\\\pm\\\\sqrt\{2\}\\$end:math:text$.

وعند عرض النتيجة النهائية يفضل:

النتيجة النهائية:

\$begin:math:display$
a\=2\\\\pm\\\\sqrt\{2\}
\\$end:math:display$

حافظ على وضوح اللغة العربية ودقة الرموز الرياضية.
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
        image
      } = req.body || {};


      /* =========================
         التحقق من المدخلات
         ========================= */

      if (!question && !image) {

        return res.status(400).json({
          error:
            "اكتب سؤالاً أو اختر صورة أولاً."
        });

      }


      /* =========================
         التحقق من المفتاح
         ========================= */

      if (!process.env.OPENAI_API_KEY) {

        return res.status(500).json({
          error:
            "مفتاح OpenAI غير موجود في إعدادات الخادم."
        });

      }


      /* =========================
         تجهيز محتوى الطلب
         ========================= */

      const content = [];


      const studyPrompt =
        buildStudyPrompt(
          question || "",
          Boolean(image)
        );


      content.push({
        type: "input_text",
        text: studyPrompt
      });


      /* =========================
         إضافة الصورة
         ========================= */

      if (image) {

        content.push({
          type: "input_image",
          image_url: image
        });

      }


      /* =========================
         إرسال الطلب إلى OpenAI
         ========================= */

      const response =
        await openai.responses.create({

          model: "gpt-5-mini",

          input: [
            {
              role: "user",
              content: content
            }
          ]

        });


      /* =========================
         استخراج الإجابة
         ========================= */

      const answer =
        response.output_text;


      if (!answer) {

        return res.status(500).json({
          error:
            "تمت معالجة السؤال ولكن لم تصل إجابة نصية."
        });

      }


      /* =========================
         إرسال الإجابة للواجهة
         ========================= */

      return res.json({
        answer: answer
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
   تشغيل الخادم
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
