from typing import Literal
from pydantic import BaseModel, Field

ActivityCategory = Literal[
    "breathing",
    "mindfulness",
    "study_break",
    "gratitude",
    "reflection",
    "stretching",
    "focus_timer",
]


class WellnessActivity(BaseModel):
    id: str
    title: str
    category: ActivityCategory
    category_label: str
    duration_minutes: int
    description: str
    gentle_benefit: str
    steps: list[str]
    prompt_question: str | None = None
    pet_reward_xp: int
    pet_reward_text: str


class WellnessCompleteRequest(BaseModel):
    activity_id: str
    duration_minutes: int | None = Field(default=None, ge=1, le=180)
    reflection_note: str | None = Field(default=None, max_length=1000)


class WellnessCompletionRecord(BaseModel):
    id: str
    activity_id: str
    activity_title: str
    category: str
    duration_minutes: int
    reflection_note: str | None = None
    completed_at: str


class WellnessCompleteResponse(BaseModel):
    completion: WellnessCompletionRecord
    completion_message: str
    pet_reaction: str
    pet_mood: str
    pet_happiness: int
    pet_energy: int
    pet_xp: int
    pet_stage: int
    newly_unlocked_accessories: list[str] = []


class WellnessProgressResponse(BaseModel):
    total_completed: int
    completed_today: int
    total_minutes: int
    categories_explored: list[str]
    recent_completions: list[WellnessCompletionRecord]
    encouragement_message: str

