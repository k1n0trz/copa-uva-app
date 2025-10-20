from fastapi import FastAPI
from app.api.v1 import api_router
from fastapi.middleware.cors import CORSMiddleware
from app.db.base import Base
from app.models.cycle import Cycle, CycleEvent
from app.db.session import engine  # tu engine de SQLAlchemy

Base.metadata.create_all(bind=engine)  # registra todos los modelos

app = FastAPI()

Base.metadata.create_all(bind=engine)

# Importa los routers
from app.api.v1.routes.cycles import router as cycles_router
from app.api.v1.routes.predictions import router as predictions_router

app = FastAPI(
    title="Copa Uva API",
    version="1.0.0"
)

# Permitir CORS para el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Puedes restringir a tu dominio luego
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas principales
app.include_router(api_router, prefix="/api/v1")
app.include_router(cycles_router, prefix="/api/v1")
app.include_router(predictions_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Bienvenida a Copa Uva API 💜"}
