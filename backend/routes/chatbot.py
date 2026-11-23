from fastapi import APIRouter, Depends

from models.auth import UserProfile
from models.chat import ChatHistoryResponse, ChatRequest, ChatResponse
from services.auth_service import get_current_user
from services.chatbot_service import (
    clear_chat_history,
    get_chat_history,
    process_chat_message,
)

router = APIRouter(prefix="/api/chat", tags=["AI Chatbot"])


@router.post("", response_model=ChatResponse)
def chat_with_companion(
    payload: ChatRequest,
    current_user: UserProfile = Depends(get_current_user),
):
    return process_chat_message(current_user.id, current_user.name, payload)


@router.get("/history", response_model=ChatHistoryResponse)
def fetch_chat_history(current_user: UserProfile = Depends(get_current_user)):
    return get_chat_history(current_user.id)


@router.delete("/history")
def delete_chat_history(current_user: UserProfile = Depends(get_current_user)):
    return clear_chat_history(current_user.id)

