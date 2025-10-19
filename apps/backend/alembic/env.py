from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv
import os
import sys

# ---- Cargar variables de entorno (.env del backend) ----
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app'))
sys.path.append(BASE_DIR)

load_dotenv(os.path.join(BASE_DIR, '..', '.env'))

# ---- Config Alembic ----
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---- Importar Base de modelos ----
from app.db.base import Base  # ← Importa la Base que tiene los modelos registrados

# ---- Cargar URL de conexión ----
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
