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
   QUESTION TYPES — V3.2
   ========================================================= */

const QUESTION_TYPES = {

  calculation: "مسألة حسابية",

  word_problem: "مسألة لفظية",

  multiple_choice: "اختيار من متعدد",

  true_false: "صح أو خطأ",

  short_answer: "إجابة قصيرة",

  definition: "تعريف أو مفهوم",

  comparison: "مقارنة",

  essay: "سؤال مقالي",

  proof: "برهان أو إثبات",

  multi_part: "سؤال متعدد الأجزاء",

  interpretation: "تفسير أو تحليل",

  other: "سؤال عام"

};


/* =========================================================
   STUDY PROMPT — STRUCTURED BLOCKS V3.3
   ========================================================= */

function buildStudyPrompt(question, hasImage) {

  return `
أنت مساعد دراسي عربي متخصص في قراءة وشرح وحل الأسئلة التعليمية للطلاب.

مهمتك:

1. قراءة السؤال بدقة.
2. تحديد نوع السؤال.
3. اختيار طريقة الحل المناسبة.
4. تقديم حل تعليمي صحيح ومنظم.
5. إخراج الإجابة باستخدام Structured Blocks V3 فقط.

==================================================
1. قراءة السؤال
==================================================

${hasImage
  ? `
هناك صورة مرفقة تحتوي على سؤال دراسي.

يجب عليك:

- قراءة الصورة بعناية شديدة.
- استخراج جميع المعلومات المطلوبة.
- قراءة الرموز والأرقام والمعادلات بدقة.
- قراءة جميع الخيارات والأجزاء الفرعية.
- إذا احتوت الصورة على أكثر من جزء، أجب عن جميع الأجزاء.
- لا تتجاهل أي شرط ظاهر.
- لا تخترع معلومات غير موجودة.
- إذا كان جزء أساسي غير واضح فعلاً، وضح ذلك بدلاً من التخمين.
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
2. تحديد نوع السؤال
==================================================

يجب أن تكون question_type واحدة فقط من:

calculation
word_problem
multiple_choice
true_false
short_answer
definition
comparison
essay
proof
multi_part
interpretation
other


التصنيف:

calculation:
مسألة رياضية أو حسابية أو جبر أو تفاضل أو تكامل أو تطبيق قانون يعتمد أساساً على الحساب.

word_problem:
مسألة لفظية تتطلب استخراج المعطيات ثم تطبيق علاقة أو قانون.

multiple_choice:
سؤال يحتوي على خيارات ويجب اختيار الإجابة الصحيحة.

true_false:
سؤال يطلب تحديد صحة أو خطأ عبارة.

short_answer:
سؤال مباشر يحتاج إلى إجابة قصيرة.

definition:
سؤال عن تعريف أو معنى مفهوم.

comparison:
سؤال يطلب المقارنة أو الفرق أو أوجه التشابه.

essay:
سؤال يحتاج إلى شرح أو مناقشة موسعة.

proof:
سؤال يطلب الإثبات أو البرهان.

multi_part:
سؤال يحتوي على عدة مطالب مستقلة.

interpretation:
سؤال يطلب تفسير بيانات أو رسم أو نتيجة أو ظاهرة.

other:
استخدمه فقط عندما لا ينطبق تصنيف آخر.


==================================================
3. أولوية التصنيف
==================================================

إذا كان السؤال اختياراً من متعدد ويحتوي على حسابات:
استخدم multiple_choice.

إذا كان السؤال صح أو خطأ ويحتاج إلى حساب:
استخدم true_false.

إذا كان السؤال يحتوي على عدة أجزاء مستقلة:
استخدم multi_part.

صنف السؤال حسب المطلوب النهائي، وليس بناءً على كلمة واحدة فقط.


==================================================
4. طريقة الحل حسب النوع
==================================================

calculation:
اعرض الطريقة والحساب والخطوات والنتيجة.

word_problem:
استخرج المعطيات وحدد المطلوب واختر القانون ثم طبق الحل.

multiple_choice:
تحقق من الخيارات وحدد الاختيار الصحيح واشرح السبب.

true_false:
حدد صح أو خطأ واشرح السبب وصحح العبارة الخاطئة عند الحاجة.

short_answer:
أجب مباشرة وباختصار واضح.

definition:
قدم تعريفاً دقيقاً وسهل الفهم.

comparison:
قدم المقارنة بصورة منظمة.

essay:
قدم شرحاً مترابطاً ومنظماً.

proof:
قدم خطوات البرهان بترتيب منطقي.

multi_part:
أجب عن جميع الأجزاء، ونظم كل جزء بصورة واضحة.

interpretation:
استنتج فقط ما تدعمه البيانات أو الصورة أو السؤال.


==================================================
5. Structured Blocks V3
==================================================

blocks يمكن أن تحتوي فقط على الأنواع التالية:

heading
paragraph
math
steps
final_answer
notice


==================================================
6. heading
==================================================

استخدم heading للعناوين الرئيسية أو الفرعية.

مثال:

{
  "type": "heading",
  "content": "الحل"
}

محتوى heading نص فقط.

ممنوع LaTeX داخل heading.


==================================================
7. paragraph
==================================================

paragraph مخصص للشرح العادي.

يحتوي على segments.

كل segment يجب أن يكون:

text

أو:

inline_math


مثال:

{
  "type": "paragraph",
  "segments": [
    {
      "type": "text",
      "content": "ميل المستقيم "
    },
    {
      "type": "inline_math",
      "content": "y=3x-7"
    },
    {
      "type": "text",
      "content": " يساوي "
    },
    {
      "type": "inline_math",
      "content": "3"
    },
    {
      "type": "text",
      "content": "."
    }
  ]
}


==================================================
8. قاعدة المسافات في paragraph
==================================================

مهم جداً:

في segment من النوع text احتفظ بالمسافات الطبيعية قبل أو بعد التعبير الرياضي.

مثال صحيح:

text:
"ميل المستقيم "

inline_math:
"y=3x-7"

text:
" يساوي "

inline_math:
"3"

text:
"."


لا تحذف المسافات اللازمة بين النص والرياضيات.


==================================================
9. inline_math
==================================================

استخدم inline_math فقط للرياضيات القصيرة الموجودة داخل جملة.

مثل:

a

x=a

y=3x-7

f'(a)=3

a=2+\\sqrt{2}

محتوى inline_math هو LaTeX خام فقط.


==================================================
10. math
==================================================

استخدم math للمعادلات المستقلة وخطوات الحساب المهمة.

مثال:

{
  "type": "math",
  "content": "f'(x)=3x^2-12x+9"
}

ومثال:

{
  "type": "math",
  "content": "a=2\\pm\\sqrt{2}"
}


==================================================
11. steps
==================================================

استخدم steps عندما يكون الحل مكوناً من خطوات تعليمية متتابعة.

كل عنصر داخل items يمثل خطوة واحدة.

كل خطوة تحتوي على:

title

و:

blocks

title:
عنوان قصير للخطوة باللغة العربية.

blocks:
يمكن أن تحتوي فقط على paragraph أو math.


مثال:

{
  "type": "steps",
  "items": [
    {
      "title": "حساب المشتقة",
      "blocks": [
        {
          "type": "paragraph",
          "segments": [
            {
              "type": "text",
              "content": "نشتق الدالة بالنسبة إلى "
            },
            {
              "type": "inline_math",
              "content": "x"
            },
            {
              "type": "text",
              "content": "."
            }
          ]
        },
        {
          "type": "math",
          "content": "f'(x)=3x^2-12x+9"
        }
      ]
    }
  ]
}


لا تستخدم steps لمجرد إضافة أرقام شكلية.

استخدمه عندما توجد خطوات حقيقية في الحل.


==================================================
12. final_answer
==================================================

استخدم final_answer للجواب النهائي المطلوب من الطالب.

يحتوي final_answer على blocks.

blocks داخل final_answer يمكن أن تحتوي فقط على:

paragraph
math


مثال:

{
  "type": "final_answer",
  "blocks": [
    {
      "type": "paragraph",
      "segments": [
        {
          "type": "text",
          "content": "القيم المطلوبة هي:"
        }
      ]
    },
    {
      "type": "math",
      "content": "a=2\\pm\\sqrt{2}"
    }
  ]
}


استخدم final_answer مرة واحدة فقط في نهاية الإجابة عندما توجد نتيجة نهائية واضحة.

لا تضع heading باسم "النتيجة النهائية" مباشرة قبل final_answer لأن final_answer سيعرض النتيجة بصورة مميزة.


==================================================
13. notice
==================================================

استخدم notice فقط لملاحظة تعليمية مهمة أو تنبيه ضروري.

يحتوي notice على segments من text و inline_math.

مثال:

{
  "type": "notice",
  "segments": [
    {
      "type": "text",
      "content": "تذكر أن المستقيمين المتوازيين لهما الميل نفسه."
    }
  ]
}

لا تستخدم notice في كل إجابة.

استخدمه فقط إذا كانت هناك فائدة تعليمية حقيقية.


==================================================
14. قواعد text
==================================================

text مخصص للنص الطبيعي.

لا تضع LaTeX داخل text.

لا تضع معادلة رياضية داخل text.

أي رمز أو تعبير رياضي داخل جملة يجب وضعه في inline_math.


==================================================
15. قواعد LaTeX
==================================================

محتوى math و inline_math يجب أن يكون LaTeX خاماً فقط.

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
16. منع التكرار
==================================================

لا تكرر المعادلة نفسها في paragraph ثم math.

لا تكرر النتيجة النهائية قبل final_answer ثم مرة أخرى داخله.

إذا تم عرض تعبير رياضي في موضع مناسب فلا تعرض نسخة مطابقة مباشرة بعده.

اجعل الإجابة منظمة وغير مكررة.


==================================================
17. شاشة الهاتف
==================================================

الإجابة ستعرض على هاتف.

لا تجمع سلسلة طويلة جداً من المعادلات داخل math واحد.

استخدم math منفصلاً لكل خطوة حسابية مهمة عندما يؤدي ذلك إلى قراءة أوضح.


==================================================
18. مسائل الرياضيات
==================================================

في المسائل الرياضية:

- اقرأ جميع المعطيات.
- حدد المطلوب.
- استخدم الطريقة الصحيحة.
- راجع العمليات الحسابية.
- أوجد جميع الحلول المطلوبة.
- لا تتوقف عند أول حل إذا كان هناك أكثر من حل.
- تحقق من النتيجة النهائية.


==================================================
19. مسائل المماس والتفاضل
==================================================

إذا كان السؤال متعلقاً بالمماس:

- حدد الميل المطلوب.
- احسب المشتقة.
- طبق شرط المماس أو التوازي.
- أوجد جميع قيم المتغير المطلوبة.
- احسب إحداثيات النقاط عند الحاجة.
- أوجد جميع معادلات المماس المطلوبة.
- تحقق من النتائج.


==================================================
20. أسلوب الكتابة
==================================================

استخدم العربية الواضحة.

لا تستخدم Markdown.

لا تستخدم code blocks.

لا تستخدم الجداول إلا إذا كانت ضرورية جداً.

لا تضف مقدمات طويلة.

لا تذكر أنك نموذج ذكاء اصطناعي.

ركز على الإجابة التعليمية المطلوبة.


==================================================
21. الفحص النهائي الإلزامي
==================================================

قبل إرسال الإجابة تأكد من:

- question_type صحيح.
- تمت الإجابة عن جميع أجزاء السؤال.
- الحسابات صحيحة.
- لا يوجد LaTeX داخل text.
- لا يوجد LaTeX داخل heading.
- inline_math يستخدم للرياضيات داخل الجمل.
- math يستخدم للمعادلات المستقلة.
- لا توجد delimiters حول LaTeX.
- لا يوجد Markdown.
- لا توجد معادلات مكررة.
- steps تحتوي على خطوات حقيقية.
- final_answer مستخدم مرة واحدة فقط عند الحاجة.
- notice مستخدم فقط عند وجود ملاحظة مفيدة.
- المسافات الطبيعية حول inline_math محفوظة في text.
- الإجابة مناسبة لشاشة الهاتف.
`;

}


/* =========================================================
   REUSABLE SCHEMAS
   ========================================================= */

const segmentSchema = {

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

};


const paragraphSchema = {

  type: "object",

  properties: {

    type: {
      type: "string",
      enum: ["paragraph"]
    },

    segments: {

      type: "array",

      items:
        segmentSchema

    }

  },

  required: [
    "type",
    "segments"
  ],

  additionalProperties: false

};


const mathSchema = {

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

};


const headingSchema = {

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

};


const stepInnerBlockSchema = {

  anyOf: [
    paragraphSchema,
    mathSchema
  ]

};


const stepsSchema = {

  type: "object",

  properties: {

    type: {
      type: "string",
      enum: ["steps"]
    },

    items: {

      type: "array",

      items: {

        type: "object",

        properties: {

          title: {
            type: "string"
          },

          blocks: {

            type: "array",

            items:
              stepInnerBlockSchema

          }

        },

        required: [
          "title",
          "blocks"
        ],

        additionalProperties: false

      }

    }

  },

  required: [
    "type",
    "items"
  ],

  additionalProperties: false

};


const finalAnswerSchema = {

  type: "object",

  properties: {

    type: {
      type: "string",
      enum: ["final_answer"]
    },

    blocks: {

      type: "array",

      items: {

        anyOf: [
          paragraphSchema,
          mathSchema
        ]

      }

    }

  },

  required: [
    "type",
    "blocks"
  ],

  additionalProperties: false

};


const noticeSchema = {

  type: "object",

  properties: {

    type: {
      type: "string",
      enum: ["notice"]
    },

    segments: {

      type: "array",

      items:
        segmentSchema

    }

  },

  required: [
    "type",
    "segments"
  ],

  additionalProperties: false

};


/* =========================================================
   STRUCTURED OUTPUT SCHEMA — V3.3
   ========================================================= */

const studyAnswerSchema = {

  type: "object",

  properties: {

    question_type: {

      type: "string",

      enum: [
        "calculation",
        "word_problem",
        "multiple_choice",
        "true_false",
        "short_answer",
        "definition",
        "comparison",
        "essay",
        "proof",
        "multi_part",
        "interpretation",
        "other"
      ]

    },


    blocks: {

      type: "array",

      items: {

        anyOf: [

          headingSchema,

          paragraphSchema,

          mathSchema,

          stepsSchema,

          finalAnswerSchema,

          noticeSchema

        ]

      }

    }

  },

  required: [
    "question_type",
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
   TEXT SEGMENT
   Preserve natural spaces for V3.3
   ========================================================= */

function cleanTextSegment(value) {

  if (
    typeof value !== "string"
  ) {

    return "";

  }


  if (
    !value.trim()
  ) {

    return "";

  }


  return value;

}


/* =========================================================
   QUESTION TYPE
   ========================================================= */

function cleanQuestionType(value) {

  if (
    typeof value !== "string"
  ) {

    return "other";

  }


  if (
    Object.prototype.hasOwnProperty.call(
      QUESTION_TYPES,
      value
    )
  ) {

    return value;

  }


  return "other";

}


/* =========================================================
   CLEAN SEGMENTS
   ========================================================= */

function cleanSegments(segments) {

  if (
    !Array.isArray(segments)
  ) {

    return [];

  }


  const result = [];


  for (
    const segment of segments
  ) {

    if (
      !segment ||
      typeof segment !== "object"
    ) {

      continue;

    }


    if (
      segment.type === "text"
    ) {

      const content =
        cleanTextSegment(
          segment.content
        );


      if (!content) {
        continue;
      }


      result.push({

        type: "text",

        content:
          content

      });


      continue;

    }


    if (
      segment.type === "inline_math"
    ) {

      const content =
        cleanString(
          segment.content
        );


      if (!content) {
        continue;
      }


      result.push({

        type: "inline_math",

        content:
          content

      });

    }

  }


  return result;

}


/* =========================================================
   CLEAN INNER BLOCKS
   paragraph + math only
   ========================================================= */

function cleanInnerBlocks(blocks) {

  if (
    !Array.isArray(blocks)
  ) {

    return [];

  }


  const result = [];


  for (
    const block of blocks
  ) {

    if (
      !block ||
      typeof block !== "object"
    ) {

      continue;

    }


    if (
      block.type === "paragraph"
    ) {

      const segments =
        cleanSegments(
          block.segments
        );


      if (
        segments.length > 0
      ) {

        result.push({

          type: "paragraph",

          segments:
            segments

        });

      }


      continue;

    }


    if (
      block.type === "math"
    ) {

      const content =
        cleanString(
          block.content
        );


      if (content) {

        result.push({

          type: "math",

          content:
            content

        });

      }

    }

  }


  return result;

}


/* =========================================================
   CLEAN STRUCTURED BLOCKS — V3.3
   ========================================================= */

function cleanStructuredBlocks(blocks) {

  if (
    !Array.isArray(blocks)
  ) {

    return [];

  }


  const result = [];


  let finalAnswerAdded =
    false;


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

        result.push({

          type: "heading",

          content:
            content

        });

      }


      continue;

    }


    /* =====================================================
       PARAGRAPH
       ===================================================== */

    if (
      block.type === "paragraph"
    ) {

      const segments =
        cleanSegments(
          block.segments
        );


      if (
        segments.length > 0
      ) {

        result.push({

          type: "paragraph",

          segments:
            segments

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

        result.push({

          type: "math",

          content:
            content

        });

      }


      continue;

    }


    /* =====================================================
       STEPS
       ===================================================== */

    if (
      block.type === "steps" &&
      Array.isArray(
        block.items
      )
    ) {

      const items = [];


      for (
        const item of block.items
      ) {

        if (
          !item ||
          typeof item !== "object"
        ) {

          continue;

        }


        const title =
          cleanString(
            item.title
          );


        const innerBlocks =
          cleanInnerBlocks(
            item.blocks
          );


        if (
          !title ||
          innerBlocks.length === 0
        ) {

          continue;

        }


        items.push({

          title:
            title,

          blocks:
            innerBlocks

        });

      }


      if (
        items.length > 0
      ) {

        result.push({

          type: "steps",

          items:
            items

        });

      }


      continue;

    }


    /* =====================================================
       FINAL ANSWER
       ===================================================== */

    if (
      block.type === "final_answer" &&
      !finalAnswerAdded
    ) {

      const innerBlocks =
        cleanInnerBlocks(
          block.blocks
        );


      if (
        innerBlocks.length > 0
      ) {

        result.push({

          type: "final_answer",

          blocks:
            innerBlocks

        });


        finalAnswerAdded =
          true;

      }


      continue;

    }


    /* =====================================================
       NOTICE
       ===================================================== */

    if (
      block.type === "notice"
    ) {

      const segments =
        cleanSegments(
          block.segments
        );


      if (
        segments.length > 0
      ) {

        result.push({

          type: "notice",

          segments:
            segments

        });

      }

    }

  }


  return result;

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
         INPUT
         ===================================================== */

      const content = [];


      const prompt =
        buildStudyPrompt(
          cleanQuestion,
          Boolean(image)
        );


      content.push({

        type: "input_text",

        text:
          prompt

      });


      /* =====================================================
         IMAGE
         ===================================================== */

      if (image) {

        content.push({

          type: "input_image",

          image_url:
            image

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


          text: {

            format: {

              type:
                "json_schema",

              name:
                "study_answer_v3_3",

              strict:
                true,

              schema:
                studyAnswerSchema

            }

          }

        });


      /* =====================================================
         OUTPUT
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
         CHECK
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
         QUESTION TYPE
         ===================================================== */

      const questionType =
        cleanQuestionType(
          structuredAnswer.question_type
        );


      const questionTypeLabel =
        QUESTION_TYPES[
          questionType
        ];


      /* =====================================================
         CLEAN BLOCKS
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


      console.log(
        "QUESTION TYPE:",
        questionType,
        "-",
        questionTypeLabel
      );


      /* =====================================================
         SEND STRUCTURED BLOCKS V3
         ===================================================== */

      return res.json({

        version: 3,

        question_type:
          questionType,

        question_type_label:
          questionTypeLabel,

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
