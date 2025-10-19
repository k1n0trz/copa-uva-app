from sqlalchemy import Column, String, Integer
from app.db.base import Base  # 👈 corregido

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True)
    nombre = Column(String)
    correo = Column(String, unique=True, index=True)
    ciudad = Column(String)
    pais = Column(String)
    direccion = Column(String)
    edad = Column(Integer)
