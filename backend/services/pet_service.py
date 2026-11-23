import io
import json
from fastapi import HTTPException, status
from PIL import Image, ImageDraw

from database.database import db_session, utc_now_iso
from models.pet import (
    AccessoryInfo,
    PetAccessory,
    PetInteractRequest,
    PetResponse,
    PetUpdateRequest,
)

ACCESSORY_CATALOG: list[dict] = [
    {
        "id": "none",
        "name": "Natural Look",
        "description": "Cozy and classic without accessories.",
        "unlock_xp": 0,
    },
    {
        "id": "sprout",
        "name": "Little Sprout",
        "description": "A fresh leaf sprout celebrating your gentle growth.",
        "unlock_xp": 0,
    },
    {
        "id": "scarf",
        "name": "Lavender Scarf",
        "description": "A soft pastel knit scarf for late-night study sessions.",
        "unlock_xp": 0,
    },
    {
        "id": "glasses",
        "name": "Cozy Study Glasses",
        "description": "Round reading frames for focused study sessions.",
        "unlock_xp": 40,
    },
    {
        "id": "mug",
        "name": "Warm Tea Mug",
        "description": "A comforting chamomile mug held nearby.",
        "unlock_xp": 80,
    },
    {
        "id": "beanie",
        "name": "Mint Beanie",
        "description": "A snuggly knit beanie for calm, quiet mornings.",
        "unlock_xp": 120,
    },
    {
        "id": "flower_crown",
        "name": "Meadow Flower Crown",
        "description": "Woven pastel blossoms celebrating mindful care.",
        "unlock_xp": 180,
    },
    {
        "id": "star_badge",
        "name": "Radiant Star Charm",
        "description": "A warm golden charm for a thriving companion.",
        "unlock_xp": 250,
    },
]


def _compute_stage(xp: int) -> tuple[int, str, int | None]:
    if xp >= 250:
        return 3, "Radiant Guardian", None
    if xp >= 100:
        return 2, "Cozy Companion", 250
    return 1, "Tiny Sprout", 100


def _compute_unlocked(xp: int, existing_unlocked: list[str]) -> tuple[list[str], list[str]]:
    unlocked_set = set(existing_unlocked)
    newly_unlocked: list[str] = []
    for item in ACCESSORY_CATALOG:
        if xp >= item["unlock_xp"] and item["id"] not in unlocked_set:
            unlocked_set.add(item["id"])
            newly_unlocked.append(item["name"])
    ordered = [item["id"] for item in ACCESSORY_CATALOG if item["id"] in unlocked_set]
    return ordered, newly_unlocked


def _clamp(val: int, low: int = 35, high: int = 100) -> int:
    """Keep pet meters gentle and encouraging — never punitive."""
    return max(low, min(high, val))


def _ensure_pet_row(conn, user_id: str) -> dict:
    row = conn.execute("SELECT * FROM pets WHERE user_id = ?", (user_id,)).fetchone()
    if row:
        return dict(row)

    now = utc_now_iso()
    conn.execute(
        """
        INSERT INTO pets (
            user_id, name, species, color_theme, mood, happiness, energy,
            affection, xp, stage, equipped_accessory, unlocked_accessories,
            last_reaction, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            "Mochi",
            "cat",
            "lavender",
            "calm",
            75,
            80,
            25,
            0,
            1,
            "sprout",
            json.dumps(["none", "sprout", "scarf"]),
            "Mochi is here whenever you want a gentle pause.",
            now,
        ),
    )
    row = conn.execute("SELECT * FROM pets WHERE user_id = ?", (user_id,)).fetchone()
    return dict(row)


def _row_to_pet_response(row: dict) -> PetResponse:
    unlocked: list[PetAccessory] = json.loads(row["unlocked_accessories"])
    xp = int(row["xp"])
    stage, stage_name, next_stage_xp = _compute_stage(xp)

    catalog = [
        AccessoryInfo(
            id=item["id"],
            name=item["name"],
            description=item["description"],
            unlock_xp=item["unlock_xp"],
            unlocked=item["id"] in unlocked,
        )
        for item in ACCESSORY_CATALOG
    ]

    return PetResponse(
        name=row["name"],
        species=row["species"],
        color_theme=row["color_theme"],
        mood=row["mood"],
        happiness=int(row["happiness"]),
        energy=int(row["energy"]),
        affection=int(row["affection"]),
        xp=xp,
        stage=stage,
        stage_name=stage_name,
        next_stage_xp=next_stage_xp,
        equipped_accessory=row["equipped_accessory"],
        unlocked_accessories=unlocked,
        accessories_catalog=catalog,
        last_reaction=row["last_reaction"],
        updated_at=row["updated_at"],
    )


def get_pet(user_id: str) -> PetResponse:
    with db_session() as conn:
        row = _ensure_pet_row(conn, user_id)
    return _row_to_pet_response(row)


def update_pet(user_id: str, payload: PetUpdateRequest) -> PetResponse:
    with db_session() as conn:
        row = _ensure_pet_row(conn, user_id)
        unlocked = json.loads(row["unlocked_accessories"])

        new_name = payload.name if payload.name is not None else row["name"]
        new_species = payload.species if payload.species is not None else row["species"]
        new_color = payload.color_theme if payload.color_theme is not None else row["color_theme"]
        new_accessory = row["equipped_accessory"]

        if payload.equipped_accessory is not None:
            if payload.equipped_accessory not in unlocked:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This accessory unlocks naturally as you enjoy wellness activities together!",
                )
            new_accessory = payload.equipped_accessory

        now = utc_now_iso()
        reaction = f"{new_name} loves the cozy new look!"
        conn.execute(
            """
            UPDATE pets
            SET name = ?, species = ?, color_theme = ?, equipped_accessory = ?,
                last_reaction = ?, updated_at = ?
            WHERE user_id = ?
            """,
            (new_name, new_species, new_color, new_accessory, reaction, now, user_id),
        )
        updated = _ensure_pet_row(conn, user_id)
    return _row_to_pet_response(updated)


def interact_with_pet(user_id: str, payload: PetInteractRequest) -> PetResponse:
    with db_session() as conn:
        row = _ensure_pet_row(conn, user_id)
        name = row["name"]
        happiness = int(row["happiness"])
        energy = int(row["energy"])
        affection = int(row["affection"])
        xp = int(row["xp"])
        unlocked = json.loads(row["unlocked_accessories"])

        if payload.action == "cuddle":
            happiness = _clamp(happiness + 6)
            affection = _clamp(affection + 8, low=0)
            xp += 5
            mood = "happy"
            reaction = f"{name} leans into your gentle cuddle and purrs softly."
        elif payload.action == "snack":
            happiness = _clamp(happiness + 7)
            energy = _clamp(energy + 10)
            xp += 5
            mood = "excited"
            reaction = f"{name} nibbles a warm berry treat and wiggles excitedly!"
        elif payload.action == "nap":
            energy = _clamp(energy + 15)
            happiness = _clamp(happiness + 3)
            xp += 5
            mood = "sleepy"
            reaction = f"{name} curls into a soft blanket for a peaceful power nap."
        else:  # cheer
            happiness = _clamp(happiness + 8)
            affection = _clamp(affection + 6, low=0)
            xp += 8
            mood = "excited"
            reaction = f"{name} does a happy little hop — cheering you on today!"

        stage, _, _ = _compute_stage(xp)
        new_unlocked, newly = _compute_unlocked(xp, unlocked)
        if newly:
            reaction += f" Unlocked: {', '.join(newly)}!"

        now = utc_now_iso()
        conn.execute(
            """
            UPDATE pets
            SET mood = ?, happiness = ?, energy = ?, affection = ?, xp = ?,
                stage = ?, unlocked_accessories = ?, last_reaction = ?, updated_at = ?
            WHERE user_id = ?
            """,
            (
                mood,
                happiness,
                energy,
                affection,
                xp,
                stage,
                json.dumps(new_unlocked),
                reaction,
                now,
                user_id,
            ),
        )
        updated = _ensure_pet_row(conn, user_id)
    return _row_to_pet_response(updated)


def apply_mood_checkin_boost(user_id: str, user_mood: str) -> PetResponse:
    with db_session() as conn:
        row = _ensure_pet_row(conn, user_id)
        name = row["name"]
        happiness = _clamp(int(row["happiness"]) + 6)
        energy = int(row["energy"])
        affection = _clamp(int(row["affection"]) + 12, low=0)
        xp = int(row["xp"]) + 15
        unlocked = json.loads(row["unlocked_accessories"])

        mood_map = {
            "Happy": ("happy", f"{name} is beaming right alongside you today!"),
            "Calm": ("calm", f"{name} breathes slowly and shares this peaceful moment."),
            "Okay": ("calm", f"{name} sits quietly beside you — steady days matter too."),
            "Stressed": ("calm", f"{name} nudges a cozy cushion over so you can take one slow breath."),
            "Sad": ("sad", f"{name} stays close with a soft, comforting hug. No pressure at all."),
            "Overwhelmed": ("sleepy", f"{name} helps quiet the noise — take things one tiny step at a time."),
        }
        pet_mood, reaction = mood_map.get(
            user_mood, ("calm", f"{name} appreciates you checking in with yourself.")
        )

        stage, _, _ = _compute_stage(xp)
        new_unlocked, newly = _compute_unlocked(xp, unlocked)
        if newly:
            reaction += f" New gift unlocked: {', '.join(newly)}!"

        now = utc_now_iso()
        conn.execute(
            """
            UPDATE pets
            SET mood = ?, happiness = ?, energy = ?, affection = ?, xp = ?,
                stage = ?, unlocked_accessories = ?, last_reaction = ?, updated_at = ?
            WHERE user_id = ?
            """,
            (
                pet_mood,
                happiness,
                energy,
                affection,
                xp,
                stage,
                json.dumps(new_unlocked),
                reaction,
                now,
                user_id,
            ),
        )
        updated = _ensure_pet_row(conn, user_id)
    return _row_to_pet_response(updated)


def apply_wellness_activity_boost(
    user_id: str, category: str, activity_title: str, reward_xp: int
) -> tuple[PetResponse, list[str]]:
    with db_session() as conn:
        row = _ensure_pet_row(conn, user_id)
        name = row["name"]
        happiness = int(row["happiness"])
        energy = int(row["energy"])
        affection = int(row["affection"])
        xp = int(row["xp"]) + reward_xp
        unlocked = json.loads(row["unlocked_accessories"])

        if category in ("breathing", "mindfulness"):
            happiness = _clamp(happiness + 10)
            energy = _clamp(energy + 6)
            affection = _clamp(affection + 8, low=0)
            pet_mood = "calm"
            reaction = f"{name} feels peaceful and grounded after '{activity_title}' with you."
        elif category in ("study_break", "stretching"):
            happiness = _clamp(happiness + 8)
            energy = _clamp(energy + 15)
            affection = _clamp(affection + 6, low=0)
            pet_mood = "happy"
            reaction = f"{name} stretches happily and feels refreshed from your break!"
        elif category == "focus_timer":
            happiness = _clamp(happiness + 8)
            energy = _clamp(energy + 5)
            affection = _clamp(affection + 7, low=0)
            pet_mood = "excited"
            reaction = f"{name} cheers softly for your mindful focus time!"
        else:  # gratitude, reflection
            happiness = _clamp(happiness + 12)
            energy = _clamp(energy + 6)
            affection = _clamp(affection + 10, low=0)
            pet_mood = "happy"
            reaction = f"{name} holds your warm reflections close and glows gently."

        stage, stage_name, _ = _compute_stage(xp)
        old_stage = int(row["stage"])
        if stage > old_stage:
            reaction += f" {name} evolved into {stage_name}!"

        new_unlocked, newly_unlocked = _compute_unlocked(xp, unlocked)
        if newly_unlocked:
            reaction += f" Unlocked: {', '.join(newly_unlocked)}!"

        now = utc_now_iso()
        conn.execute(
            """
            UPDATE pets
            SET mood = ?, happiness = ?, energy = ?, affection = ?, xp = ?,
                stage = ?, unlocked_accessories = ?, last_reaction = ?, updated_at = ?
            WHERE user_id = ?
            """,
            (
                pet_mood,
                happiness,
                energy,
                affection,
                xp,
                stage,
                json.dumps(new_unlocked),
                reaction,
                now,
                user_id,
            ),
        )
        updated = _ensure_pet_row(conn, user_id)
    return _row_to_pet_response(updated), newly_unlocked


def generate_pet_badge_png(user_id: str) -> bytes:
    """Use Pillow to generate a shareable pastel keepsake card for the user's pet."""
    pet = get_pet(user_id)
    theme_bg = {
        "lavender": (241, 236, 254),
        "mint": (231, 248, 240),
        "peach": (254, 241, 232),
        "sky": (232, 244, 254),
    }.get(pet.color_theme, (241, 236, 254))
    accent = {
        "lavender": (147, 118, 224),
        "mint": (84, 178, 138),
        "peach": (229, 146, 108),
        "sky": (99, 165, 226),
    }.get(pet.color_theme, (147, 118, 224))

    img = Image.new("RGB", (680, 360), theme_bg)
    draw = ImageDraw.Draw(img)

    # Soft card frame
    draw.rounded_rectangle([24, 24, 656, 336], radius=28, fill=(255, 253, 249), outline=accent, width=3)
    # Pet emblem circle
    draw.ellipse([58, 86, 226, 254], fill=theme_bg, outline=accent, width=4)
    # Cute simple pet face silhouette inside circle
    draw.ellipse([94, 126, 190, 218], fill=(255, 255, 255), outline=accent, width=3)
    if pet.species == "cat":
        draw.polygon([(102, 138), (110, 102), (132, 126)], fill=(255, 255, 255), outline=accent)
        draw.polygon([(182, 138), (174, 102), (152, 126)], fill=(255, 255, 255), outline=accent)
    elif pet.species == "bunny":
        draw.ellipse([108, 84, 132, 138], fill=(255, 255, 255), outline=accent, width=2)
        draw.ellipse([152, 84, 176, 138], fill=(255, 255, 255), outline=accent, width=2)
    else:  # fox
        draw.polygon([(98, 138), (104, 98), (136, 124)], fill=(252, 207, 173), outline=accent)
        draw.polygon([(186, 138), (180, 98), (148, 124)], fill=(252, 207, 173), outline=accent)
    # Eyes & smile
    draw.ellipse([120, 162, 130, 172], fill=(64, 58, 79))
    draw.ellipse([154, 162, 164, 172], fill=(64, 58, 79))
    draw.arc([132, 174, 152, 188], start=10, end=170, fill=(64, 58, 79), width=2)

    # Text details
    draw.text((260, 72), "MindMate Companion Keepsake", fill=accent)
    draw.text((260, 112), f"{pet.name} the {pet.species.title()}", fill=(48, 43, 66))
    draw.text((260, 146), f"Stage {pet.stage}: {pet.stage_name}  |  Mood: {pet.mood.title()}", fill=(95, 89, 114))
    draw.text((260, 184), f"Happiness: {pet.happiness}%   Energy: {pet.energy}%   XP: {pet.xp}", fill=(72, 66, 92))
    draw.text((260, 222), f"Accessory: {pet.equipped_accessory.replace('_', ' ').title()}", fill=(95, 89, 114))
    draw.text((260, 266), "Take care of yourself, and your little companion grows with you.", fill=accent)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

