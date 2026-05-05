import logging

from fastapi import APIRouter, Depends, HTTPException

from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
)
from app.services.audio import get_audio_service
from app.services.chat import get_chat_service

router = APIRouter(prefix="/chat", tags=["Chat"])
logger = logging.getLogger(__name__)


@router.post("/send", response_model=ChatResponse)
def send_message(
    request: ChatRequest,
    chat_service=Depends(get_chat_service),
    audio_service=Depends(get_audio_service),
):
    """
    Envía un mensaje al chat y recibe respuesta del Sombrero Seleccionador.
    """
    try:
        message = (request.message or "").strip()
        used_audio_input = False

        if not message:
            if not request.audio_b64:
                raise HTTPException(
                    status_code=422,
                    detail="Either message or audio_b64 must be provided",
                )
            message = audio_service.transcribe_base64_audio(
                request.audio_b64, request.audio_mime_type
            )
            used_audio_input = True

        chat_response = chat_service.answer(request.conversation_id, message)

        response_audio_b64 = None
        if used_audio_input:
            response_audio_b64 = audio_service.synthesize_base64_mp3(chat_response.response)

        return ChatResponse(
            response=chat_response.response,
            conversation_id=chat_response.conversation_id,
            audio_b64=response_audio_b64,
        )
    except ValueError as exc:
        logger.warning("Rejected chat request", extra={"detail": str(exc)})
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.exception("Audio processing failure")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unhandled chat endpoint error")
        raise HTTPException(
            status_code=500, detail="Error interno del servidor"
        ) from exc
