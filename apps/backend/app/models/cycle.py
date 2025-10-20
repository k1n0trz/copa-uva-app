from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.base import Base

class Cycle(Base):
    __tablename__ = "cycles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

class CycleEvent(Base):
    __tablename__ = "cycle_events"
    id = Column(Integer, primary_key=True, index=True)
    cycle_id = Column(Integer, ForeignKey("cycles.id"))
    description = Column(String)
