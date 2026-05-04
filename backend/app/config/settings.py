from typing import List, Union

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
    gemini_api_key: str = ""
    app_name: str = "Turtlector API"
    app_version: str = "1.0.0"
    cors_origins: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:4173",
    ]
    cors_credentials: bool = True
    cors_methods: Union[List[str], str] = ["GET", "POST"]
    cors_headers: Union[List[str], str] = ["*"]


settings = Settings()
