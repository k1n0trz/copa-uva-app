from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.schemas.predict import PredictRequest, PredictResponse

router = APIRouter(prefix="/predict", tags=["predict"])

@router.post("/", response_model=PredictResponse)
def make_prediction(data: PredictRequest, user=Depends(get_current_user)):
    # Aquí conectarás tu modelo más adelante
    return {
        "next_period_start": "2025-11-18",
        "confidence_days": 3,
        "fertile_window": ["2025-11-03", "2025-11-04"]
    }
