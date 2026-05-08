import logging
from dataclasses import dataclass, field
from typing import Any

from ollama import Client

from app.config.settings import settings

logger = logging.getLogger(__name__)

OLLAMA_HOST = "https://ollama.com"
OLLAMA_MODEL = "gpt-oss:20b"

client = Client(
    host=OLLAMA_HOST,
    headers={"Authorization": f"Bearer {settings.ollama_api_key}"},
)


@dataclass
class OllamaChatSession:
    messages: list[dict[str, str]] = field(default_factory=list)


class ChatClient:
    def create_chat(self):
        return OllamaChatSession()

    def send_message(self, chat: OllamaChatSession, message: str):
        try:
            chat.messages.append({"role": "user", "content": message})
            response = client.chat(
                model=OLLAMA_MODEL,
                messages=chat.messages,
                stream=False,
            )

            content = self._extract_content(response)
            chat.messages.append({"role": "assistant", "content": content})
            return content
        except Exception as exc:
            logger.exception("Ollama request failed")
            raise Exception("Ollama request failed") from exc

    @staticmethod
    def _extract_content(response: Any) -> str:
        if isinstance(response, dict):
            message = response.get("message", {})
            content = message.get("content", "")
            return content if isinstance(content, str) else str(content)

        message = getattr(response, "message", None)
        content = getattr(message, "content", None)
        if isinstance(content, str):
            return content

        if content is not None:
            return str(content)

        return str(response)


chat_client = ChatClient()
