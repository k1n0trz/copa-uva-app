from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import api_router
from app.db.base import Base
from app.models.cycle import Cycle, CycleEvent
from app.models.user import User
from app.db.session import engine
from app.api.v1.routes.cycles import router as cycles_router
from app.api.v1.routes.predictions import router as predictions_router
from app.api.v1.routes.user_routes import router as users_router

# 🔹 Inicializa la base de datos
Base.metadata.create_all(bind=engine)

# 🔹 Inicializa la app FastAPI
app = FastAPI(
    title="Copa Uva API",
    version="1.0.0"
)

# 🔹 Permitir CORS (para comunicación con Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # luego puedes cambiar esto por tu dominio específico
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔹 Rutas principales
app.include_router(api_router, prefix="/api/v1")
app.include_router(cycles_router, prefix="/api/v1")
app.include_router(predictions_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])

# 🔹 Inicializar Firebase Admin SDK
import os
import firebase_admin
from firebase_admin import credentials
from app.core.config import settings

try:
    cred_path = settings.FIREBASE_CREDENTIALS

    # Si la ruta no es absoluta, la convertimos relativa al backend
    if not os.path.isabs(cred_path):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        cred_path = os.path.join(base_dir, "..", cred_path)
        cred_path = os.path.normpath(cred_path)

    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print(f"✅ Firebase Admin inicializado correctamente desde {cred_path}")

except Exception as e:
    print(f"⚠️ Error al inicializar Firebase Admin: {e}")

# 🔹 Ruta de prueba
@app.get("/")
def root():
    return {"message": "Bienvenida a Copa Uva API 💜"}