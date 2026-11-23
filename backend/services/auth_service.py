import base64
import hashlib
import hmac
import json
import secrets
import time
import uuid
from fastapi import Header, HTTPException, status

from config import settings
from database.database import db_session, utc_now_iso
from models.auth import AuthResponse, LoginRequest, SignupRequest, UserProfile

TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000
    ).hex()
    return f"{salt}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    if "$" not in stored_hash:
        return False
    salt, expected_digest = stored_hash.split("$", 1)
    computed = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000
    ).hex()
    return hmac.compare_digest(computed, expected_digest)


def create_access_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode("utf-8").rstrip("=")
    signature = hmac.new(
        settings.APP_SECRET_KEY.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")
    return f"{payload_b64}.{sig_b64}"


def decode_access_token(token: str) -> dict:
    try:
        payload_b64, sig_b64 = token.split(".", 1)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token format.",
        ) from exc

    expected_sig = hmac.new(
        settings.APP_SECRET_KEY.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode("utf-8").rstrip("=")

    if not hmac.compare_digest(sig_b64, expected_sig_b64):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token signature.",
        )

    padding = "=" * (-len(payload_b64) % 4)
    try:
        payload = json.loads(
            base64.urlsafe_b64decode((payload_b64 + padding).encode("utf-8")).decode("utf-8")
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not decode authentication token.",
        ) from exc

    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please sign in again.",
        )
    return payload


def signup_user(payload: SignupRequest) -> AuthResponse:
    if payload.role == "admin":
        if not payload.admin_code or payload.admin_code.strip() != settings.ADMIN_ACCESS_CODE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid admin access code. Leave role as Student or enter the configured admin access code.",
            )

    user_id = str(uuid.uuid4())
    now = utc_now_iso()
    password_hash = hash_password(payload.password)

    with db_session() as conn:
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ?", (payload.email,)
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists. Try signing in instead.",
            )

        conn.execute(
            """
            INSERT INTO users (id, name, email, password_hash, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (user_id, payload.name, payload.email, password_hash, payload.role, now),
        )
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
                payload.pet_name,
                payload.pet_species,
                "lavender",
                "happy",
                80,
                85,
                30,
                0,
                1,
                "sprout",
                json.dumps(["none", "sprout", "scarf"]),
                f"{payload.pet_name} is thrilled to begin this calm journey with you!",
                now,
            ),
        )

    token = create_access_token(user_id, payload.role)
    return AuthResponse(
        access_token=token,
        user=UserProfile(
            id=user_id,
            name=payload.name,
            email=payload.email,
            role=payload.role,
            created_at=now,
        ),
    )


def login_user(payload: LoginRequest) -> AuthResponse:
    with db_session() as conn:
        row = conn.execute(
            "SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = ?",
            (payload.email,),
        ).fetchone()

    if not row or not verify_password(payload.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    token = create_access_token(row["id"], row["role"])
    return AuthResponse(
        access_token=token,
        user=UserProfile(
            id=row["id"],
            name=row["name"],
            email=row["email"],
            role=row["role"],
            created_at=row["created_at"],
        ),
    )


def demo_login(role: str = "student") -> AuthResponse:
    email = "demo.admin@mindmate.local" if role == "admin" else "demo.student@mindmate.local"
    name = "Wellness Coordinator" if role == "admin" else "Alex (Student)"
    pet_name = "Clover" if role == "admin" else "Mochi"
    pet_species = "bunny" if role == "admin" else "cat"

    with db_session() as conn:
        row = conn.execute(
            "SELECT id, name, email, role, created_at FROM users WHERE email = ?",
            (email,),
        ).fetchone()

        if not row:
            user_id = f"demo-{role}-{uuid.uuid4().hex[:8]}"
            now = utc_now_iso()
            conn.execute(
                """
                INSERT INTO users (id, name, email, password_hash, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, name, email, hash_password(secrets.token_hex(16)), role, now),
            )
            conn.execute(
                """
                INSERT OR IGNORE INTO pets (
                    user_id, name, species, color_theme, mood, happiness, energy,
                    affection, xp, stage, equipped_accessory, unlocked_accessories,
                    last_reaction, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    pet_name,
                    pet_species,
                    "lavender",
                    "calm",
                    82,
                    80,
                    40,
                    45,
                    1,
                    "scarf",
                    json.dumps(["none", "sprout", "scarf", "glasses"]),
                    f"{pet_name} waves a cozy hello! Ready for a calm study session?",
                    now,
                ),
            )
            row = conn.execute(
                "SELECT id, name, email, role, created_at FROM users WHERE email = ?",
                (email,),
            ).fetchone()

    token = create_access_token(row["id"], row["role"])
    return AuthResponse(
        access_token=token,
        user=UserProfile(
            id=row["id"],
            name=row["name"],
            email=row["email"],
            role=row["role"],
            created_at=row["created_at"],
        ),
    )


def get_current_user(authorization: str | None = Header(default=None)) -> UserProfile:
    if not authorization:
        with db_session() as conn:
            row = conn.execute(
                "SELECT id, name, email, role, created_at FROM users WHERE id = 'guest-student'"
            ).fetchone()
        if row:
            return UserProfile(**dict(row))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    if not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must use Bearer token.",
        )

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    user_id = payload.get("sub")

    with db_session() as conn:
        row = conn.execute(
            "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found.",
        )

    return UserProfile(**dict(row))


def require_admin_user(
    authorization: str | None = Header(default=None),
    x_admin_code: str | None = Header(default=None),
) -> UserProfile:
    user = get_current_user(authorization)
    if user.role == "admin":
        return user
    if x_admin_code and x_admin_code.strip() == settings.ADMIN_ACCESS_CODE:
        return user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Administrator access required to manage wellness knowledge PDFs. Sign in as an admin or provide a valid admin access code.",
    )

