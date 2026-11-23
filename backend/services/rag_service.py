import re
import uuid
from pathlib import Path
import chromadb
from fastapi import HTTPException, UploadFile, status
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

from config import settings
from database.database import db_session, utc_now_iso
from models.chat import RetrievedSource
from models.document import DocumentListResponse, DocumentResponse
from services.embedding_service import get_embedding_model

COLLECTION_NAME = "mindmate_wellness_docs"

_vectorstore_instance: Chroma | None = None
_chroma_client: chromadb.PersistentClient | None = None


def _get_chroma_client() -> chromadb.PersistentClient:
    global _chroma_client
    if _chroma_client is None:
        settings.ensure_directories()
        _chroma_client = chromadb.PersistentClient(path=str(settings.CHROMA_PERSIST_DIR))
    return _chroma_client


def get_vectorstore() -> Chroma:
    global _vectorstore_instance
    if _vectorstore_instance is None:
        client = _get_chroma_client()
        embeddings = get_embedding_model()
        _vectorstore_instance = Chroma(
            client=client,
            collection_name=COLLECTION_NAME,
            embedding_function=embeddings,
            collection_metadata={"hnsw:space": "cosine"},
        )
    return _vectorstore_instance


def _sanitize_filename(name: str) -> str:
    base = Path(name).name
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", base).strip("._")
    if not cleaned.lower().endswith(".pdf"):
        cleaned = f"{cleaned or 'wellness_guide'}.pdf"
    return cleaned


def _extract_pdf_pages(pdf_path: Path) -> list[tuple[int, str]]:
    reader = PdfReader(str(pdf_path))
    pages: list[tuple[int, str]] = []
    for idx, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        # Normalize excessive whitespace while preserving paragraph flow
        text = re.sub(r"\n{3,}", "\n\n", text)
        if text:
            pages.append((idx, text))
    return pages


def ingest_pdf_path(
    pdf_path: Path,
    original_name: str,
    title: str | None = None,
    category: str = "General Wellness",
    uploaded_by: str | None = None,
) -> DocumentResponse:
    pages = _extract_pdf_path_pages(pdf_path)
    if not pages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable text was found inside this PDF. Please upload a text-based PDF (not a scanned image).",
        )

    doc_id = str(uuid.uuid4())
    clean_title = (title or Path(original_name).stem.replace("_", " ").replace("-", " ")).strip()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=750,
        chunk_overlap=120,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks: list[Document] = []
    for page_num, page_text in pages:
        splits = splitter.split_text(page_text)
        for chunk_idx, chunk_text in enumerate(splits):
            if not chunk_text.strip():
                continue
            chunks.append(
                Document(
                    page_content=chunk_text.strip(),
                    metadata={
                        "doc_id": doc_id,
                        "source": original_name,
                        "title": clean_title,
                        "category": category,
                        "page": page_num,
                        "chunk_index": chunk_idx,
                    },
                )
            )

    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract usable text chunks from this PDF.",
        )

    try:
        vectorstore = get_vectorstore()
        chunk_ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
        vectorstore.add_documents(documents=chunks, ids=chunk_ids)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to embed and index document into ChromaDB: {exc}",
        ) from exc

    now = utc_now_iso()
    file_size = pdf_path.stat().st_size if pdf_path.exists() else 0
    stored_filename = pdf_path.name

    with db_session() as conn:
        conn.execute(
            """
            INSERT INTO documents (
                id, filename, original_name, title, category,
                page_count, chunk_count, file_size, uploaded_by, uploaded_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                doc_id,
                stored_filename,
                original_name,
                clean_title,
                category,
                len(pages),
                len(chunks),
                file_size,
                uploaded_by,
                now,
            ),
        )

    return DocumentResponse(
        id=doc_id,
        filename=stored_filename,
        original_name=original_name,
        title=clean_title,
        category=category,
        page_count=len(pages),
        chunk_count=len(chunks),
        file_size=file_size,
        uploaded_by=uploaded_by,
        uploaded_at=now,
    )


def _extract_pdf_path_pages(pdf_path: Path) -> list[tuple[int, str]]:
    return _extract_pdf_pages(pdf_path)


async def upload_and_index_pdf(
    file: UploadFile,
    title: str | None = None,
    category: str = "General Wellness",
    uploaded_by: str | None = None,
) -> DocumentResponse:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF (.pdf) documents are supported for the wellness knowledge base.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded PDF file is empty.",
        )
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF file exceeds the 15 MB prototype limit.",
        )

    safe_name = _sanitize_filename(file.filename)
    stored_name = f"{uuid.uuid4().hex[:8]}_{safe_name}"
    dest_path = settings.UPLOAD_DIR / stored_name
    dest_path.write_bytes(content)

    try:
        return ingest_pdf_path(
            pdf_path=dest_path,
            original_name=Path(file.filename).name,
            title=title,
            category=category,
            uploaded_by=uploaded_by,
        )
    except Exception:
        if dest_path.exists():
            dest_path.unlink(missing_ok=True)
        raise


def list_documents() -> DocumentListResponse:
    with db_session() as conn:
        rows = conn.execute(
            "SELECT * FROM documents ORDER BY uploaded_at DESC"
        ).fetchall()

    docs = [DocumentResponse(**dict(row)) for row in rows]
    total_chunks = sum(d.chunk_count for d in docs)
    return DocumentListResponse(
        documents=docs,
        total_documents=len(docs),
        total_chunks=total_chunks,
    )


def delete_document(doc_id: str) -> dict:
    with db_session() as conn:
        row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )
        stored_filename = row["filename"]
        conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))

    # Remove chunks from ChromaDB
    try:
        client = _get_chroma_client()
        collection = client.get_or_create_collection(COLLECTION_NAME)
        collection.delete(where={"doc_id": doc_id})
    except Exception:
        pass

    # Remove uploaded PDF file if present
    file_path = settings.UPLOAD_DIR / stored_filename
    if file_path.exists():
        file_path.unlink(missing_ok=True)

    return {"deleted": True, "id": doc_id}


def retrieve_relevant_context(
    query: str,
    top_k: int = 4,
    min_similarity: float = 0.24,
) -> list[RetrievedSource]:
    """Retrieve matching chunks from ChromaDB without fabricating results."""
    with db_session() as conn:
        doc_count = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]

    if doc_count == 0:
        return []

    try:
        vectorstore = get_vectorstore()
        results = vectorstore.similarity_search_with_score(query, k=top_k)
    except Exception:
        return []

    sources: list[RetrievedSource] = []
    seen_keys: set[tuple] = set()

    for doc, distance in results:
        # Cosine distance in [0, 2]; similarity = 1 - distance
        similarity = round(max(0.0, 1.0 - float(distance)), 4)
        if similarity < min_similarity:
            continue

        meta = doc.metadata or {}
        source_name = str(meta.get("source", "Wellness Document"))
        title = str(meta.get("title", source_name))
        page = meta.get("page")
        doc_id = meta.get("doc_id")
        excerpt = doc.page_content.strip()

        dedup_key = (source_name, page, excerpt[:80])
        if dedup_key in seen_keys:
            continue
        seen_keys.add(dedup_key)

        sources.append(
            RetrievedSource(
                doc_id=str(doc_id) if doc_id else None,
                source=source_name,
                title=title,
                page=int(page) if page is not None else None,
                excerpt=excerpt,
                score=similarity,
            )
        )

    return sources


# --- Minimal valid PDF builder for starter wellness guides ---

def _escape_pdf_text(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _build_simple_pdf(title: str, lines: list[str]) -> bytes:
    """Create a genuine, standards-compliant multi-line single-page PDF."""
    content_ops = ["BT", "/F1 15 Tf", "54 750 Td", f"({_escape_pdf_text(title)}) Tj", "/F1 10.5 Tf", "0 -26 Td"]
    y_cursor = 724
    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            content_ops.append("0 -10 Td")
            y_cursor -= 10
            continue
        # Wrap long lines cleanly around 82 chars
        words = line.split()
        current = ""
        wrapped: list[str] = []
        for w in words:
            if len(current) + len(w) + 1 <= 84:
                current = f"{current} {w}".strip()
            else:
                wrapped.append(current)
                current = w
        if current:
            wrapped.append(current)
        for seg in wrapped:
            if y_cursor < 60:
                break
            content_ops.append(f"({_escape_pdf_text(seg)}) Tj")
            content_ops.append("0 -14 Td")
            y_cursor -= 14
    content_ops.append("ET")
    stream_data = "\n".join(content_ops).encode("latin-1", errors="replace")

    objects = [
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
        b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
        f"5 0 obj\n<< /Length {len(stream_data)} >>\nstream\n".encode("ascii")
        + stream_data
        + b"\nendstream\nendobj\n",
    ]

    header = b"%PDF-1.4\n"
    body = bytearray()
    offsets = [0]
    current_offset = len(header)
    for obj in objects:
        offsets.append(current_offset)
        body.extend(obj)
        current_offset += len(obj)

    xref_pos = len(header) + len(body)
    xref_lines = [f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"]
    for off in offsets[1:]:
        xref_lines.append(f"{off:010d} 00000 n \n")

    trailer = (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_pos}\n%%EOF\n"
    )
    return header + bytes(body) + "".join(xref_lines).encode("ascii") + trailer.encode("ascii")


STARTER_GUIDES = [
    {
        "filename": "Student_Exam_Stress_and_Grounding_Guide.pdf",
        "title": "Student Exam Stress and Grounding Guide",
        "category": "Stress Management",
        "lines": [
            "University Student Wellness Series - Practical Academic Calm",
            "",
            "1. Recognizing Academic Overwhelm Early",
            "During midterms and finals, your brain treats looming deadlines like urgent threats. Tight shoulders, brain fog, irritability, and procrastination are often signs of overload rather than laziness.",
            "",
            "2. The 4-4-4-4 Box Breathing Reset",
            "Before opening notes or sitting an exam, try four rounds of Box Breathing: inhale gently for 4 seconds, hold for 4 seconds, exhale slowly for 4 seconds, and pause empty for 4 seconds. Longer, steady exhales activate the parasympathetic calming response.",
            "",
            "3. Micro-Chunking Impossible Tasks",
            "When an assignment feels huge, shrink the goal to the smallest visible action: open the document, write three rough bullet points, or study one concept for 15 minutes. Momentum follows gentle starts.",
            "",
            "4. 5-4-3-2-1 Sensory Grounding",
            "If test anxiety spikes, anchor to your room: name 5 things you see, 4 textures you feel, 3 sounds you hear, 2 scents, and 1 kind reminder to yourself.",
        ],
    },
    {
        "filename": "Healthy_Study_Breaks_and_Burnout_Prevention.pdf",
        "title": "Healthy Study Breaks and Burnout Prevention",
        "category": "Study-Life Balance",
        "lines": [
            "Campus Study-Life Balance Resource",
            "",
            "1. Why Rest Improves Memory Retention",
            "Cramming for hours without breaks lowers recall efficiency. Short 5-to-10 minute breaks after 25-to-45 minutes of focused study allow the brain to consolidate new concepts and restore attention.",
            "",
            "2. Screen-Free Break Ideas for Students",
            "Follow the 20-20-20 eye rule: every 20 minutes, look 20 feet away for 20 seconds. Stand up, drink water, stretch your neck and wrists, step near natural daylight, or talk briefly with a friend.",
            "",
            "3. Preventing Study Burnout",
            "Protect non-negotiable basics during busy weeks: regular meals, hydration, gentle movement, and consistent wind-down sleep routines. Your worth as a person is never measured by a single grade.",
            "",
            "4. Reaching Out When Things Feel Heavy",
            "Connecting with campus study groups, trusted friends, academic advisors, or university counseling centers makes heavy semesters feel far lighter.",
        ],
    },
    {
        "filename": "Mindful_Sleep_Loneliness_and_Emotional_Care.pdf",
        "title": "Mindful Sleep, Loneliness, and Emotional Care",
        "category": "Emotional Well-Being",
        "lines": [
            "Everyday Emotional Well-Being Guide for College Students",
            "",
            "1. Navigating Loneliness on Campus",
            "Feeling lonely even on a crowded campus is very common during transitions, heavy coursework, or living away from family. Small low-pressure touchpoints—studying in a shared lounge, joining a hobby club, or texting a friend—help rebuild warmth gradually.",
            "",
            "2. Gentle Evening Wind-Down for Better Sleep",
            "Give yourself a 20-minute buffer between studying and sleep. Dim bright screens, write tomorrow's top two priorities on paper so your mind can let go, and try 4-7-8 breathing.",
            "",
            "3. Self-Compassion Over Harsh Self-Criticism",
            "Notice how you speak to yourself after a tough day. Try speaking to yourself the way you would comfort a close friend: acknowledge the difficulty, normalize stumbling, and pick one caring next step.",
        ],
    },
]


def seed_starter_guides(uploaded_by: str | None = "system-starter") -> list[DocumentResponse]:
    """Generate and index 3 starter wellness PDFs if not already loaded."""
    existing = list_documents()
    existing_names = {doc.original_name for doc in existing.documents}
    created: list[DocumentResponse] = []

    for guide in STARTER_GUIDES:
        if guide["filename"] in existing_names:
            continue
        pdf_bytes = _build_simple_pdf(guide["title"], guide["lines"])
        sample_path = settings.SAMPLE_DOCS_DIR / guide["filename"]
        sample_path.write_bytes(pdf_bytes)

        upload_copy = settings.UPLOAD_DIR / f"starter_{guide['filename']}"
        upload_copy.write_bytes(pdf_bytes)
        doc = ingest_pdf_path(
            pdf_path=upload_copy,
            original_name=guide["filename"],
            title=guide["title"],
            category=guide["category"],
            uploaded_by=uploaded_by,
        )
        created.append(doc)

    return created

