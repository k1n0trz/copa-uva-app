from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.api.deps import get_current_user
from app.models.cycle import CycleEvent
from app.schemas.cycles import CycleEventCreate

router = APIRouter(prefix="/cycle", tags=["cycle"])

@router.post("/events")
def register_event(event: CycleEventCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    new_event = CycleEvent(
        user_id=user["uid"],
        type=event.type,
        date=event.date,
        meta=event.meta
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return {"status": "ok", "event_id": new_event.id}

@router.get("/history")
def get_cycle_history(db: Session = Depends(get_db), user=Depends(get_current_user)):
    events = db.query(CycleEvent).filter_by(user_id=user["uid"]).order_by(CycleEvent.date.desc()).all()
    return events
