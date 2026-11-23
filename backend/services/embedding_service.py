import os
from functools import lru_cache
from langchain_huggingface import HuggingFaceEmbeddings

from config import settings


@lru_cache(maxsize=1)
def get_embedding_model() -> HuggingFaceEmbeddings:
    """Lazily load and cache the Hugging Face Sentence Transformer embedding model."""
    if settings.hf_configured:
        os.environ.setdefault("HUGGINGFACEHUB_API_TOKEN", settings.HUGGINGFACEHUB_API_TOKEN)
        os.environ.setdefault("HF_TOKEN", settings.HUGGINGFACEHUB_API_TOKEN)

    return HuggingFaceEmbeddings(
        model_name=settings.EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


def embedding_status() -> dict:
    return {
        "model": settings.EMBEDDING_MODEL,
        "loaded": get_embedding_model.cache_info().currsize > 0,
        "huggingface_token_configured": settings.hf_configured,
    }

