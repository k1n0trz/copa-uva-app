from pydantic import BaseModel
from typing import List

class PredictRequest(BaseModel):
    model: str

class PredictResponse(BaseModel):
    next_period_start: str
    confidence_days: int
    fertile_window: List[str]
