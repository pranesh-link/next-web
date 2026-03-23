const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const pdfBuffer = fs.readFileSync("public/REPAY_SCH.pdf");
  const b64 = pdfBuffer.toString("base64");

  const prompt = `You are a loan repayment schedule parser. Extract ALL EMI rows from this repayment schedule PDF and return as JSON.

Return ONLY a JSON object in this exact format — no markdown, no code blocks:
{
  "metadata": {
    "loanName": "string",
    "principal": 0.00,
    "interestRate": 0.00,
    "tenureMonths": 0,
    "emiAmount": 0.00,
    "startDate": "YYYY-MM-DD"
  },
  "schedule": [
    {
      "month": 1,
      "date": "YYYY-MM-DD",
      "emi": 0.00,
      "principal": 0.00,
      "interest": 0.00,
      "balance": 0.00
    }
  ],
  "prepayments": [
    {
      "date": "YYYY-MM-DD",
      "amount": 0.00,
      "balanceAfter": 0.00
    }
  ]
}

Rules:
- schedule: extract EVERY row from the amortization/repayment table. Each row has: month number (sequential starting from 1), date of payment, EMI amount paid, principal component, interest component, closing/outstanding principal balance
- prepayments: rows that are part-payments, prepayments, or principal adjustments (larger than a normal EMI principal portion). If none found, return empty array
- balance: this is the closing principal outstanding after that month's payment
- If a row is a prepayment row, still include it in schedule with the correct balance, AND add it to prepayments array
- Return ONLY valid JSON, no other text`;

  const start = Date.now();
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    config: { temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } },
    contents: [
      {
        parts: [
          {
            inlineData: { mimeType: "application/pdf", data: b64 },
          },
          { text: prompt },
        ],
      },
    ],
  });

  const elapsed = Date.now() - start;
  let text = response.text?.trim() ?? "";
  if (text.startsWith("```")) {
    text = text
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "")
      .trim();
  }

  const parsed = JSON.parse(text);
  console.log("Elapsed:", elapsed, "ms");
  console.log("Metadata:", JSON.stringify(parsed.metadata, null, 2));
  console.log("Schedule rows:", parsed.schedule?.length);
  console.log(
    "First 3 rows:",
    JSON.stringify(parsed.schedule?.slice(0, 3), null, 2)
  );
  console.log(
    "Last 3 rows:",
    JSON.stringify(parsed.schedule?.slice(-3), null, 2)
  );
  console.log("Prepayments:", JSON.stringify(parsed.prepayments, null, 2));
}

test().catch((e) => {
  console.error("Error:", e.message);
  if (e.stack) console.error(e.stack);
});
