from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # PostgreSQL
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # App
    SECRET_KEY: str

    # Firebase
    FIREBASE_PROJECT_ID: str
    FIREBASE_CREDENTIALS: str  # corregido el nombre para que coincida con .env

    class Config:
        env_file = ".env"


settings = Settings()
