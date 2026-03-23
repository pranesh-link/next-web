import json
import os
import re
from typing import Any

import truststore
from google import genai
from google.genai import types as gtypes

# Use macOS native SecureTransport — fixes Python 3.13 strict Basic Constraints enforcement
# that rejects Google's intermediate CA cert
truststore.inject_into_ssl()

_client: genai.Client | None = None

RECEIPT_PROMPT = """You are a receipt parser. Extract information from this receipt image and return ONLY a JSON object — no markdown, no code blocks, no explanation.

JSON format:
{
  "storeName": "name of the store or merchant (string or null)",
  "totalAmount": 0.00,
  "date": "YYYY-MM-DD or null",
  "items": [{"name": "item name", "amount": 0.00}],
  "category": "one of: Food, Transport, Shopping, Health, Entertainment, Utilities, Rent, EMI, Other",
  "confidence": 85
}

Rules:
- totalAmount: the grand total / amount paid — must be a number, not null
- date: YYYY-MM-DD format, or null if not clearly visible
- items: individual line items only; exclude subtotals, taxes, discounts, totals
- category: best fit based on store type and items purchased
- confidence: integer 1-100 reflecting how clearly you could read the receipt
- Return ONLY valid JSON, absolutely no other text
"""


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        _client = genai.Client(api_key=api_key)
        print("[gemini] Gemini client ready")
    return _client


def scan_receipt(image_bytes: bytes) -> dict[str, Any]:
    """
    Use Gemini 2.0 Flash Vision to parse a receipt image.
    Returns a structured dict with storeName, totalAmount, date, items, category, confidence.
    Raises RuntimeError on configuration error, ValueError on parse failure.
    """
    client = _get_client()

    # Detect MIME type from magic bytes for the new SDK
    mime_type = _detect_mime(image_bytes)

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[
            gtypes.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            RECEIPT_PROMPT,
        ],
    )
    text = response.text.strip()

    # Strip markdown code fences if Gemini adds them
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*\n?", "", text)
        text = re.sub(r"\n?```\s*$", "", text)
        text = text.strip()

    result = json.loads(text)

    # Ensure required field is numeric
    if "totalAmount" in result and isinstance(result["totalAmount"], str):
        try:
            result["totalAmount"] = float(result["totalAmount"].replace(",", ""))
        except ValueError:
            result["totalAmount"] = None

    return result


def _detect_mime(data: bytes) -> str:
    if data[:4] == bytes([0x89, 0x50, 0x4E, 0x47]):
        return "image/png"
    if data[:3] == bytes([0xFF, 0xD8, 0xFF]):
        return "image/jpeg"
    if data[:4] == bytes([0x52, 0x49, 0x46, 0x46]):
        return "image/webp"
    return "image/jpeg"  # default fallback
