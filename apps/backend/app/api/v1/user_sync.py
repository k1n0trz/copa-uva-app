from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User

router = APIRouter(prefix="/user", tags=["users"])

@router.post("/create-or-sync")
def create_or_sync_user(
    user_data: dict,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_current_user),
):
    firebase_uid = token_data.get("uid")
    if not firebase_uid:
        raise HTTPException(status_code=400, detail="UID no encontrado en token")

    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()

    if not user:
        # Crear nuevo usuario
        new_user = User(
            firebase_uid=firebase_uid,
            nombre=user_data.get("nombre"),
            edad=user_data.get("edad"),
            ciudad=user_data.get("ciudad"),
            pais=user_data.get("pais"),
            direccion=user_data.get("direccion"),
            email=user_data.get("correo"),
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"status": "created", "user": new_user.id}
    else:
        # Actualizar datos si ya existe
        user.nombre = user_data.get("nombre", user.nombre)
        user.edad = user_data.get("edad", user.edad)
        user.ciudad = user_data.get("ciudad", user.ciudad)
        user.pais = user_data.get("pais", user.pais)
        user.direccion = user_data.get("direccion", user.direccion)
        db.commit()
        return {"status": "updated", "user": user.id}
