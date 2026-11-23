import json
import re
import uuid

from groq import Groq

from config import settings
from database.database import db_session, utc_now_iso
from models.chat import (
    ChatHistoryResponse,
    ChatMessageRecord,
    ChatRequest,
    ChatResponse,
    RetrievedSource,
)
from services.pet_service import get_pet
from services.rag_service import retrieve_relevant_context
from services.wellness_service import get_activity_by_id

# ── Deterministic crisis & self-harm safety patterns ─────────────────────────
# These run BEFORE any LLM call and are never overridden by model output.
CRISIS_PATTERNS = [
    r"\bsuicid(e|al)\b",
    r"\bkill\s+my\s*self\b",
    r"\bend\s+(my|this)\s+life\b",
    r"\bwant\s+to\s+die\b",
    r"\bdon'?t\s+want\s+to\s+(be\s+here|live|wake\s+up)\b",
    r"\bhurt\s+my\s*self\b",
    r"\bself[\s-]*harm\b",
    r"\bcutting\s+my\s*self\b",
    r"\btake\s+my\s+own\s+life\b",
    r"\bno\s+reason\s+to\s+live\b",
    r"\bbetter\s+off\s+dead\b",
    r"\bimmediate\s+danger\b",
    r"\boverdos(e|ing)\b",
]
CRISIS_REGEX = re.compile("|".join(CRISIS_PATTERNS), re.IGNORECASE)

CRISIS_RESPONSE_TEMPLATE = (
    "I'm really glad you reached out, and I care about your safety. "
    "It sounds like you are carrying something deeply painful right now, and you don't have to carry it alone.\n\n"
    "Because your safety matters most, please connect right away with people trained to support you through this:\n\n"
    "- **988 Suicide & Crisis Lifeline (US & Canada):** Call or text **988** (free, confidential, 24/7)\n"
    "- **Crisis Text Line:** Text **HOME** to **741741** to connect with a crisis counselor\n"
    "- **International Helplines:** Visit **findahelpline.com** for free, confidential support in your country\n"
    "- **Immediate Danger:** Please call your local emergency number (**911**, **112**, or **999**) or go to the nearest emergency room\n"
    "- **Someone You Trust:** Reach out right now to a close friend, family member, resident advisor, or your campus counseling center\n\n"
    "Please take a gentle pause and contact one of these resources or someone beside you right now. Help is available."
)


def detect_crisis_intent(text: str) -> bool:
    return bool(CRISIS_REGEX.search(text))


def _suggest_activity_for_message(message: str) -> tuple[str | None, str | None]:
    lowered = message.lower()
    if any(k in lowered for k in ["exam", "panic", "anxious", "nervous", "breath", "heart racing"]):
        act = get_activity_by_id("box-breathing")
    elif any(k in lowered for k in ["overwhelm", "too much", "spiral", "ground", "stressed"]):
        act = get_activity_by_id("grounding-54321")
    elif any(k in lowered for k in ["tired", "exhausted", "burnout", "studying for hours", "screen", "break"]):
        act = get_activity_by_id("study-break-reset")
    elif any(k in lowered for k in ["neck", "shoulder", "back", "stiff", "posture", "stretch"]):
        act = get_activity_by_id("desk-stretch")
    elif any(k in lowered for k in ["focus", "procrastinat", "concentrate", "assignment"]):
        act = get_activity_by_id("cozy-pomodoro")
    elif any(k in lowered for k in ["sleep", "insomnia", "night", "wind down"]):
        act = get_activity_by_id("478-breathing")
    elif any(k in lowered for k in ["lonely", "sad", "down", "miss home", "gratitude"]):
        act = get_activity_by_id("gratitude-spark")
    else:
        return None, None
    return (act.id, act.title) if act else (None, None)


def _get_recent_history(user_id: str, limit: int = 12) -> list[dict]:
    """Return recent non-crisis messages as plain dicts for the Groq SDK."""
    with db_session() as conn:
        rows = conn.execute(
            """
            SELECT role, content
            FROM chat_messages
            WHERE user_id = ? AND is_crisis = 0
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (user_id, limit),
        ).fetchall()

    # Reverse so oldest first; map 'assistant' role correctly
    messages = []
    for row in reversed(rows):
        role = row["role"] if row["role"] in ("user", "assistant", "system") else "user"
        messages.append({"role": role, "content": row["content"]})
    return messages


def _save_message(
    user_id: str,
    role: str,
    content: str,
    guidance_type: str = "general_only",
    is_crisis: bool = False,
    sources: list[RetrievedSource] | None = None,
) -> tuple[str, str]:
    msg_id = str(uuid.uuid4())
    now = utc_now_iso()
    sources_json = json.dumps([s.model_dump() for s in (sources or [])])
    with db_session() as conn:
        conn.execute(
            """
            INSERT INTO chat_messages (id, user_id, role, content, sources_json, guidance_type, is_crisis, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (msg_id, user_id, role, content, sources_json, guidance_type, 1 if is_crisis else 0, now),
        )
    return msg_id, now


def get_chat_history(user_id: str) -> ChatHistoryResponse:
    with db_session() as conn:
        rows = conn.execute(
            """
            SELECT id, role, content, sources_json, guidance_type, is_crisis, created_at
            FROM chat_messages
            WHERE user_id = ?
            ORDER BY created_at ASC
            """,
            (user_id,),
        ).fetchall()

    records: list[ChatMessageRecord] = []
    for row in rows:
        raw_sources = json.loads(row["sources_json"] or "[]")
        records.append(
            ChatMessageRecord(
                id=row["id"],
                role=row["role"],
                content=row["content"],
                guidance_type=row["guidance_type"] or "general_only",
                is_crisis=bool(row["is_crisis"]),
                sources=[RetrievedSource(**s) for s in raw_sources],
                created_at=row["created_at"],
            )
        )

    return ChatHistoryResponse(messages=records, total_messages=len(records))


def clear_chat_history(user_id: str) -> dict:
    with db_session() as conn:
        cursor = conn.execute(
            "DELETE FROM chat_messages WHERE user_id = ?",
            (user_id,),
        )
    return {"cleared": True, "deleted_count": cursor.rowcount}


def _build_rag_context_block(sources: list[RetrievedSource]) -> str:
    if not sources:
        return (
            "No specific uploaded wellness documents matched this query. "
            "Provide general, warm student wellness companion guidance without citing any document names."
        )

    blocks = []
    for idx, src in enumerate(sources, start=1):
        page_str = f", Page {src.page}" if src.page else ""
        blocks.append(
            f"[Document {idx}: {src.source} (Title: {src.title}{page_str})]\n{src.excerpt}"
        )
    return "\n\n".join(blocks)


def _offline_fallback_reply(
    message: str,
    pet_name: str,
    sources: list[RetrievedSource],
    reason: str,
) -> str:
    lines = [
        f"Hi friend — {pet_name} and I are sitting quietly with you.",
        "",
        f"*(Note: Live Groq AI generation is currently unavailable because {reason}. "
        "Add a valid `GROQ_API_KEY` in `backend/.env` and restart the backend for full conversational AI responses.)*",
        "",
        "**General Companion Support:**",
        "Whatever is on your plate right now—whether exams, deadlines, loneliness, or study fatigue—you don't have to solve everything at once. "
        "Try taking 3 slow breaths with a slightly longer exhale, sip some water, and pick just one gentle next step (or give yourself permission to rest).",
    ]
    if sources:
        lines.append("")
        lines.append("**From Your Uploaded Wellness Guides:**")
        for src in sources[:2]:
            page_info = f" (p. {src.page})" if src.page else ""
            snippet = src.excerpt[:260].rstrip()
            if len(src.excerpt) > 260:
                snippet += "..."
            lines.append(f"- **{src.source}{page_info}:** {snippet}")
    return "\n".join(lines)


def _call_groq(system_prompt: str, history: list[dict], user_message: str) -> str:
    """
    Call Groq using the native SDK with:
      - model : openai/gpt-oss-120b  (or whatever GROQ_MODEL is set to)
      - reasoning_effort : medium
      - streaming        : True
    Collects the full streamed response and returns it as a string.
    """
    client = Groq(api_key=settings.GROQ_API_KEY)

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    # Build kwargs — reasoning_effort is only valid for reasoning-capable models
    extra: dict = {}
    if settings.GROQ_REASONING_EFFORT and settings.GROQ_REASONING_EFFORT != "none":
        extra["reasoning_effort"] = settings.GROQ_REASONING_EFFORT

    stream = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=messages,
        temperature=1,
        max_completion_tokens=settings.GROQ_MAX_TOKENS,
        top_p=1,
        stream=True,
        stop=None,
        **extra,
    )

    # Collect streamed chunks into a single string
    reply_parts: list[str] = []
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            reply_parts.append(delta)

    return "".join(reply_parts).strip()


def process_chat_message(user_id: str, user_name: str, payload: ChatRequest) -> ChatResponse:
    pet = get_pet(user_id)
    suggested_id, suggested_title = _suggest_activity_for_message(payload.message)

    # ── 1. Safety-first deterministic crisis check BEFORE any LLM call ───────
    if detect_crisis_intent(payload.message):
        _save_message(user_id, "user", payload.message, "crisis_support", is_crisis=True)
        msg_id, created_at = _save_message(
            user_id,
            "assistant",
            CRISIS_RESPONSE_TEMPLATE,
            guidance_type="crisis_support",
            is_crisis=True,
            sources=[],
        )
        return ChatResponse(
            id=msg_id,
            reply=CRISIS_RESPONSE_TEMPLATE,
            guidance_type="crisis_support",
            is_crisis=True,
            sources=[],
            suggested_activity_id=None,
            suggested_activity_title=None,
            llm_mode="safety_override",
            created_at=created_at,
        )

    # ── 2. Fetch conversation history BEFORE saving new turn ─────────────────
    history = _get_recent_history(user_id, limit=12)

    # ── 3. RAG context retrieval ──────────────────────────────────────────────
    sources: list[RetrievedSource] = []
    if payload.use_rag:
        sources = retrieve_relevant_context(payload.message, top_k=4)

    guidance_type = "rag_and_general" if sources else "general_only"
    rag_context_text = _build_rag_context_block(sources)

    # ── 4. Save user message ──────────────────────────────────────────────────
    _save_message(user_id, "user", payload.message, guidance_type, is_crisis=False)

    # ── 5. Offline fallback if no key ─────────────────────────────────────────
    if not settings.groq_configured:
        reply_text = _offline_fallback_reply(
            payload.message,
            pet.name,
            sources,
            "GROQ_API_KEY is not configured yet",
        )
        msg_id, created_at = _save_message(
            user_id,
            "assistant",
            reply_text,
            guidance_type=guidance_type,
            is_crisis=False,
            sources=sources,
        )
        return ChatResponse(
            id=msg_id,
            reply=reply_text,
            guidance_type=guidance_type,
            is_crisis=False,
            sources=sources,
            suggested_activity_id=suggested_id,
            suggested_activity_title=suggested_title,
            llm_mode="offline_fallback",
            created_at=created_at,
        )

    # ── 6. Build system prompt ────────────────────────────────────────────────
    system_prompt = (
        "You are MindMate, a warm, empathetic, non-judgmental AI student wellness companion. "
        f"You are speaking with a college student named {user_name}, whose virtual pet companion is "
        f"{pet.name} (a {pet.species}, currently feeling {pet.mood}).\n\n"
        "PERSONALITY & TONE:\n"
        "- Be genuinely comforting, approachable, conversational, and encouraging—never robotic, preachy, or overly clinical.\n"
        "- Help with academic stress, exam pressure, study burnout, motivation, friendships, loneliness, and everyday college life.\n"
        "- Offer simple, practical steps (e.g., short breathing pauses, 5-4-3-2-1 grounding, gentle study breaks, stretching, or small micro-steps).\n"
        "- Avoid guilt-tripping or toxic positivity; validate feelings warmly first.\n\n"
        "STRICT BOUNDARIES & SAFETY:\n"
        "- You are a supportive digital companion, NOT a therapist, doctor, or medical service.\n"
        "- NEVER diagnose any mental health condition, NEVER prescribe or recommend medications, and NEVER replace professional care.\n"
        "- If the user mentions severe distress, self-harm, or feeling unsafe, respond gently and urge contacting "
        "988 (US/Canada), Crisis Text Line (text HOME to 741741), emergency services, or a trusted campus counselor.\n\n"
        "KNOWLEDGE BASE & TRANSPARENCY RULES:\n"
        "- ONLY mention or cite document filenames that explicitly appear in the retrieved context below. "
        "NEVER invent, guess, or fabricate citations or PDF titles.\n"
        "- When retrieved knowledge base context is present and relevant, clearly distinguish what comes from "
        "the retrieved guide(s) versus your general companion encouragement.\n"
        "- Keep responses well-structured, concise (2–4 warm short paragraphs or a brief bullet list), "
        "and easy to read for a tired student.\n\n"
        "RETRIEVED WELLNESS KNOWLEDGE BASE CONTEXT:\n"
        f"{rag_context_text}"
    )

    # ── 7. Call Groq (native SDK, streaming, reasoning_effort) ───────────────
    try:
        reply_text = _call_groq(system_prompt, history, payload.message)
        llm_mode = "groq"
    except Exception as exc:
        reply_text = _offline_fallback_reply(
            payload.message,
            pet.name,
            sources,
            f"the Groq request encountered an error ({exc.__class__.__name__}: {exc})",
        )
        llm_mode = "offline_fallback"

    # ── 8. Save and return ────────────────────────────────────────────────────
    msg_id, created_at = _save_message(
        user_id,
        "assistant",
        reply_text,
        guidance_type=guidance_type,
        is_crisis=False,
        sources=sources,
    )

    return ChatResponse(
        id=msg_id,
        reply=reply_text,
        guidance_type=guidance_type,
        is_crisis=False,
        sources=sources,
        suggested_activity_id=suggested_id,
        suggested_activity_title=suggested_title,
        llm_mode=llm_mode,
        created_at=created_at,
    )
