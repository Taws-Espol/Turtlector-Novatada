import os
from typing import List, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
    # API Keys
    gemini_api_key: str = ""
    google_application_credentials: str = ""
    # App configuration
    app_name: str = "Turtlector API"
    app_version: str = "1.0.0"
    debug: bool = False
    # Server configuration
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = False
    # CORS configuration
    cors_origins: Union[List[str], str] = ["*"]
    cors_credentials: bool = True
    cors_methods: Union[List[str], str] = ["*"]
    cors_headers: Union[List[str], str] = ["*"] 

    @field_validator("cors_origins", "cors_methods", "cors_headers", mode="before")
    @classmethod
    def split_str(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    @field_validator("google_application_credentials")
    @classmethod
    def resolve_credentials_path(cls, v):
        if v and not os.path.isabs(v):
            # Convert relative path to absolute path from backend directory
            # __file__ is in backend/app/config/settings.py, so go up 3 levels to get to project root, then to backend
            current_dir = os.path.dirname(
                os.path.abspath(__file__)
            )  # backend/app/config
            backend_dir = os.path.dirname(os.path.dirname(current_dir))  # backend
            v = os.path.join(backend_dir, v)
        return v


settings = Settings()
