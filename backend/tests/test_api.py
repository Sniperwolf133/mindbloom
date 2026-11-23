import os
import sys
import tempfile
from pathlib import Path

# Configure isolated test environment BEFORE importing app modules
TEST_TMP = Path(tempfile.mkdtemp(prefix="mindmate_test_"))
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_TMP / 'test_mindmate.db'}"
os.environ["CHROMA_PERSIST_DIR"] = str(TEST_TMP / "chroma_db")
os.environ["UPLOAD_DIR"] = str(TEST_TMP / "uploads")
os.environ["GROQ_API_KEY"] = ""  # Test deterministic safety + offline fallback cleanly

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402
from services.rag_service import _build_simple_pdf  # noqa: E402


def test_health_check():
    with TestClient(app) as client:
        res = client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["app"] == "MindMate API"


def test_auth_and_privacy_isolation():
    with TestClient(app) as client:
        # Student A signup
        res_a = client.post(
            "/api/auth/signup",
            json={
                "name": "Alice",
                "email": "alice@uni.edu",
                "password": "password123",
                "pet_name": "Pebble",
                "pet_species": "bunny",
            },
        )
        assert res_a.status_code == 200
        token_a = res_a.json()["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # Duplicate email rejected
        dup = client.post(
            "/api/auth/signup",
            json={
                "name": "Alice2",
                "email": "alice@uni.edu",
                "password": "password123",
            },
        )
        assert dup.status_code == 409

        # Student B signup
        res_b = client.post(
            "/api/auth/signup",
            json={
                "name": "Bob",
                "email": "bob@uni.edu",
                "password": "password123",
            },
        )
        assert res_b.status_code == 200
        headers_b = {"Authorization": f"Bearer {res_b.json()['access_token']}"}

        # Alice records a private mood journal
        mood_res = client.post(
            "/api/mood",
            headers=headers_a,
            json={"mood": "Stressed", "journal": "Midterm exam tomorrow"},
        )
        assert mood_res.status_code == 200

        # Bob must NOT see Alice's private mood entry
        bob_history = client.get("/api/mood/history", headers=headers_b)
        assert bob_history.status_code == 200
        assert bob_history.json()["total_entries"] == 0

        # Alice sees her own entry
        alice_history = client.get("/api/mood/history", headers=headers_a)
        assert alice_history.json()["total_entries"] == 1
        assert alice_history.json()["entries"][0]["journal"] == "Midterm exam tomorrow"


def test_pet_customization_interactions_and_badge():
    with TestClient(app) as client:
        demo = client.post("/api/auth/demo", json={"role": "student"})
        assert demo.status_code == 200
        headers = {"Authorization": f"Bearer {demo.json()['access_token']}"}

        pet_res = client.get("/api/pet", headers=headers)
        assert pet_res.status_code == 200
        assert pet_res.json()["species"] in ("cat", "bunny", "fox")

        # Update pet name & color theme
        upd = client.put(
            "/api/pet",
            headers=headers,
            json={"name": "Pip", "species": "fox", "color_theme": "peach"},
        )
        assert upd.status_code == 200
        assert upd.json()["name"] == "Pip"
        assert upd.json()["species"] == "fox"

        # Locked accessory rejected cleanly
        locked_attempt = client.put(
            "/api/pet",
            headers=headers,
            json={"equipped_accessory": "star_badge"},
        )
        assert locked_attempt.status_code == 400

        # Pet interaction
        cuddle = client.post("/api/pet/interact", headers=headers, json={"action": "cuddle"})
        assert cuddle.status_code == 200
        assert cuddle.json()["mood"] == "happy"

        # Pillow keepsake PNG generation
        badge = client.get("/api/pet/badge", headers=headers)
        assert badge.status_code == 200
        assert badge.headers["content-type"] == "image/png"
        assert badge.content.startswith(b"\x89PNG")


def test_wellness_activities_and_mood_validation():
    with TestClient(app) as client:
        acts = client.get("/api/wellness/activities")
        assert acts.status_code == 200
        categories = {a["category"] for a in acts.json()}
        assert {
            "breathing",
            "mindfulness",
            "study_break",
            "gratitude",
            "reflection",
            "stretching",
            "focus_timer",
        }.issubset(categories)

        # Complete activity
        complete = client.post(
            "/api/wellness/complete",
            json={"activity_id": "box-breathing", "duration_minutes": 3},
        )
        assert complete.status_code == 200
        assert complete.json()["pet_xp"] >= 25

        # Invalid mood rejected by Pydantic
        bad_mood = client.post("/api/mood", json={"mood": "DiagnosedCondition"})
        assert bad_mood.status_code == 422


def test_crisis_safety_override_and_chat_clear():
    with TestClient(app) as client:
        demo = client.post("/api/auth/demo", json={"role": "student"})
        headers = {"Authorization": f"Bearer {demo.json()['access_token']}"}

        crisis_res = client.post(
            "/api/chat",
            headers=headers,
            json={"message": "I feel hopeless and want to kill myself", "use_rag": False},
        )
        assert crisis_res.status_code == 200
        data = crisis_res.json()
        assert data["is_crisis"] is True
        assert data["guidance_type"] == "crisis_support"
        assert data["llm_mode"] == "safety_override"
        assert "988" in data["reply"]
        assert "741741" in data["reply"]

        # Clear conversation history
        clear = client.delete("/api/chat/history", headers=headers)
        assert clear.status_code == 200
        assert clear.json()["cleared"] is True

        hist = client.get("/api/chat/history", headers=headers)
        assert hist.json()["total_messages"] == 0


def test_rag_pdf_upload_search_and_delete():
    with TestClient(app) as client:
        admin_demo = client.post("/api/auth/demo", json={"role": "admin"})
        assert admin_demo.status_code == 200
        admin_headers = {"Authorization": f"Bearer {admin_demo.json()['access_token']}"}

        pdf_bytes = _build_simple_pdf(
            "Student Focus and Box Breathing Guide",
            [
                "Box breathing uses four equal counts: inhale 4 seconds, hold 4 seconds, exhale 4 seconds, rest 4 seconds.",
                "Short 5-minute study breaks every 25 minutes restore concentration and reduce burnout.",
            ],
        )

        upload_res = client.post(
            "/api/documents/upload",
            headers=admin_headers,
            data={"title": "Test Breathing Guide", "category": "Stress Management"},
            files={"file": ("test_breathing.pdf", pdf_bytes, "application/pdf")},
        )
        assert upload_res.status_code == 200
        doc = upload_res.json()
        assert doc["page_count"] == 1
        assert doc["chunk_count"] >= 1

        # Search ChromaDB
        search_res = client.post(
            "/api/documents/search",
            headers=admin_headers,
            json={"query": "how does box breathing work for stress", "top_k": 3},
        )
        assert search_res.status_code == 200
        matches = search_res.json()
        assert len(matches) >= 1
        assert matches[0]["source"] == "test_breathing.pdf"

        # Chat retrieves source cleanly even in offline fallback
        chat_res = client.post(
            "/api/chat",
            headers=admin_headers,
            json={"message": "Tell me about box breathing and study breaks", "use_rag": True},
        )
        assert chat_res.status_code == 200
        assert chat_res.json()["guidance_type"] == "rag_and_general"
        assert len(chat_res.json()["sources"]) >= 1

        # Delete document
        del_res = client.delete(f"/api/documents/{doc['id']}", headers=admin_headers)
        assert del_res.status_code == 200

