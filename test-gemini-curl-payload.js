const fs = require("fs");

const pdfB64 = fs.readFileSync("public/REPAY_SCH.pdf").toString("base64");
const today = new Date().toISOString().split("T")[0];
const prompt = `You are a loan repayment schedule parser. Today's date is ${today}. Extract ALL information from this document and return a single JSON object - no markdown, no code blocks, no explanation.

JSON format:
{
  "loanName": "name of the loan or lender (string, default 'Imported Loan')",
  "principal": 0.00,
  "interestRate": 0.00,
  "tenureMonths": 0,
  "emiAmount": 0.00,
  "startDate": "YYYY-MM-DD or empty string",
  "remainingBalance": 0.00,
  "prepayments": [],
  "schedule": [],
  "confidence": 85
}

Rules:
- principal: the original loan amount (disbursed amount)
- interestRate: annual interest rate as a percentage (e.g. 8.5 not 0.085)
- tenureMonths: total loan tenure in months (count of regular EMI rows in the schedule)
- emiAmount: the regular recurring monthly EMI amount for the normal EMI schedule. Derive this from the repeated standard EMI rows, not from irregular first/last rows, moratorium/adjustment rows, partial-month rows, or any prepayment/part-payment/principal adjustment rows. If multiple EMI values appear, choose the most common recurring EMI among the regular schedule rows.
- startDate: first EMI payment date in YYYY-MM-DD format, or empty string
- remainingBalance: find the MOST RECENT EMI row whose date is on or before today (${today}). Return the closing principal / outstanding balance from that row. If the schedule has no rows on or before today, return 0
- prepayments: array of part-prepayments found in the schedule - rows labeled as part-payment, prepayment, principal adjustment, or rows where the principal component is significantly larger than a normal EMI principal. Each entry: {"date": "YYYY-MM-DD", "amount": 0.00, "balanceAfter": 0.00}. If none found, return []
- schedule: array of ALL regular EMI rows from the amortization table (exclude prepayment rows). Each entry MUST have exactly these fields:
  {"month": 1, "date": "YYYY-MM-DD", "emi": 0.00, "principal": 0.00, "interest": 0.00, "balance": 0.00}
  month is the sequential row number (1-based). date is the payment date. emi is total EMI paid for that EMI row. principal is the principal component. interest is the interest component. balance is the closing/outstanding principal balance after payment.
  Extract EVERY row - do not skip, truncate, or summarise rows. If the document has 171 rows, return all 171.
- Do not let a one-off EMI value override the regular emiAmount field. The schedule array should preserve each row's actual EMI, but the top-level emiAmount must represent the standard recurring EMI.
- confidence: integer 1-100 reflecting how clearly you could read the document
- Return ONLY valid JSON, absolutely no other text`;

const body = {
  contents: [
    {
      parts: [
        { inlineData: { mimeType: "application/pdf", data: pdfB64 } },
        { text: prompt },
      ],
    },
  ],
  generationConfig: { temperature: 0.1 },
};

fs.writeFileSync("/tmp/gemini-schedule-payload.json", JSON.stringify(body));
console.log("payload ready");
