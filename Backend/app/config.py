from pathlib import Path

from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    app_name: str = "Support Ticketing CRM"
    debug: bool = True
    # Single DB file at project root (outside Backend/)
    database_url: str = f"sqlite:///{(PROJECT_ROOT / 'tickets.db').as_posix()}"

    class Config:
        env_file = str(BACKEND_DIR / ".env")
        extra = "ignore"


settings = Settings()
