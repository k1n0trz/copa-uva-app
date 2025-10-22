from fastapi import Header, HTTPException, status
from typing import Optional
from firebase_admin import auth

def get_current_uid(authorization: Optional[str] = Header(None)) -> str:
    """
    Lee 'Authorization: Bearer <id_token>' y devuelve el UID de Firebase.
    Lanza 401 si el token es inválido o falta.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing or malformed",
        )
    token = authorization.split(" ", 1)[1]

    try:
        decoded = auth.verify_id_token(token)
        return decoded["uid"]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase ID token",
        )
