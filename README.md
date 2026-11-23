# MindMate — AI-Powered Student Wellness App with an Interactive Pet Companion

> **"Take care of yourself, and your little companion grows with you."**

MindMate is a warm, non-clinical digital wellness space designed to help college students manage everyday academic stress, exam anxiety, loneliness, and study burnout through an empathetic AI companion, a customizable growing virtual pet, gentle mood tracking, guided wellness activities, and a RAG-powered wellness knowledge base.

---

## Key Features

- **Empathetic AI Wellness Chatbot (`/chat`)**
  - Powered by **Groq** (`ChatGroq` via LangChain) with conversation context persisted per user in SQLite.
  - Safety-first deterministic crisis detection (`safety_override`) that immediately provides **988**, **Crisis Text Line (741741)**, and international helpline resources without relying solely on AI output.
  - Non-diagnostic, non-clinical personality with clear distinction between **Retrieved Wellness Guide Citations** and **General Companion Guidance**.
  - One-click conversation clearing.

- **Interactive Virtual Pet Companion (`/pet` & `/dashboard`)**
  - Choose and name your animated SVG **Cat**, **Bunny**, or **Fox** in 4 pastel color themes (`lavender`, `mint`, `peach`, `sky`).
  - Dynamic mood animations (`happy`, `calm`, `excited`, `sleepy`, `sad`) reacting to mood check-ins, breathing exercises, study breaks, and direct care actions (*Cuddle*, *Snack*, *Nap*, *Cheer*).
  - Non-punitive growth system (*Tiny Sprout* → *Cozy Companion* → *Radiant Guardian*) with 8 unlockable accessories and downloadable **Pillow PNG Keepsake Cards**.

- **Daily Mood Tracking (`/mood`)**
  - Check in with 6 moods (`Happy`, `Calm`, `Okay`, `Stressed`, `Sad`, `Overwhelmed`) + private journal notes.
  - Interactive SVG **Mood Trend Chart**, mood distribution breakdown, and tailored gentle wellness suggestions.
  - Strict per-user isolation and delete/clear privacy controls.

- **Guided Wellness Activities (`/activities`)**
  - Covers all 7 categories: **Guided Breathing** (animated Box Breathing & 4-7-8 Breathing orbs), **Short Mindfulness** (5-4-3-2-1 Grounding), **Study-Break Reminders**, **Gratitude Journaling**, **Daily Reflection**, **Simple Stretching**, and **Focus & Relaxation Timers**.

- **RAG Wellness Knowledge Base (`/admin/documents`)**
  - Admins can upload wellness PDF guides (or load 3 built-in starter guides).
  - Extracts text via `pypdf`, splits chunks with `langchain-text-splitters`, generates embeddings using **Hugging Face Sentence Transformers** (`all-MiniLM-L6-v2`), and persists vectors locally in **ChromaDB**.

---

## Project Architecture

```text
mindbloom/
├── .env.example
├── .gitignore
├── README.md
├── backend/
│   ├── main.py                  # FastAPI entrypoint, CORS, health & privacy routes
│   ├── config.py                # Environment & directory configuration
│   ├── requirements.txt         # Python dependencies
│   ├── database/
│   │   └── database.py          # SQLite schema & session manager
│   ├── models/                  # Pydantic v2 validation schemas
│   │   ├── auth.py
│   │   ├── chat.py
│   │   ├── document.py
│   │   ├── mood.py
│   │   ├── pet.py
│   │   └── wellness.py
│   ├── routes/                  # Modular REST API routers
│   │   ├── auth.py
│   │   ├── chatbot.py
│   │   ├── documents.py
│   │   ├── mood.py
│   │   ├── pet.py
│   │   └── wellness.py
│   ├── services/                # Business logic, RAG, LangChain & Pet mechanics
│   │   ├── auth_service.py
│   │   ├── chatbot_service.py
│   │   ├── embedding_service.py
│   │   ├── pet_service.py
│   │   ├── rag_service.py
│   │   └── wellness_service.py
│   ├── tests/
│   │   └── test_api.py          # End-to-end API & RAG test suite
│   ├── uploads/                 # Stored wellness PDFs
│   ├── sample_docs/             # Generated starter PDF guides
│   └── chroma_db/               # Persistent local ChromaDB vector store
└── frontend/
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── vite.config.js           # Proxies /api/* to FastAPI on port 8000
    └── src/
        ├── api/client.js        # Fetch client with Bearer token handling
        ├── context/AuthContext.jsx
        ├── components/
        │   ├── Layout.jsx
        │   ├── MoodTrendChart.jsx
        │   ├── PetAvatar.jsx    # Animated pastel SVG companion
        │   └── PrivacyModal.jsx
        └── pages/
            ├── LandingPage.jsx
            ├── AuthPage.jsx
            ├── DashboardPage.jsx
            ├── ChatPage.jsx
            ├── MoodPage.jsx
            ├── ActivitiesPage.jsx
            ├── PetPage.jsx
            └── AdminDocsPage.jsx
```

---

## Setup & Installation

### 1. Environment Variables

Copy `.env.example` into `backend/.env` and add your keys:

```bash
cp .env.example backend/.env
```

Edit `backend/.env`:

```env
GROQ_API_KEY=your_actual_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
HUGGINGFACEHUB_API_TOKEN=your_huggingface_token_optional
APP_SECRET_KEY=replace-with-a-long-random-secret
ADMIN_ACCESS_CODE=mindmate-admin
```

> **Note:** Keep `.env` out of Git! The chatbot works cleanly with live Groq responses once `GROQ_API_KEY` is configured, and falls back gracefully with a clear notice if the key is not set yet.

### 2. Backend Setup (Python)

From the project root:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

- **Windows (PowerShell):**
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- **macOS / Linux:**
  ```bash
  source .venv/bin/activate
  ```

Install dependencies and run the FastAPI server:

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Interactive API documentation is automatically available at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

### 3. Frontend Setup (React + Vite)

Open a new terminal in `frontend/`:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Running Backend Tests

From the `backend/` folder (with `.venv` activated):

```bash
pytest tests/test_api.py -v
```

---

## REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Service status, Groq configuration & RAG document counts |
| `/api/auth/signup` | `POST` | Register a student (or admin with `admin_code`) and create initial pet |
| `/api/auth/login` | `POST` | Authenticate and obtain a Bearer token |
| `/api/auth/demo` | `POST` | Instant prototype login (`role: "student"` or `"admin"`) |
| `/api/auth/me` | `GET` | Fetch current authenticated profile |
| `/api/chat` | `POST` | Send message to MindMate AI companion (with safety check + optional RAG) |
| `/api/chat/history` | `GET` | Retrieve user conversation history |
| `/api/chat/history` | `DELETE` | Clear user conversation history |
| `/api/mood` | `POST` | Record mood check-in + optional private journal & update pet |
| `/api/mood/history` | `GET` | Retrieve mood history, trend points, and distribution |
| `/api/mood/{entry_id}` | `DELETE` | Delete a single mood entry |
| `/api/mood/history` | `DELETE` | Clear all mood history for the user |
| `/api/wellness/activities` | `GET` | List guided wellness activities across 7 categories |
| `/api/wellness/complete` | `POST` | Log activity completion, boost pet & unlock accessories |
| `/api/wellness/progress` | `GET` | Retrieve gentle wellness completion progress |
| `/api/pet` | `GET` | Get virtual pet stats, mood, growth stage & accessories |
| `/api/pet` | `PUT` | Customize pet name, species, color theme, or equipped accessory |
| `/api/pet/interact` | `POST` | Pet care actions (`cuddle`, `snack`, `nap`, `cheer`) |
| `/api/pet/badge` | `GET` | Download a Pillow-rendered PNG companion keepsake card |
| `/api/documents` | `GET` | List indexed wellness PDF guides |
| `/api/documents/upload` | `POST` | Admin PDF upload → `pypdf` → chunking → ChromaDB |
| `/api/documents/seed` | `POST` | Admin one-click seeding of 3 starter student wellness PDF guides |
| `/api/documents/search` | `POST` | Test semantic similarity search against ChromaDB |
| `/api/documents/{doc_id}` | `DELETE` | Remove PDF document and its ChromaDB chunks |
| `/api/privacy/summary` | `GET` | View stored counts and privacy commitments |
| `/api/privacy/delete-my-data` | `DELETE` | Delete all user moods, chats, and activity logs |

---

## Privacy & Safety Disclaimer

MindMate is built for everyday student stress reflection and supportive encouragement. It **does not** diagnose mental health conditions, prescribe medications, or replace licensed counseling or emergency services. If you or someone you know is in immediate distress, please call or text **988** (US & Canada), text **HOME to 741741**, or contact your local emergency services or campus counseling center.

