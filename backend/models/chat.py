from typing import Literal
from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2500)
    use_rag: bool = True

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Please write a message to your companion.")
        return cleaned


class RetrievedSource(BaseModel):
    doc_id: str | None = None
    source: str
    title: str
    page: int | None = None
    excerpt: str
    score: float | None = None


class ChatResponse(BaseModel):
    id: str
    reply: str
    guidance_type: Literal["rag_and_general", "general_only", "crisis_support"]
    is_crisis: bool = False
    sources: list[RetrievedSource] = []
    suggested_activity_id: str | None = None
    suggested_activity_title: str | None = None
    llm_mode: Literal["groq", "safety_override", "offline_fallback"] = "groq"
    created_at: str


class ChatMessageRecord(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    guidance_type: str = "general_only"
    is_crisis: bool = False
    sources: list[RetrievedSource] = []
    created_at: str


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageRecord]
    total_messages: int

