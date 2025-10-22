from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    firebase_uid: str
    nombre: str
    correo: str
    ciudad: str
    pais: str
    direccion: str
    edad: Optional[int] = None

    class Config:
        orm_mode = True

class UserOut(BaseModel):
    id: int
    firebase_uid: str
    nombre: str
    correo: str
    ciudad: str
    pais: str
    direccion: str
    edad: Optional[int] = None

    class Config:
        orm_mode = True
