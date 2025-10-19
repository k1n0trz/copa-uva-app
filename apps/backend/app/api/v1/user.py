# backend/app/api/v1/user.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from apps.backend.app.db import get_db
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/user", tags=["User"])

@router.post("/create-or-sync")
def create_or_sync_user(
    user_data: dict,
    token_data: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    firebase_uid = token_data.get("uid")
    if not firebase_uid:
        raise HTTPException(status_code=400, detail="Token inválido: no contiene UID")

    # Buscar si el usuario ya existe en la base de datos
    usuario = db.query(User).filter(User.firebase_uid == firebase_uid).first()

    if usuario:
        # Si ya existe, actualiza datos básicos
        usuario.nombre = user_data.get("nombre", usuario.nombre)
        usuario.ciudad = user_data.get("ciudad", usuario.ciudad)
        usuario.pais = user_data.get("pais", usuario.pais)
        usuario.direccion = user_data.get("direccion", usuario.direccion)
        usuario.edad = user_data.get("edad", usuario.edad)
    else:
        # Si no existe, crea un nuevo registro
        usuario = User(
            firebase_uid=firebase_uid,
            nombre=user_data.get("nombre"),
            correo=user_data.get("correo"),
            ciudad=user_data.get("ciudad"),
            pais=user_data.get("pais"),
            direccion=user_data.get("direccion"),
            edad=user_data.get("edad"),
        )
        db.add(usuario)

    db.commit()
    db.refresh(usuario)
    return {"status": "ok", "usuario_id": usuario.id, "firebase_uid": firebase_uid}
