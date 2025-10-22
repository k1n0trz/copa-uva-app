from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.users import UserCreate

router = APIRouter()

@router.post("/register")
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    """
    Guarda en PostgreSQL los datos de un usuario ya creado en Firebase.
    No crea usuarios en Firebase, solo los sincroniza.
    """

    # 1️⃣ Verificar si ya existe en la base de datos
    existing_user = db.query(User).filter(User.correo == payload.correo).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está registrado en la base de datos."
        )

    # 2️⃣ Crear usuario en PostgreSQL
    try:
        db_user = User(
            firebase_uid=payload.firebase_uid,
            nombre=payload.nombre,
            correo=payload.correo,
            ciudad=payload.ciudad,
            pais=payload.pais,
            direccion=payload.direccion,
            edad=payload.edad,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return {
            "message": "Usuario guardado correctamente en PostgreSQL",
            "user": {
                "id": db_user.id,
                "firebase_uid": db_user.firebase_uid,
                "correo": db_user.correo,
                "nombre": db_user.nombre
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar usuario en la base de datos: {str(e)}"
        )


@router.get("/ping")
def ping():
    return {"message": "pong"}
