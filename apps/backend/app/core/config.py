from pydantic import BaseSettings

class Settings(BaseSettings):
    POSTGRES_URL: str
    SECRET_KEY: str
    FIREBASE_PROJECT_ID: str
    # variables de firebase si las necesitas para server
    FIREBASE_CERT_PATH: str = None
    REDIS_URL: str = "redis://localhost:6379/0"
    class Config:
        env_file = ".env"

settings = Settings()
