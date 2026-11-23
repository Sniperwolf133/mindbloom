import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Generator

from config import settings


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(settings.DATABASE_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


@contextmanager
def db_session() -> Generator[sqlite3.Connection, None, None]:
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    settings.ensure_directories()
    with db_session() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'student',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS pets (
                user_id TEXT PRIMARY KEY,
                name TEXT NOT NULL DEFAULT 'Mochi',
                species TEXT NOT NULL DEFAULT 'cat',
                color_theme TEXT NOT NULL DEFAULT 'lavender',
                mood TEXT NOT NULL DEFAULT 'calm',
                happiness INTEGER NOT NULL DEFAULT 75,
                energy INTEGER NOT NULL DEFAULT 80,
                affection INTEGER NOT NULL DEFAULT 25,
                xp INTEGER NOT NULL DEFAULT 0,
                stage INTEGER NOT NULL DEFAULT 1,
                equipped_accessory TEXT NOT NULL DEFAULT 'sprout',
                unlocked_accessories TEXT NOT NULL DEFAULT '["none","sprout","scarf"]',
                last_reaction TEXT NOT NULL DEFAULT 'Ready to spend a cozy, gentle day with you!',
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS mood_entries (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                mood TEXT NOT NULL,
                journal TEXT,
                suggestion TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_mood_user_created
            ON mood_entries (user_id, created_at DESC);

            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                sources_json TEXT,
                guidance_type TEXT DEFAULT 'general_only',
                is_crisis INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_chat_user_created
            ON chat_messages (user_id, created_at ASC);

            CREATE TABLE IF NOT EXISTS wellness_completions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                activity_id TEXT NOT NULL,
                activity_title TEXT NOT NULL,
                category TEXT NOT NULL,
                duration_minutes INTEGER NOT NULL DEFAULT 5,
                reflection_note TEXT,
                completed_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_wellness_user_completed
            ON wellness_completions (user_id, completed_at DESC);

            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                original_name TEXT NOT NULL,
                title TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'General Wellness',
                page_count INTEGER NOT NULL DEFAULT 0,
                chunk_count INTEGER NOT NULL DEFAULT 0,
                file_size INTEGER NOT NULL DEFAULT 0,
                uploaded_by TEXT,
                uploaded_at TEXT NOT NULL
            );
            """
        )

        # Ensure guest sandbox user exists for unauthenticated API calls / quick preview
        now = utc_now_iso()
        conn.execute(
            """
            INSERT OR IGNORE INTO users (id, name, email, password_hash, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            ("guest-student", "Cozy Student", "guest@mindmate.local", "guest-no-login", "student", now),
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
                "guest-student",
                "Mochi",
                "cat",
                "lavender",
                "calm",
                78,
                82,
                30,
                20,
                1,
                "sprout",
                json.dumps(["none", "sprout", "scarf"]),
                "Mochi is curled up warmly, glad you stopped by!",
                now,
            ),
        )

