from fastapi import APIRouter, Depends, File, Form, UploadFile

from models.auth import UserProfile
from models.chat import RetrievedSource
from models.document import DocumentListResponse, DocumentResponse, DocumentSearchRequest
from services.auth_service import get_current_user, require_admin_user
from services.rag_service import (
    delete_document,
    list_documents,
    retrieve_relevant_context,
    seed_starter_guides,
    upload_and_index_pdf,
)

router = APIRouter(prefix="/api/documents", tags=["Wellness Knowledge Base (RAG)"])


@router.get("", response_model=DocumentListResponse)
def get_uploaded_documents(_user: UserProfile = Depends(get_current_user)):
    return list_documents()


@router.post("/upload", response_model=DocumentResponse)
async def upload_wellness_document(
    file: UploadFile = File(...),
    title: str | None = Form(default=None),
    category: str = Form(default="General Wellness"),
    admin_user: UserProfile = Depends(require_admin_user),
):
    return await upload_and_index_pdf(
        file=file,
        title=title,
        category=category,
        uploaded_by=admin_user.email,
    )


@router.post("/seed", response_model=list[DocumentResponse])
def load_starter_wellness_guides(
    admin_user: UserProfile = Depends(require_admin_user),
):
    return seed_starter_guides(uploaded_by=admin_user.email)


@router.post("/search", response_model=list[RetrievedSource])
def search_knowledge_base(
    payload: DocumentSearchRequest,
    _user: UserProfile = Depends(get_current_user),
):
    return retrieve_relevant_context(payload.query, top_k=payload.top_k, min_similarity=0.15)


@router.delete("/{doc_id}")
def remove_document(
    doc_id: str,
    _admin_user: UserProfile = Depends(require_admin_user),
):
    return delete_document(doc_id)

