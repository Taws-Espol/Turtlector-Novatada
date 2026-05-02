import logging
from dataclasses import dataclass
from typing import Any
import uuid

from app.clients.gemini import chat_client
from app.const.chat import system_prompt

logger = logging.getLogger(__name__)

conversations: dict[str, Any] = {}


@dataclass(frozen=True)
class ChatAnswer:
    response: str
    conversation_id: str


class ChatService:
    def __init__(self, chat_client):
        self.chat_client = chat_client

    def answer(self, conversation_id: str | None, message: str) -> ChatAnswer:
        if not isinstance(message, str) or not message.strip():
            logger.warning("Rejected empty message")
            raise ValueError("Message cannot be empty")

        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            logger.info("Created new conversation", extra={"conversation_id": conversation_id})

        if conversation_id not in conversations:
            chat = self.chat_client.create_chat()
            conversations[conversation_id] = chat
            self.chat_client.send_message(chat, system_prompt)
            logger.info("Initialized chat session", extra={"conversation_id": conversation_id})

        chat = conversations[conversation_id]

        ai_response = self.chat_client.send_message(chat, message)
        ai_response = ai_response.replace("*", "")
        logger.info("Generated chat response", extra={"conversation_id": conversation_id})

        return ChatAnswer(response=ai_response, conversation_id=conversation_id)


def get_chat_service():
    return ChatService(chat_client)
