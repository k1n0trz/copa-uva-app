from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Importa todos los modelos aquí
from app.models.user import User
from app.models.cycle import Cycle
