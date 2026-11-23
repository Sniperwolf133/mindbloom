import uuid
from fastapi import APIRouter, Depends, HTTPException, status

from database.database import db_session, utc_now_iso
from models.auth import UserProfile
from models.wellness import (
    WellnessActivity,
    WellnessCompleteRequest,
    WellnessCompleteResponse,
    WellnessCompletionRecord,
    WellnessProgressResponse,
)
from services.auth_service import get_current_user
from services.pet_service import apply_wellness_activity_boost
from services.wellness_service import WELLNESS_ACTIVITIES, get_activity_by_id

router = APIRouter(prefix="/api/wellness", tags=["Wellness Activities"])

COMPLETION_MESSAGES = {
    "breathing": "Lovely pause. Taking a moment to breathe softly really matters.",
    "mindfulness": "Beautiful grounding check-in. You are right here in this safe moment.",
    "study_break": "Nice study break! Stepping away helps your mind absorb and recharge.",
    "gratitude": "What a warm reflection. Small comforts quietly build resilience.",
    "reflection": "Thank you for checking in gently with yourself today.",
    "stretching": "Your shoulders and mind thank you for that kind stretch!",
    "focus_timer": "Great gentle focus block — showing up steadily is more than enough.",
}


@router.get("/activities", response_model=list[WellnessActivity])
def list_wellness_activities(category: str | None = None):
    if category:
        return [a for a in WELLNESS_ACTIVITIES if a.category == category]
    return WELLNESS_ACTIVITIES


@router.post("/complete", response_model=WellnessCompleteResponse)
def complete_wellness_activity(
    payload: WellnessCompleteRequest,
    current_user: UserProfile = Depends(get_current_user),
):
    activity = get_activity_by_id(payload.activity_id)
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wellness activity not found.",
        )

    completion_id = str(uuid.uuid4())
    now = utc_now_iso()
    duration = payload.duration_minutes or activity.duration_minutes
    note = payload.reflection_note.strip() if payload.reflection_note else None

    with db_session() as conn:
        conn.execute(
            """
            INSERT INTO wellness_completions (
                id, user_id, activity_id, activity_title, category,
                duration_minutes, reflection_note, completed_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                completion_id,
                current_user.id,
                activity.id,
                activity.title,
                activity.category,
                duration,
                note,
                now,
            ),
        )

    updated_pet, newly_unlocked = apply_wellness_activity_boost(
        current_user.id,
        activity.category,
        activity.title,
        activity.pet_reward_xp,
    )

    completion_record = WellnessCompletionRecord(
        id=completion_id,
        activity_id=activity.id,
        activity_title=activity.title,
        category=activity.category,
        duration_minutes=duration,
        reflection_note=note,
        completed_at=now,
    )

    return WellnessCompleteResponse(
        completion=completion_record,
        completion_message=COMPLETION_MESSAGES.get(
            activity.category,
            "Well done taking a gentle moment for yourself today!",
        ),
        pet_reaction=updated_pet.last_reaction,
        pet_mood=updated_pet.mood,
        pet_happiness=updated_pet.happiness,
        pet_energy=updated_pet.energy,
        pet_xp=updated_pet.xp,
        pet_stage=updated_pet.stage,
        newly_unlocked_accessories=newly_unlocked,
    )


@router.get("/progress", response_model=WellnessProgressResponse)
def get_wellness_progress(current_user: UserProfile = Depends(get_current_user)):
    today_prefix = utc_now_iso()[:10]
    with db_session() as conn:
        rows = conn.execute(
            """
            SELECT id, activity_id, activity_title, category, duration_minutes,
                   reflection_note, completed_at
            FROM wellness_completions
            WHERE user_id = ?
            ORDER BY completed_at DESC
            LIMIT 50
            """,
            (current_user.id,),
        ).fetchall()

    records = [WellnessCompletionRecord(**dict(row)) for row in rows]
    completed_today = sum(1 for r in records if r.completed_at.startswith(today_prefix))
    total_minutes = sum(r.duration_minutes for r in records)
    categories = sorted({r.category for r in records})

    if not records:
        encouragement = "Whenever you're ready, even one calm minute counts."
    elif completed_today > 0:
        encouragement = f"You've gifted yourself {completed_today} gentle moment(s) today. No rush, keep going at your own pace."
    else:
        encouragement = "Welcome back! Pick up right where you feel comfortable — zero pressure."

    return WellnessProgressResponse(
        total_completed=len(records),
        completed_today=completed_today,
        total_minutes=total_minutes,
        categories_explored=categories,
        recent_completions=records[:12],
        encouragement_message=encouragement,
    )

