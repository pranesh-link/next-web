import io
import pdfplumber


def extract_pdf_text(pdf_bytes: bytes) -> str | None:
    """Extract text from PDF using pdfplumber. Returns text or None."""
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            pages_text = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages_text.append(text)
            full_text = "\n".join(pages_text)
            return full_text if len(full_text.strip()) >= 20 else None
    except Exception as e:
        print(f"[pdf] pdfplumber text extraction failed: {e}")
        return None


def extract_pdf_tables(pdf_bytes: bytes) -> list[list[list[str]]]:
    """Extract tables from PDF. Returns list of tables (each is list of rows)."""
    try:
        tables: list[list[list[str]]] = []
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_tables = page.extract_tables()
                if page_tables:
                    tables.extend(page_tables)
        return tables
    except Exception as e:
        print(f"[pdf] table extraction failed: {e}")
        return []
