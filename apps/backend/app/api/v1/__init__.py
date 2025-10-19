from fastapi import APIRouter
from app.api.v1.routes import user_routes

api_router = APIRouter()

# Incluye las rutas aquí
api_router.include_router(user_routes.router, prefix="/users", tags=["Users"])
