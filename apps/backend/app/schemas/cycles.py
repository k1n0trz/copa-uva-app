from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import date

class CycleEventCreate(BaseModel):
    type: str
    date: date
    meta: Optional[Dict[str, Any]] = None

class CycleEventResponse(CycleEventCreate):
    id: int
    user_id: str

    class Config:
        orm_mode = True
