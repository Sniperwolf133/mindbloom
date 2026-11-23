from typing import Literal
from pydantic import BaseModel, Field, field_validator


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=60)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6, max_length=128)
    role: Literal["student", "admin"] = "student"
    admin_code: str | None = Field(default=None, max_length=100)
    pet_name: str = Field(default="Mochi", min_length=1, max_length=30)
    pet_species: Literal["cat", "bunny", "fox"] = "cat"

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if "@" not in cleaned or "." not in cleaned.split("@")[-1]:
            raise ValueError("Please enter a valid email address.")
        return cleaned

    @field_validator("name", "pet_name")
    @classmethod
    def strip_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field cannot be blank.")
        return cleaned


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class DemoLoginRequest(BaseModel):
    role: Literal["student", "admin"] = "student"


class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    role: Literal["student", "admin"]
    created_at: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

