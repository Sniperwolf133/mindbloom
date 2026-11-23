import uuid
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status

from database.database import db_session, utc_now_iso
from models.auth import UserProfile
from models.mood import (
    MoodCreateRequest,
    MoodEntryResponse,
    MoodHistoryResponse,
    MoodTrendPoint,
)
from services.auth_service import get_current_user
from services.pet_service import apply_mood_checkin_boost
from services.wellness_service import MOOD_SCORES, MOOD_SUGGESTIONS

router = APIRouter(prefix="/api/mood", tags=["Mood Tracker"])


@router.post("", response_model=MoodEntryResponse)
def record_mood(
    payload: MoodCreateRequest,
    current_user: UserProfile = Depends(get_current_user),
):
    entry_id = str(uuid.uuid4())
    now = utc_now_iso()
    suggestion = MOOD_SUGGESTIONS[payload.mood]

    with db_session() as conn:
        conn.execute(
            """
            INSERT INTO mood_entries (id, user_id, mood, journal, suggestion, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (entry_id, current_user.id, payload.mood, payload.journal, suggestion, now),
        )

    updated_pet = apply_mood_checkin_boost(current_user.id, payload.mood)

    return MoodEntryResponse(
        id=entry_id,
        mood=payload.mood,
        journal=payload.journal,
        suggestion=suggestion,
        created_at=now,
        pet_reaction=updated_pet.last_reaction,
    )


@router.get("/history", response_model=MoodHistoryResponse)
def get_mood_history(
    limit: int = 30,
    current_user: UserProfile = Depends(get_current_user),
):
    safe_limit = max(1, min(limit, 100))
    with db_session() as conn:
        rows = conn.execute(
            """
            SELECT id, mood, journal, suggestion, created_at
            FROM mood_entries
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (current_user.id, safe_limit),
        ).fetchall()

    entries = [MoodEntryResponse(**dict(row)) for row in rows]

    mood_counts: dict[str, int] = {
        "Happy": 0,
        "Calm": 0,
        "Okay": 0,
        "Stressed": 0,
        "Sad": 0,
        "Overwhelmed": 0,
    }
    daily_buckets: dict[str, list[dict]] = defaultdict(list)

    for entry in entries:
        mood_counts[entry.mood] = mood_counts.get(entry.mood, 0) + 1
        day_key = entry.created_at[:10]
        daily_buckets[day_key].append(
            {"mood": entry.mood, "score": MOOD_SCORES.get(entry.mood, 3)}
        )

    trends: list[MoodTrendPoint] = []
    for day_key in sorted(daily_buckets.keys())[-14:]:
        items = daily_buckets[day_key]
        avg_score = round(sum(i["score"] for i in items) / len(items))
        latest_mood = items[0]["mood"]
        trends.append(
            MoodTrendPoint(
                date=day_key,
                mood=latest_mood,
                score=avg_score,
                count=len(items),
            )
        )

    return MoodHistoryResponse(
        entries=entries,
        trends=trends,
        mood_counts=mood_counts,
        total_entries=len(entries),
        privacy_note=(
            "Your mood check-ins and private journal reflections stay strictly in your own account "
            "and are never used to diagnose medical or mental health conditions."
        ),
    )


@router.delete("/history")
def clear_mood_history(current_user: UserProfile = Depends(get_current_user)):
    with db_session() as conn:
        cursor = conn.execute(
            "DELETE FROM mood_entries WHERE user_id = ?",
            (current_user.id,),
        )
    return {"cleared": True, "deleted_count": cursor.rowcount}


@router.delete("/{entry_id}")
def delete_mood_entry(
    entry_id: str,
    current_user: UserProfile = Depends(get_current_user),
):
    with db_session() as conn:
        cursor = conn.execute(
            "DELETE FROM mood_entries WHERE id = ? AND user_id = ?",
            (entry_id, current_user.id),
        )
    if cursor.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mood entry not found.",
        )
    return {"deleted": True, "id": entry_id}

