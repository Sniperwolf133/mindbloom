import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Ensure backend/ is importable whether launched from project root or backend/
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database.database import db_session, init_db
from models.auth import UserProfile
from routes import auth, chatbot, documents, mood, pet, wellness
from services.auth_service import get_current_user
from services.embedding_service import embedding_status
from services.rag_service import list_documents


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings.ensure_directories()
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "MindMate: AI-Powered Student Wellness Companion API featuring an empathetic "
        "Groq-powered chatbot, interactive virtual pet companion, mood tracker, "
        "wellness activities, and LangChain + ChromaDB RAG knowledge base."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chatbot.router)
app.include_router(mood.router)
app.include_router(wellness.router)
app.include_router(pet.router)
app.include_router(documents.router)


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "tagline": "Take care of yourself, and your little companion grows with you.",
        "docs_url": "/docs",
        "health_url": "/api/health",
    }


@app.get("/api/health")
def health_check():
    docs = list_documents()
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "groq_configured": settings.groq_configured,
        "groq_model": settings.GROQ_MODEL,
        "embeddings": embedding_status(),
        "rag_documents_count": docs.total_documents,
        "rag_chunks_count": docs.total_chunks,
        "disclaimer": (
            "MindMate is a supportive student wellness companion and not a medical "
            "or clinical mental health service."
        ),
    }


@app.get("/api/privacy/summary")
def privacy_summary(current_user: UserProfile = Depends(get_current_user)):
    with db_session() as conn:
        mood_count = conn.execute(
            "SELECT COUNT(*) FROM mood_entries WHERE user_id = ?", (current_user.id,)
        ).fetchone()[0]
        chat_count = conn.execute(
            "SELECT COUNT(*) FROM chat_messages WHERE user_id = ?", (current_user.id,)
        ).fetchone()[0]
        wellness_count = conn.execute(
            "SELECT COUNT(*) FROM wellness_completions WHERE user_id = ?",
            (current_user.id,),
        ).fetchone()[0]

    return {
        "user_email": current_user.email,
        "stored_counts": {
            "mood_entries": mood_count,
            "chat_messages": chat_count,
            "wellness_completions": wellness_count,
        },
        "commitments": [
            "Minimal data collection: only your account name, email, pet settings, and wellness logs you choose to save.",
            "Private isolation: your journal entries and chats are never visible to other students.",
            "Full control: you can clear chat history, clear mood history, or delete all personal activity data at any time.",
            "Non-clinical tool: MindMate never diagnoses conditions, prescribes treatment, or replaces professional care.",
        ],
    }


@app.delete("/api/privacy/delete-my-data")
def delete_all_personal_wellness_data(
    current_user: UserProfile = Depends(get_current_user),
):
    with db_session() as conn:
        moods = conn.execute(
            "DELETE FROM mood_entries WHERE user_id = ?", (current_user.id,)
        ).rowcount
        chats = conn.execute(
            "DELETE FROM chat_messages WHERE user_id = ?", (current_user.id,)
        ).rowcount
        activities = conn.execute(
            "DELETE FROM wellness_completions WHERE user_id = ?", (current_user.id,)
        ).rowcount

    return {
        "deleted": True,
        "removed_mood_entries": moods,
        "removed_chat_messages": chats,
        "removed_wellness_completions": activities,
    }

