from sqlalchemy import Column, Integer, Date, JSON, ForeignKey
from app.db.base import Base

class Cycle(Base):
    __tablename__ = "cycles"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    meta = Column(JSON, default={})  # síntomas, notas, etc.
