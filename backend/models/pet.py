from typing import Literal
from pydantic import BaseModel, Field, field_validator

PetSpecies = Literal["cat", "bunny", "fox"]
PetMood = Literal["happy", "sleepy", "sad", "excited", "calm"]
PetColorTheme = Literal["lavender", "mint", "peach", "sky"]
PetAccessory = Literal[
    "none",
    "sprout",
    "scarf",
    "glasses",
    "mug",
    "beanie",
    "flower_crown",
    "star_badge",
]


class AccessoryInfo(BaseModel):
    id: PetAccessory
    name: str
    description: str
    unlock_xp: int
    unlocked: bool


class PetResponse(BaseModel):
    name: str
    species: PetSpecies
    color_theme: PetColorTheme
    mood: PetMood
    happiness: int = Field(ge=0, le=100)
    energy: int = Field(ge=0, le=100)
    affection: int = Field(ge=0, le=100)
    xp: int = Field(ge=0)
    stage: int = Field(ge=1, le=3)
    stage_name: str
    next_stage_xp: int | None = None
    equipped_accessory: PetAccessory
    unlocked_accessories: list[PetAccessory]
    accessories_catalog: list[AccessoryInfo] = []
    last_reaction: str
    updated_at: str


class PetUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=30)
    species: PetSpecies | None = None
    color_theme: PetColorTheme | None = None
    equipped_accessory: PetAccessory | None = None

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Pet name cannot be empty.")
        return cleaned


class PetInteractRequest(BaseModel):
    action: Literal["cuddle", "snack", "nap", "cheer"]

