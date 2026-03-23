from pydantic import BaseModel, Field


class ScheduleEntry(BaseModel):
    month: int = Field(ge=0, le=1200)
    date: str = Field("", max_length=20)
    emi: float = Field(ge=0, le=100_000_000)
    principal: float = Field(ge=0, le=100_000_000)
    interest: float = Field(ge=0, le=100_000_000)
    balance: float = Field(ge=0, le=500_000_000)


class ScheduleData(BaseModel):
    loanName: str = Field("Imported Loan", max_length=200)
    principal: float = Field(ge=0, le=500_000_000)
    interestRate: float = Field(ge=0, le=50)
    tenureMonths: int = Field(ge=0, le=600)
    emiAmount: float = Field(ge=0, le=100_000_000)
    startDate: str = Field("", max_length=20)
    remainingBalance: float = Field(ge=0, le=500_000_000)
    schedule: list[ScheduleEntry] = []
    confidence: int = Field(50, ge=0, le=100)
