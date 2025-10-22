from pydantic import BaseModel
from typing import Optional


class UserCreate(BaseModel):
    firebase_uid: str
    nombre: str
    correo: str
    ciudad: str
    pais: str
    direccion: str
    edad: Optional[int] = None  # opcional para evitar errores si viene vacío

    class Config:
        orm_mode = True
