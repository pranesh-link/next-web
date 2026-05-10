/**
 * Build the Gemini prompt used to parse a loan repayment schedule into JSON.
 *
 * The prompt is dynamically dated so the model can compute remaining-balance
 * relative to "today".
 *
 * @returns The fully-formed prompt string.
 */
export function buildSchedulePrompt(): string {
  const today = new Date().toISOString().split("T")[0];
  return `You are a loan repayment schedule parser. Today's date is ${today}. Extract key loan information from this document and return a single JSON object — no markdown, no code blocks, no explanation.

JSON format:
{
  "loanProvider": "lender or bank name only (string | null). Examples: 'BAJAJ HOUSING FINANCE', 'SBI', 'HDFC BANK', 'ICICI BANK'. Look for the institution/lender name in the document header. Null if not found.",
  "loanName": "loan product or type only — do NOT include the lender name here (string, default 'Imported Loan'). Examples: 'HOME LOAN', 'HOME LOAN TOPUP', 'CAR LOAN', 'PERSONAL LOAN', 'LAP'. Look for a product type / loan type field in the document header — use that value only.",
  "loanAccountNumber": "string | null  // loan or account/reference number exactly as printed in the document header or footer (e.g. 'XXXXXXXXXX01'). Null if not found.",
  "scheduleGeneratedOn": "YYYY-MM-DD | null  // date this document was generated/printed/issued — look for 'Generated on', 'Statement Date', 'As of', 'Print Date', 'Schedule Date' in the header or footer. Null if not found.",
  "principal": 0.00,
  "interestRate": 0.00,
  "tenureMonths": 0,
  "emiAmount": 0.00,
  "startDate": "YYYY-MM-DD or empty string",
  "remainingBalance": 0.00,
  "prepayments": [],
  "rawScheduleText": "Dump the ENTIRE amortization/schedule table as plain text — one row per line, pipe-separated: month|date|emi|principal|interest|balance. Include ALL regular EMI rows in order. Exclude prepayment/part-payment rows. Use YYYY-MM-DD for dates. Return empty string if no table found.",
  "schedule": [],
  "confidence": 85
}

Rules:
- principal: the original loan amount (disbursed amount)
- interestRate: annual interest rate as a percentage (e.g. 8.5 not 0.085)
- tenureMonths: total loan tenure in months (count of regular EMI rows in the schedule table)
- emiAmount: the regular recurring monthly EMI amount. Derive from the most common recurring EMI in the schedule, ignoring irregular first/last rows, prepayment rows, or adjustment rows.
- startDate: first EMI payment date in YYYY-MM-DD format, or empty string
- remainingBalance: find the MOST RECENT EMI row whose date is on or before today (${today}). Return the closing/outstanding principal balance from that row. If no rows on or before today, return 0.
- prepayments: array of any part-payment, prepayment, or principal adjustment rows found in the schedule — rows where principal paid is significantly larger than a normal EMI principal. Each entry: {"date": "YYYY-MM-DD", "amount": 0.00, "balanceAfter": 0.00}. Return [] if none found.
- schedule: always return an empty array []. Do NOT populate individual EMI rows — use rawScheduleText instead.
- confidence: integer 1-100 reflecting how clearly you could read the document
- Return ONLY valid JSON, absolutely no other text`;
}
