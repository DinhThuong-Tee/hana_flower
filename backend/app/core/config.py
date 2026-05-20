from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str
    MONGO_URL: str
    DATABASE_NAME: str

    class Config:
        env_file = ".env"

settings = Settings()