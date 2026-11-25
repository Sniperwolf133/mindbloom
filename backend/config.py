import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

# Load .env from backend directory first, then project root
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(PROJECT_ROOT / ".env")


class Settings:
    APP_NAME: str = "MindMate API"
    APP_VERSION: str = "1.0.0"

    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip()
    GROQ_REASONING_EFFORT: str = os.getenv("GROQ_REASONING_EFFORT", "medium").strip()
    GROQ_MAX_TOKENS: int = int(os.getenv("GROQ_MAX_TOKENS", "2048"))
    HUGGINGFACEHUB_API_TOKEN: str = os.getenv("HUGGINGFACEHUB_API_TOKEN", "").strip()

    APP_SECRET_KEY: str = os.getenv(
        "APP_SECRET_KEY", "mindmate-dev-secret-change-in-production"
    ).strip()
    ADMIN_ACCESS_CODE: str = os.getenv("ADMIN_ACCESS_CODE", "mindmate-admin").strip()

    EMBEDDING_MODEL: str = os.getenv(
        "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
    ).strip()

    DATABASE_URL: str = os.getenv("DATABASE_URL", "").strip()
    DATABASE_PATH: Path = (
        Path(DATABASE_URL.replace("sqlite:///", ""))
        if DATABASE_URL.startswith("sqlite:///")
        else BACKEND_DIR / "mindmate.db"
    )
    if not DATABASE_PATH.is_absolute():
        DATABASE_PATH = (BACKEND_DIR / DATABASE_PATH).resolve()

    _chroma_raw = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db").strip()
    CHROMA_PERSIST_DIR: Path = (
        Path(_chroma_raw)
        if Path(_chroma_raw).is_absolute()
        else (BACKEND_DIR / _chroma_raw).resolve()
    )

    _upload_raw = os.getenv("UPLOAD_DIR", "./uploads").strip()
    UPLOAD_DIR: Path = (
        Path(_upload_raw)
        if Path(_upload_raw).is_absolute()
        else (BACKEND_DIR / _upload_raw).resolve()
    )

    SAMPLE_DOCS_DIR: Path = BACKEND_DIR / "sample_docs"

    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://localhost:3000",
        ).split(",")
        if origin.strip()
    ]

    def ensure_directories(self) -> None:
        self.CHROMA_PERSIST_DIR.mkdir(parents=True, exist_ok=True)
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.SAMPLE_DOCS_DIR.mkdir(parents=True, exist_ok=True)
        self.DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

    @property
    def groq_configured(self) -> bool:
        return bool(
            self.GROQ_API_KEY
            and self.GROQ_API_KEY != "your_groq_api_key_here"
            and not self.GROQ_API_KEY.startswith("your_")
        )

    @property
    def hf_configured(self) -> bool:
        return bool(
            self.HUGGINGFACEHUB_API_TOKEN
            and self.HUGGINGFACEHUB_API_TOKEN != "your_huggingface_token_here"
            and not self.HUGGINGFACEHUB_API_TOKEN.startswith("your_")
        )


settings = Settings()
settings.ensure_directories()

