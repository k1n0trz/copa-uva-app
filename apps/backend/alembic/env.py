from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv
import os
import sys

# ---- Configurar rutas ----
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
APP_DIR = os.path.join(BASE_DIR, 'app')
sys.path.append(APP_DIR)

# ---- Cargar variables de entorno ----
load_dotenv(os.path.join(BASE_DIR, '.env'))

# ---- Configuración Alembic ----
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---- Importar Base y modelos ----
from app.db.base import Base
from app.db import import_models  # 👈 esto debe ir después de sys.path y load_dotenv

# ---- URL de conexión ----
POSTGRES_URL = os.getenv("POSTGRES_URL")

# ---- Modo sin conexión ----
def run_migrations_offline():
    context.configure(
        url=POSTGRES_URL,
        target_metadata=Base.metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

# ---- Modo con conexión ----
def run_migrations_online():
    connectable = engine_from_config(
        {"sqlalchemy.url": POSTGRES_URL},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=Base.metadata)

        with context.begin_transaction():
            context.run_migrations()

# ---- Ejecución ----
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
