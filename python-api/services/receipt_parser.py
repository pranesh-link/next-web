import re
from datetime import datetime

# Keywords are matched as whole words (word-boundary) to avoid "uber" matching "ubercool"
# Categories are checked in priority order — more specific first
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "Food": [
        # Restaurants / delivery
        "restaurant", "cafe", "coffee", "pizza", "burger", "swiggy", "zomato",
        "uber eats", "dominos", "mcdonald", "starbucks", "kfc", "subway", "bakery",
        "dhaba", "biryani", "canteen", "tiffin", "mess", "hotel",
        # Grocery / supermarket
        "grocery", "supermarket", "bigbasket", "blinkit", "zepto", "dmart",
        "reliance fresh", "more supermarket", "spar", "nature fresh",
        "nilgiris", "namdhari", "provision", "fresh", "vegetables", "fruits",
        "rice", "dal", "flour", "maida", "atta", "oil", "ghee", "masala", "spice",
        "milk", "curd", "paneer", "butter", "bread", "eggs",
    ],
    "Health": [
        "pharmacy", "medical", "hospital", "clinic", "doctor", "medicine",
        "lab", "diagnostic", "apollo", "medplus", "1mg", "pharmeasy", "netmeds",
        "chemist", "drug", "health", "wellness",
    ],
    "Transport": [
        "ola", "lyft", "rapido", "taxi", "cab", "irctc", "redbus",
        "petrol", "diesel", "fuel", "parking", "toll", "flight", "airline",
        "indigo", "spicejet", "air india", "train ticket",
    ],
    "Entertainment": [
        "netflix", "spotify", "hotstar", "prime video", "movie", "cinema",
        "pvr", "inox", "theater", "theatre", "game", "concert", "event",
    ],
    "Shopping": [
        "amazon", "flipkart", "myntra", "ajio", "mall", "clothing", "electronics",
        "wear", "fashion", "apparel", "footwear", "shoe", "dress", "shirt",
    ],
    "Utilities": [
        "electricity", "internet", "broadband", "wifi", "recharge",
        "jio", "airtel", "vodafone", "bsnl", "bill pay", "water bill", "gas bill",
    ],
    "Rent": ["rent", "lease", "landlord", "housing", "apartment", "flat"],
    "EMI": ["emi", "loan", "installment", "credit card"],
}

# Short words that need word-boundary matching to avoid false positives
_WORD_BOUNDARY_KEYWORDS = {"bus", "gas", "bar", "lab", "oil", "gym", "spa", "pub"}


def detect_category(text: str) -> str:
    lower = text.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in _WORD_BOUNDARY_KEYWORDS:
                if re.search(r"\b" + re.escape(kw) + r"\b", lower):
                    return category
            elif kw in lower:
                return category
    return "Other"


def parse_receipt_text(text: str, ocr_confidence: float) -> dict | None:
    """Parse OCR text to extract receipt data. Returns dict or None."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    # ── Total amount ──
    total_amount: float | None = None
    total_patterns = [
        r"(?:grand\s*total|sub\s*total|total\s*amount|total\s*due|amount\s*due|"
        r"amount\s*payable|net\s*amount|net\s*payable|total\s*bill|bill\s*total|"
        r"total)[:\s]*[₹$€£]?\s*([\d,]+\.?\d*)",
        r"(?:total|amount)[:\s]*(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)",
        r"(?:total|payable|due|balance|paid)[^\d]*[₹$€£]?\s*([\d,]+\.?\d{0,2})\s*$",
    ]

    for line in reversed(lines):
        for pat in total_patterns:
            m = re.search(pat, line, re.IGNORECASE)
            if m:
                val = float(m.group(1).replace(",", ""))
                if 0 < val < 100_000_000:
                    total_amount = val
                    break
        if total_amount:
            break

    # Fallback: find largest currency amount
    if not total_amount:
        amount_re = re.compile(
            r"[₹$€£]\s*([\d,]+\.?\d*)|(?:Rs\.?|INR)\s*([\d,]+\.?\d*)|([\d,]+\.\d{2})"
        )
        max_amount = 0.0
        for line in lines:
            for m in amount_re.finditer(line):
                raw = m.group(1) or m.group(2) or m.group(3)
                if raw:
                    val = float(raw.replace(",", ""))
                    if val > max_amount and val < 100_000_000:
                        max_amount = val
        if max_amount > 0:
            total_amount = max_amount

    # ── Date ──
    date_str: str | None = None
    date_patterns: list[tuple[str, str]] = [
        (r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})", "YMD"),         # YYYY-MM-DD
        (r"(\d{1,2})[-/](\d{1,2})[-/](\d{4})", "MDY_or_DMY"),  # MM/DD/YYYY or DD/MM/YYYY
        (r"(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[\s,]+(\d{4})", "text"),
        (r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2})[\s,]+(\d{4})", "text"),
    ]

    for line in lines:
        for pat, fmt_type in date_patterns:
            m = re.search(pat, line, re.IGNORECASE)
            if not m:
                continue
            try:
                if fmt_type == "YMD":
                    groups = m.groups()
                    candidate = f"{groups[0]}-{groups[1].zfill(2)}-{groups[2].zfill(2)}"
                    d = datetime.strptime(candidate, "%Y-%m-%d")
                elif fmt_type == "MDY_or_DMY":
                    g = m.groups()
                    a, b, year = int(g[0]), int(g[1]), g[2]
                    # Try MM/DD/YYYY first (US format, common on receipts)
                    if 1 <= a <= 12 and 1 <= b <= 31:
                        candidate = f"{year}-{str(a).zfill(2)}-{str(b).zfill(2)}"
                    elif 1 <= b <= 12 and 1 <= a <= 31:
                        # DD/MM/YYYY
                        candidate = f"{year}-{str(b).zfill(2)}-{str(a).zfill(2)}"
                    else:
                        continue
                    d = datetime.strptime(candidate, "%Y-%m-%d")
                else:
                    raw = m.group(0).replace(",", "").strip()
                    d = None
                    for fmt in ("%d %b %Y", "%d %B %Y", "%b %d %Y", "%B %d %Y"):
                        try:
                            d = datetime.strptime(raw, fmt)
                            break
                        except ValueError:
                            continue
                    if d is None:
                        continue

                if 2000 <= d.year <= 2030:
                    date_str = d.strftime("%Y-%m-%d")
                    break
            except (ValueError, IndexError):
                continue
        if date_str:
            break

    # ── Store name ──
    store_name: str | None = None
    skip_re = re.compile(
        r"^(date|time|tel|ph|fax|gstin|gst|tin|invoice|receipt|bill|tax|mobile|address|www|http)",
        re.IGNORECASE,
    )
    candidate_lines: list[str] = []
    for line in lines[:7]:
        if len(line) < 3:
            continue
        if re.match(r"^[\d\s\.\-/,#@]+$", line):  # pure numbers/punctuation
            continue
        if skip_re.match(line):
            continue
        candidate_lines.append(line)
        if len(candidate_lines) >= 2:
            break

    if candidate_lines:
        first = candidate_lines[0]
        # If first line is very short (≤15 chars) and there's a second, combine them
        if len(first) <= 15 and len(candidate_lines) > 1:
            store_name = f"{first} {candidate_lines[1]}"[:100]
        else:
            store_name = first[:100]

    # ── Line items ──
    items: list[dict] = []
    item_re = re.compile(r"^(.+?)\s+[₹$]?\s*(\d[\d,]*\.?\d{0,2})\s*$")
    exclude_re = re.compile(
        r"total|subtotal|tax|gst|cgst|sgst|discount|round|change|cash|card|upi|paid",
        re.IGNORECASE,
    )
    # Reject item names that are mostly noise (short, all-punctuation, or just digits)
    noise_re = re.compile(r"^[\d\s\.\-,_#*%]+$")
    for line in lines:
        m = item_re.match(line)
        if m:
            name = m.group(1).strip()
            raw_amount = m.group(2).replace(",", "")
            if not raw_amount:
                continue
            try:
                amount = float(raw_amount)
            except ValueError:
                continue
            ceiling = total_amount if total_amount else float("inf")
            if (
                len(name) >= 3
                and not noise_re.match(name)
                and 0 < amount < ceiling
                and not exclude_re.search(name)
            ):
                items.append({"name": name[:200], "amount": amount})

    if not total_amount:
        return None

    category = detect_category(text)

    # Confidence: base from OCR + bonuses for extracted fields
    base = ocr_confidence * 0.7  # OCR avg confidence (0-100) weighted
    bonus = 0
    if total_amount:
        bonus += 10  # Found a total
    if items:
        bonus += min(len(items) * 3, 15)  # Up to 15 for line items
    if date_str:
        bonus += 5
    if store_name:
        bonus += 5
    confidence = min(95, max(30, round(base + bonus)))

    desc = (
        f"{category} at {store_name[:30]}" if store_name else f"{category} purchase"
    )

    return {
        "storeName": store_name,
        "totalAmount": total_amount,
        "date": date_str,
        "category": category,
        "description": desc,
        "items": items,
        "confidence": confidence,
    }
