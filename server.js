const express = require("express");
const OpenAI = require("openai");

const app = express();


/* =========================================================
   EXPRESS
   ========================================================= */

app.use(
  express.json({
    limit: "30mb"
  })
);

app.use(
  express.static("public")
);


/* =========================================================
   OPENAI
   ========================================================= */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


/* =========================================================
   STUDY PROMPT — STRUCTURED BLOCKS V2
   ========================================================= */

function buildStudyPrompt(question, hasImage) {

  return `
أنت مساعد دراسي عربي متخصص في قراءة وشرح وحل الأسئلة التعليمية للطلاب.

مهمتك:
اقرأ السؤال بعناية شديدة، وافهم المطلوب كاملاً، ثم قدم حلاً صحيحاً ومنظماً وواضحاً باللغة العربية.

==================================================
1. قراءة السؤال
==================================================

${hasImage
  ? `
هناك صورة مرفقة تحتوي على سؤال دراسي.

يجب عليك:

- قراءة الصورة بعناية.
- استخراج جميع المعلومات المطلوبة منها.
- قراءة الرموز والأرقام والمعادلات بدقة.
- إذا احتوت الصورة على أكثر من سؤال أو جزء، أجب عن جميع الأجزاء.
- لا تتجاهل أي شرط ظاهر في الصورة.
- لا تخترع معلومات غير موجودة.
- إذا كان جزء أساسي من الصورة غير واضح فعلاً، وضح ذلك بدلاً من التخمين.
`
  : `
لا توجد صورة مرفقة.
اعتمد على السؤال النصي الذي كتبه الطالب.
`
}

${question
  ? `
==================================================
سؤال الطالب
==================================================

${question}
`
  : ""
}


==================================================
2. أسلوب الحل
==================================================

قدم حلاً تعليمياً واضحاً باللغة العربية.

اشرح الخطوات الأساسية بترتيب منطقي.

لا تختصر خطوة ضرورية لفهم الحل.

إذا كان السؤال متعدد الأجزاء، أجب عن جميع الأجزاء.

عند استخدام قانون أو قاعدة مهمة، وضح سبب استخدامها باختصار.

راجع العمليات الحسابية والنتيجة النهائية قبل إرسال الإجابة.

لا تستخدم Markdown.

لا تستخدم code blocks.

لا تستخدم جداول إلا إذا كانت ضرورية جداً.


==================================================
3. نظام Structured Blocks V2
==================================================

الإجابة تتكون من blocks منظمة.

كل block يجب أن يكون واحداً فقط من الأنواع التالية:

heading
paragraph
math


==================================================
4. heading
==================================================

استخدم heading للعناوين فقط.

أمثلة:

الحل

إيجاد قيم a

معادلات المماس

النتيجة النهائية

محتوى heading يجب أن يكون نصاً فقط.

ممنوع وضع LaTeX داخل heading.


==================================================
5. paragraph
==================================================

استخدم paragraph للشرح والجمل.

كل paragraph يحتوي على segments.

كل segment يجب أن يكون أحد النوعين:

text
inline_math


==================================================
6. text داخل paragraph
==================================================

استخدم text للكلمات والجمل العربية فقط.

مثال:

"بما أن ميل المستقيم المعطى يساوي "

ممنوع وضع أي LaTeX داخل text.

ممنوع وضع معادلات داخل text.

ممنوع كتابة:

a=2+\\sqrt{2}

داخل text.

ممنوع كتابة:

f'(a)=3

داخل text.

ممنوع كتابة:

y=3x-7

داخل text.

أي تعبير رياضي داخل الجملة يجب أن يكون في inline_math منفصل.


==================================================
7. inline_math
==================================================

استخدم inline_math للرياضيات القصيرة التي تظهر داخل جملة عربية.

مثال:

paragraph:

text:
بما أن ميل المستقيم

inline_math:
y=3x-7

text:
هو

inline_math:
3

text:
، فإن شرط التوازي يعطي

inline_math:
f'(a)=3

text:
.


مثال آخر:

text:
معادلة المماس عند

inline_math:
a=2+\\sqrt{2}

text:
هي:


==================================================
8. math
==================================================

استخدم math للمعادلات المستقلة أو خطوات الحساب المهمة.

مثال:

f'(x)=3x^2-12x+9

مثال:

3a^2-12a+9=3

مثال:

a^2-4a+2=0

مثال:

a=2\\pm\\sqrt{2}

مثال:

y=3x-4\\sqrt{2}


==================================================
9. قواعد LaTeX
==================================================

محتوى math و inline_math يجب أن يحتوي على LaTeX خام فقط.

لا تستخدم:

\$begin:math:display$
\\$end:math:display$

ولا:

\$begin:math:text$
\\$end:math:text$

ولا:

$

ولا:

$$

ولا:

begin:math

ولا Markdown.


استخدم:

x^2

للأس.


استخدم:

a_1

للرمز السفلي.


استخدم:

\\sqrt{2}

للجذر.


استخدم:

\\frac{a}{b}

للكسر.


استخدم:

\\pm

للزائد أو الناقص.


استخدم:

\\times

للضرب.


استخدم:

\\Rightarrow

للاستنتاج عند الحاجة.


==================================================
10. قاعدة الفصل بين النص والرياضيات
==================================================

هذه قاعدة إلزامية.

لا تضع LaTeX داخل segment من النوع text.

إذا كانت الجملة:

معادلة المماس عند a=2+√2 هي:

يجب تقسيمها إلى:

text:
معادلة المماس عند

inline_math:
a=2+\\sqrt{2}

text:
هي:


ولا تكتب:

text:
معادلة المماس عند a=2+\\sqrt{2} هي:


==================================================
11. منع التكرار
==================================================

لا تكرر المعادلة نفسها كنص وكرياضيات.

إذا ظهرت معادلة في math فلا تكتب نسخة نصية مطابقة لها.

إذا استخدمت inline_math داخل جملة، فلا تكرر نفس التعبير مباشرة كنص عادي.

كل تعبير رياضي يجب أن يظهر مرة واحدة فقط في الموضع المطلوب.


==================================================
12. المعادلات الطويلة
==================================================

راعِ شاشة الهاتف.

لا تجمع سلسلة طويلة جداً من العمليات في math واحد.

بدلاً من:

3a^2-12a+9=3\\Rightarrow3a^2-12a+6=0\\Rightarrow a^2-4a+2=0

استخدم:

math:
3a^2-12a+9=3

math:
3a^2-12a+6=0

math:
a^2-4a+2=0


==================================================
13. مسائل التفاضل والمماس
==================================================

إذا كان السؤال متعلقاً بالمماس أو المشتقة:

- حدد ميل المستقيم المعطى.
- احسب المشتقة بصورة صحيحة.
- طبق شرط المماس أو التوازي.
- أوجد جميع القيم المطلوبة.
- لا تتوقف عند قيمة واحدة إذا كان هناك أكثر من حل.
- عوض عن كل قيمة بصورة مستقلة عند الحاجة.
- استخرج معادلة كل مماس بوضوح.
- تحقق من النتائج.


==================================================
14. النتيجة النهائية
==================================================

في نهاية الحل استخدم:

heading:
النتيجة النهائية

ثم استخدم paragraph للشرح.

واستخدم math للنتائج الرياضية المهمة.

مثال:

heading:
النتيجة النهائية

paragraph:
text:
قيم

inline_math:
a

text:
التي تجعل المماس موازياً للمستقيم المعطى هي:

math:
a=2\\pm\\sqrt{2}

paragraph:
text:
ومعادلات المماس هي:

math:
y=3x-4\\sqrt{2}

math:
y=3x+4\\sqrt{2}


==================================================
15. الفحص الإلزامي
==================================================

قبل إرسال الإجابة تأكد من:

- الحل صحيح.
- تمت الإجابة عن جميع أجزاء السؤال.
- لا توجد معادلات مكررة.
- لا يوجد LaTeX داخل text.
- لا يوجد LaTeX داخل heading.
- الرياضيات القصيرة داخل الجمل موجودة في inline_math.
- المعادلات المستقلة موجودة في math.
- لا توجد delimiters حول LaTeX.
- لا توجد Markdown code blocks.
- لا توجد كتابة مثل x2 بدلاً من x^2.
- لا توجد كتابة مثل sqrt(2) بدلاً من \\sqrt{2}.
- جميع الجذور والكسور والأسس صحيحة.
- المعادلات الطويلة مقسمة بما يناسب الهاتف.
- النتيجة النهائية واضحة وغير مكررة.
`;

}


/* =========================================================
   STRUCTURED OUTPUT SCHEMA — V2
   ========================================================= */

const studyAnswerSchema = {

  type: "object",

  properties: {

    blocks: {

      type: "array",

      items: {

        anyOf: [

          /* =================================================
             HEADING
             ================================================= */

          {
            type: "object",

            properties: {

              type: {
                type: "string",
                enum: ["heading"]
              },

              content: {
                type: "string"
              }

            },

            required: [
              "type",
              "content"
            ],

            additionalProperties: false
          },


          /* =================================================
             PARAGRAPH
             ================================================= */

          {
            type: "object",

            properties: {

              type: {
                type: "string",
                enum: ["paragraph"]
              },

              segments: {

                type: "array",

                items: {

                  type: "object",

                  properties: {

                    type: {
                      type: "string",
                      enum: [
                        "text",
                        "inline_math"
                      ]
                    },

                    content: {
                      type: "string"
                    }

                  },

                  required: [
                    "type",
                    "content"
                  ],

                  additionalProperties: false

                }

              }

            },

            required: [
              "type",
              "segments"
            ],

            additionalProperties: false
          },


          /* =================================================
             DISPLAY MATH
             ================================================= */

          {
            type: "object",

            properties: {

              type: {
                type: "string",
                enum: ["math"]
              },

              content: {
                type: "string"
              }

            },

            required: [
              "type",
              "content"
            ],

            additionalProperties: false
          }

        ]

      }

    }

  },

  required: [
    "blocks"
  ],

  additionalProperties: false

};


/* =========================================================
   HELPERS
   ========================================================= */

function cleanString(value) {

  if (
    typeof value !== "string"
  ) {

    return "";

  }

  return value.trim();

}


/* =========================================================
   CLEAN STRUCTURED BLOCKS
   ========================================================= */

function cleanStructuredBlocks(blocks) {

  if (
    !Array.isArray(blocks)
  ) {

    return [];

  }


  const cleanBlocks = [];


  for (
    const block of blocks
  ) {

    if (
      !block ||
      typeof block !== "object"
    ) {

      continue;

    }


    /* =====================================================
       HEADING
       ===================================================== */

    if (
      block.type === "heading"
    ) {

      const content =
        cleanString(
          block.content
        );


      if (content) {

        cleanBlocks.push({

          type: "heading",

          content: content

        });

      }


      continue;

    }


    /* =====================================================
       MATH
       ===================================================== */

    if (
      block.type === "math"
    ) {

      const content =
        cleanString(
          block.content
        );


      if (content) {

        cleanBlocks.push({

          type: "math",

          content: content

        });

      }


      continue;

    }


    /* =====================================================
       PARAGRAPH
       ===================================================== */

    if (
      block.type === "paragraph" &&
      Array.isArray(
        block.segments
      )
    ) {

      const cleanSegments = [];


      for (
        const segment of block.segments
      ) {

        if (
          !segment ||
          typeof segment !== "object"
        ) {

          continue;

        }


        if (
          segment.type !== "text" &&
          segment.type !== "inline_math"
        ) {

          continue;

        }


        const content =
          cleanString(
            segment.content
          );


        if (!content) {

          continue;

        }


        cleanSegments.push({

          type:
            segment.type,

          content:
            content

        });

      }


      if (
        cleanSegments.length > 0
      ) {

        cleanBlocks.push({

          type: "paragraph",

          segments:
            cleanSegments

        });

      }

    }

  }


  return cleanBlocks;

}


/* =========================================================
   POST /ask
   ========================================================= */

app.post(
  "/ask",
  async (req, res) => {

    try {

      const {
        question,
        image
      } = req.body || {};


      /* =====================================================
         VALIDATION
         ===================================================== */

      const cleanQuestion =
        typeof question === "string"
          ? question.trim()
          : "";


      if (
        !cleanQuestion &&
        !image
      ) {

        return res
          .status(400)
          .json({
            error:
              "اكتب سؤالاً أو اختر صورة أولاً."
          });

      }


      if (
        !process.env.OPENAI_API_KEY
      ) {

        return res
          .status(500)
          .json({
            error:
              "مفتاح OpenAI غير موجود في إعدادات الخادم."
          });

      }


      /* =====================================================
         BUILD INPUT
         ===================================================== */

      const content = [];


      const prompt =
        buildStudyPrompt(
          cleanQuestion,
          Boolean(image)
        );


      content.push({

        type: "input_text",

        text: prompt

      });


      /* =====================================================
         IMAGE
         ===================================================== */

      if (image) {

        content.push({

          type: "input_image",

          image_url: image

        });

      }


      /* =====================================================
         OPENAI
         ===================================================== */

      const response =
        await openai.responses.create({

          model:
            "gpt-5-mini",

          input: [

            {

              role: "user",

              content:
                content

            }

          ],


          /* =================================================
             STRUCTURED OUTPUT
             ================================================= */

          text: {

            format: {

              type:
                "json_schema",

              name:
                "study_answer_v2",

              strict:
                true,

              schema:
                studyAnswerSchema

            }

          }

        });


      /* =====================================================
         OUTPUT TEXT
         ===================================================== */

      const outputText =
        response.output_text;


      if (
        !outputText ||
        !outputText.trim()
      ) {

        return res
          .status(500)
          .json({
            error:
              "تمت معالجة السؤال ولكن لم تصل إجابة منظمة."
          });

      }


      /* =====================================================
         PARSE
         ===================================================== */

      let structuredAnswer;


      try {

        structuredAnswer =
          JSON.parse(
            outputText
          );

      } catch (parseError) {

        console.error(
          "STRUCTURED OUTPUT PARSE ERROR:",
          parseError
        );


        console.error(
          "RAW OUTPUT:",
          outputText
        );


        return res
          .status(500)
          .json({
            error:
              "تعذر قراءة الإجابة المنظمة من النموذج."
          });

      }


      /* =====================================================
         STRUCTURE CHECK
         ===================================================== */

      if (
        !structuredAnswer ||
        !Array.isArray(
          structuredAnswer.blocks
        )
      ) {

        return res
          .status(500)
          .json({
            error:
              "الإجابة المنظمة لا تحتوي على blocks صحيحة."
          });

      }


      /* =====================================================
         CLEAN
         ===================================================== */

      const cleanBlocks =
        cleanStructuredBlocks(
          structuredAnswer.blocks
        );


      if (
        cleanBlocks.length === 0
      ) {

        return res
          .status(500)
          .json({
            error:
              "وصلت إجابة ولكنها لا تحتوي على محتوى صالح للعرض."
          });

      }


      /* =====================================================
         SEND STRUCTURED BLOCKS V2
         ===================================================== */

      return res.json({

        version: 2,

        blocks:
          cleanBlocks

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


      return res
        .status(500)
        .json({
          error:
            message
        });

    }

  }
);


/* =========================================================
   SERVER
   ========================================================= */

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
