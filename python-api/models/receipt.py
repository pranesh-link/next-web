from pydantic import BaseModel, Field


class ReceiptItem(BaseModel):
    name: str = Field(max_length=200)
    amount: float


class ReceiptData(BaseModel):
    storeName: str | None = Field(None, max_length=200)
    totalAmount: float = Field(ge=0, le=100_000_000)
    date: str | None = None
    category: str = Field("Other", max_length=50)
    description: str = Field("", max_length=200)
    items: list[ReceiptItem] = []
    confidence: int = Field(50, ge=0, le=100)
