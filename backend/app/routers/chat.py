import logging

from fastapi import APIRouter, Depends, HTTPException

from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
)
from app.services.chat import get_chat_service

router = APIRouter(prefix="/chat", tags=["Chat"])
logger = logging.getLogger(__name__)


@router.post("/send", response_model=ChatResponse)
def send_message(
    request: ChatRequest,
    chat_service=Depends(get_chat_service),
):
    """
    Envía un mensaje al chat y recibe respuesta del Sombrero Seleccionador.
    """
    try:
        chat_response = chat_service.answer(request.conversation_id, request.message)

        return ChatResponse(
            response=chat_response.response,
            conversation_id=chat_response.conversation_id,
        )
    except Exception as exc:
        logger.exception("Unhandled chat endpoint error")
        raise HTTPException(
            status_code=500, detail="Error interno del servidor"
        ) from exc
