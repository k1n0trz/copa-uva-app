from sqlalchemy import Column, Integer, String, Date, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class CycleEvent(Base):
    __tablename__ = "cycle_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    type = Column(String, nullable=False)  # Ej: 'period_start'
    date = Column(Date, nullable=False)
    meta = Column(JSON, nullable=True)

class CycleSummary(Base):
    __tablename__ = "cycle_summaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    average_length = Column(Integer, nullable=True)
