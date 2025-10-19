from fastapi import APIRouter
from app.api.v1.routes import user_routes  # ✅ esta línea importa el archivo correcto

api_router = APIRouter()

# Registrar las rutas
api_router.include_router(user_routes.router, prefix="/users", tags=["Users"])
