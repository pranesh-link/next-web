import io
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

import easyocr

# Lazy singleton — model loaded once on first call
_reader: easyocr.Reader | None = None

# Max dimension for OCR — larger images are resized proportionally
MAX_OCR_DIMENSION = 2400


def _get_reader() -> easyocr.Reader:
    global _reader
    if _reader is None:
        print("[ocr] Loading EasyOCR model...")
        _reader = easyocr.Reader(["en"], gpu=False)
        print("[ocr] EasyOCR model ready")
    return _reader


def warm_up():
    """Pre-load the EasyOCR model at startup."""
    _get_reader()


def _resize_if_needed(img: Image.Image) -> Image.Image:
    """Resize image if either dimension exceeds MAX_OCR_DIMENSION."""
    w, h = img.size
    if w <= MAX_OCR_DIMENSION and h <= MAX_OCR_DIMENSION:
        return img
    scale = min(MAX_OCR_DIMENSION / w, MAX_OCR_DIMENSION / h)
    new_w, new_h = int(w * scale), int(h * scale)
    print(f"[ocr] Resizing {w}x{h} -> {new_w}x{new_h}")
    return img.resize((new_w, new_h), Image.LANCZOS)


def _preprocess(img: Image.Image) -> Image.Image:
    """Enhance image for better OCR: grayscale, sharpen, boost contrast."""
    # Convert to grayscale — removes color noise, faster OCR
    img = img.convert("L")
    # Sharpen to recover text edges lost during phone camera blur
    img = img.filter(ImageFilter.SHARPEN)
    # Boost contrast — makes faded receipt text readable
    img = ImageEnhance.Contrast(img).enhance(1.8)
    # Convert back to RGB (EasyOCR expects it)
    return img.convert("RGB")


def run_ocr(image_bytes: bytes) -> tuple[str, float] | None:
    """Run EasyOCR on image bytes. Returns (text, confidence) or None."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        # Convert to RGB if needed (handles RGBA, palette, etc.)
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        img = _resize_if_needed(img)
        img = _preprocess(img)
        img_array = np.array(img)

        reader = _get_reader()
        results = reader.readtext(img_array)

        if not results:
            return None

        lines: list[str] = []
        confidences: list[float] = []

        for _bbox, text, conf in results:
            lines.append(text)
            confidences.append(conf)

        full_text = "\n".join(lines)
        avg_confidence = sum(confidences) / len(confidences) * 100

        if len(full_text.strip()) < 10:
            return None

        return full_text, avg_confidence
    except Exception as e:
        print(f"[ocr] EasyOCR failed: {e}")
        return None
