import re
from datetime import date


def parse_schedule_text(text: str) -> dict | None:
    """Parse raw text to extract loan schedule data. Returns dict or None."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    number_re = re.compile(r"[\d,]+\.?\d*")

    principal: float | None = None
    interest_rate: float | None = None
    emi_amount: float | None = None
    loan_name = "Imported Loan"
    schedule: list[dict] = []

    # ── Loan metadata ──
    for line in lines:
        lower = line.lower()
        if not principal:
            m = re.search(
                r"(?:loan\s*amount|principal|sanctioned)[:\s]*[₹$]?\s*([\d,]+\.?\d*)",
                lower,
            )
            if m:
                principal = float(m.group(1).replace(",", ""))
        if not interest_rate:
            m = re.search(r"(?:interest\s*rate|roi|rate)[:\s]*([\d.]+)\s*%?", lower)
            if m:
                interest_rate = float(m.group(1))
        if not emi_amount:
            m = re.search(
                r"(?:emi|installment|monthly)[:\s]*[₹$]?\s*([\d,]+\.?\d*)", lower
            )
            if m:
                emi_amount = float(m.group(1).replace(",", ""))

        if "home loan" in lower:
            loan_name = "Home Loan"
        elif "car loan" in lower or "auto loan" in lower:
            loan_name = "Car Loan"
        elif "personal loan" in lower:
            loan_name = "Personal Loan"
        elif "education loan" in lower:
            loan_name = "Education Loan"

    # ── Schedule rows (lines with 4+ numbers) ──
    month_num = 1
    for line in lines:
        nums = number_re.findall(line)
        if len(nums) >= 4:
            values = [float(n.replace(",", "")) for n in nums]
            if len(values) >= 5 and values[0] < 1000:
                schedule.append(
                    {
                        "month": int(values[0]),
                        "date": "",
                        "emi": values[1],
                        "principal": values[2],
                        "interest": values[3],
                        "balance": values[4],
                    }
                )
            elif len(values) >= 4:
                schedule.append(
                    {
                        "month": month_num,
                        "date": "",
                        "emi": values[0],
                        "principal": values[1],
                        "interest": values[2],
                        "balance": values[3],
                    }
                )
                month_num += 1

    if not principal and not emi_amount and not schedule:
        return None

    return {
        "loanName": loan_name,
        "principal": principal or (schedule[0]["balance"] if schedule else 0),
        "interestRate": interest_rate or 0,
        "tenureMonths": len(schedule) or 0,
        "emiAmount": emi_amount or (schedule[0]["emi"] if schedule else 0),
        "startDate": date.today().isoformat(),
        "remainingBalance": (
            schedule[-1]["balance"] if schedule else (principal or 0)
        ),
        "schedule": schedule,
        "confidence": 45 if schedule else 15,
    }


def parse_schedule_tables(tables: list[list[list[str]]]) -> dict | None:
    """Parse structured tables from pdfplumber for better accuracy."""
    schedule: list[dict] = []
    month_num = 1

    for table in tables:
        if len(table) < 2:
            continue

        # Find header row to identify columns
        header = [str(c).lower().strip() if c else "" for c in table[0]]
        col_map: dict[str, int] = {}
        for i, h in enumerate(header):
            if "emi" in h or "installment" in h:
                col_map["emi"] = i
            elif "principal" in h and "interest" not in h:
                col_map["principal"] = i
            elif "interest" in h and "principal" not in h:
                col_map["interest"] = i
            elif "balance" in h or "outstanding" in h:
                col_map["balance"] = i
            elif "month" in h or "no" in h or "#" in h:
                col_map["month"] = i

        if len(col_map) < 3:
            continue  # Not a schedule table

        for row in table[1:]:
            try:

                def cell_val(key: str, default: float = 0) -> float:
                    if key not in col_map or col_map[key] >= len(row):
                        return default
                    raw = str(row[col_map[key]] or "0").replace(",", "").strip()
                    nums = re.findall(r"[\d.]+", raw)
                    return float(nums[0]) if nums else default

                entry = {
                    "month": int(cell_val("month", month_num)),
                    "date": "",
                    "emi": cell_val("emi"),
                    "principal": cell_val("principal"),
                    "interest": cell_val("interest"),
                    "balance": cell_val("balance"),
                }
                if entry["emi"] > 0 or entry["balance"] > 0:
                    schedule.append(entry)
                    month_num += 1
            except (ValueError, IndexError):
                continue

    if not schedule:
        return None

    return {
        "loanName": "Imported Loan",
        "principal": (
            schedule[0]["balance"] + schedule[0]["principal"] if schedule else 0
        ),
        "interestRate": 0,
        "tenureMonths": len(schedule),
        "emiAmount": schedule[0]["emi"] if schedule else 0,
        "startDate": date.today().isoformat(),
        "remainingBalance": schedule[-1]["balance"] if schedule else 0,
        "schedule": schedule,
        "confidence": 60,
    }
