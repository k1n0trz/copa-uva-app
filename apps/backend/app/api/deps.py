# apps/backend/app/api/deps.py
import os
from typing import Generator

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.core.config import settings  # ✅ IMPORTANTE

print("DEBUG FIREBASE_CREDENTIALS:", os.getcwd(), settings.FIREBASE_CREDENTIALS)

# --- Inicializar Firebase Admin (una sola vez) ---
if not firebase_admin._apps:
    cred_path = settings.FIREBASE_CREDENTIALS
    if not cred_path or not os.path.exists(cred_path):
        import os
        print("DEBUG FIREBASE_CREDENTIALS:", os.path.abspath(cred_path))
        print("EXISTS:", os.path.exists(cred_path))
        raise RuntimeError(f"FIREBASE_CREDENTIALS no está definido o el fichero no existe: {cred_path}")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

# --- Seguridad HTTP Bearer para leer Authorization header ---
security = HTTPBearer()


def get_db() -> Generator[Session, None, None]:
    """Dependencia: obtener sesión de DB (SQLAlchemy)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """
    Valida el idToken de Firebase y devuelve el token decodificado (claims).
    Lanza HTTPException 401 si inválido.
    """
    id_token = token.credentials
    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="ID token inválido")
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="ID token expirado")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autorizado")

    return decoded_token
