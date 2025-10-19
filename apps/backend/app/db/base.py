from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Importa todos los modelos aquí para que Alembic los detecte
from app.models.user import User
from app.models.cycle import Cycle
