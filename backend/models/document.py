from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_name: str
    title: str
    category: str
    page_count: int
    chunk_count: int
    file_size: int
    uploaded_by: str | None = None
    uploaded_at: str


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total_documents: int
    total_chunks: int


class DocumentSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    top_k: int = Field(default=4, ge=1, le=10)

