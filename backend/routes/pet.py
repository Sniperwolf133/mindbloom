from fastapi import APIRouter, Depends, Response

from models.auth import UserProfile
from models.pet import PetInteractRequest, PetResponse, PetUpdateRequest
from services.auth_service import get_current_user
from services.pet_service import (
    generate_pet_badge_png,
    get_pet,
    interact_with_pet,
    update_pet,
)

router = APIRouter(prefix="/api/pet", tags=["Virtual Pet Companion"])


@router.get("", response_model=PetResponse)
def fetch_pet(current_user: UserProfile = Depends(get_current_user)):
    return get_pet(current_user.id)


@router.put("", response_model=PetResponse)
def customize_pet(
    payload: PetUpdateRequest,
    current_user: UserProfile = Depends(get_current_user),
):
    return update_pet(current_user.id, payload)


@router.post("/interact", response_model=PetResponse)
def interact_pet(
    payload: PetInteractRequest,
    current_user: UserProfile = Depends(get_current_user),
):
    return interact_with_pet(current_user.id, payload)


@router.get("/badge")
def download_pet_badge(current_user: UserProfile = Depends(get_current_user)):
    png_bytes = generate_pet_badge_png(current_user.id)
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Content-Disposition": "attachment; filename=mindmate-companion-card.png"},
    )

