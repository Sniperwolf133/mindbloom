from typing import Literal
from pydantic import BaseModel, Field, field_validator

MoodType = Literal["Happy", "Calm", "Okay", "Stressed", "Sad", "Overwhelmed"]


class MoodCreateRequest(BaseModel):
    mood: MoodType
    journal: str | None = Field(default=None, max_length=1500)

    @field_validator("journal")
    @classmethod
    def clean_journal(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned if cleaned else None


class MoodEntryResponse(BaseModel):
    id: str
    mood: MoodType
    journal: str | None = None
    suggestion: str
    created_at: str
    pet_reaction: str | None = None


class MoodTrendPoint(BaseModel):
    date: str
    mood: MoodType
    score: int
    count: int


class MoodHistoryResponse(BaseModel):
    entries: list[MoodEntryResponse]
    trends: list[MoodTrendPoint]
    mood_counts: dict[str, int]
    total_entries: int
    privacy_note: str

