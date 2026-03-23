from fastapi import APIRouter, UploadFile, File, HTTPException

from models.schedule import ScheduleData
from services.ocr import run_ocr
from services.pdf import extract_pdf_text, extract_pdf_tables
from services.schedule_parser import parse_schedule_text, parse_schedule_tables

router = APIRouter()

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
ALLOWED_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
}

MAGIC_BYTES: dict[str, list[bytes]] = {
    "application/pdf": [bytes([0x25, 0x50, 0x44, 0x46])],  # %PDF
    "image/jpeg": [bytes([0xFF, 0xD8, 0xFF])],
    "image/png": [bytes([0x89, 0x50, 0x4E, 0x47])],
    "image/webp": [bytes([0x52, 0x49, 0x46, 0x46])],
}


def _validate_magic(data: bytes, mime: str) -> bool:
    sigs = MAGIC_BYTES.get(mime)
    if not sigs:
        return True
    return any(data[: len(sig)] == sig for sig in sigs)


@router.post("/scan-schedule")
async def scan_schedule(schedule: UploadFile = File(...)):
    if schedule.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            400, "File must be a PDF or image (JPG, PNG, WebP, HEIC)"
        )

    data = await schedule.read()

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(400, "File must be under 20MB")

    if not _validate_magic(data, schedule.content_type or ""):
        raise HTTPException(400, "File content does not match declared type")

    is_pdf = schedule.content_type == "application/pdf"
    method = ""
    parsed = None

    if is_pdf:
        # Try structured table extraction first (pdfplumber's strength)
        tables = extract_pdf_tables(data)
        if tables:
            parsed = parse_schedule_tables(tables)
            method = "pdfplumber-tables"

        # Fall back to text extraction + regex
        if not parsed:
            text = extract_pdf_text(data)
            if text and len(text.strip()) >= 20:
                parsed = parse_schedule_text(text)
                method = "pdfplumber-text"

        # Last resort: OCR the PDF (scanned PDF without selectable text)
        if not parsed:
            ocr_result = run_ocr(data)
            if ocr_result:
                parsed = parse_schedule_text(ocr_result[0])
                method = "easyocr-pdf"

        if not parsed:
            raise HTTPException(
                422,
                "Could not extract text from PDF. Try a PDF with selectable text.",
            )
    else:
        ocr_result = run_ocr(data)
        if not ocr_result:
            raise HTTPException(
                422,
                "Could not read text from image. Try a clearer, well-lit photo.",
            )
        parsed = parse_schedule_text(ocr_result[0])
        method = "easyocr"

    if not parsed:
        raise HTTPException(
            422, "Could not extract loan schedule data. Try a clearer document."
        )

    try:
        validated = ScheduleData(**parsed)
    except Exception:
        raise HTTPException(422, "Could not extract valid schedule data.")

    return {"success": True, "data": validated.model_dump(), "method": method}
