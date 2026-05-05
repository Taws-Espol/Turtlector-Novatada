from typing import Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: Optional[str] = Field(None, description="User message to send to the chat")
    audio_b64: Optional[str] = Field(
        None,
        description="Base64-encoded input audio (WAV or MP3) used when message is empty",
    )
    audio_mime_type: Optional[str] = Field(
        None,
        description="Optional hint for audio format, e.g. audio/wav or audio/mpeg",
    )
    conversation_id: Optional[str] = Field(
        None, description="Conversation ID for context"
    )


class ChatResponse(BaseModel):
    response: str = Field(..., description="AI response")
    conversation_id: str = Field(..., description="Conversation ID")
    audio_b64: Optional[str] = Field(
        None, description="Base64-encoded MP3 answer, present for audio-input requests"
    )
