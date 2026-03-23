from fastapi import APIRouter, UploadFile, File, HTTPException

from google.genai.errors import ClientError as GeminiClientError

from models.receipt import ReceiptData
from services.gemini_scan import scan_receipt as gemini_scan_receipt

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
}

MAGIC_BYTES: dict[str, list[bytes]] = {
    "image/jpeg": [bytes([0xFF, 0xD8, 0xFF])],
    "image/png": [bytes([0x89, 0x50, 0x4E, 0x47])],
    "image/webp": [bytes([0x52, 0x49, 0x46, 0x46])],
}


def _validate_magic(data: bytes, mime: str) -> bool:
    sigs = MAGIC_BYTES.get(mime)
    if not sigs:
        return True  # No signature to check (heic, gif)
    return any(data[: len(sig)] == sig for sig in sigs)


@router.post("/scan-receipt")
async def scan_receipt(receipt: UploadFile = File(...)):
    if receipt.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "File must be an image (JPG, PNG, WebP, HEIC/HEIF)")

    data = await receipt.read()

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(400, "Image must be under 10MB")

    if not _validate_magic(data, receipt.content_type or ""):
        raise HTTPException(400, "File content doesn't match its type")

    try:
        raw = gemini_scan_receipt(data)
    except RuntimeError as e:
        raise HTTPException(503, f"Scan service not configured: {e}")
    except GeminiClientError as e:
        status = getattr(e, "status_code", 0)
        if status == 429:
            raise HTTPException(
                503,
                "Gemini API quota exceeded. Update GEMINI_API_KEY with a key from "
                "https://aistudio.google.com/app/apikey",
            )
        print(f"[scan_receipt] Gemini API error ({status}): {e}")
        raise HTTPException(422, "Could not read receipt. Try a clearer, well-lit photo.")
    except ValueError as e:
        raise HTTPException(422, f"Could not parse receipt: {e}")
    except Exception as e:
        print(f"[scan_receipt] Gemini error: {e}")
        raise HTTPException(422, "Could not read receipt. Try a clearer, well-lit photo.")

    if not raw.get("totalAmount"):
        raise HTTPException(
            422, "Could not find a total amount in the receipt. Try a clearer photo."
        )

    try:
        validated = ReceiptData(**raw)
    except Exception:
        raise HTTPException(422, "Could not extract valid data from receipt.")

    return {"success": True, "data": validated.model_dump(), "method": "gemini"}
