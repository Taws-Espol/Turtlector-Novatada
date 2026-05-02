import logging

from google import genai

from app.config import settings

logger = logging.getLogger(__name__)

client = genai.Client(api_key=settings.settings.gemini_api_key)


class ChatClient:
    def create_chat(self):
        return client.chats.create(model="gemma-4-31b-it")

    def send_message(self, chat, message):
        try:
            response = chat.send_message(message=message)
            return response.text
        except Exception as exc:
            logger.exception("Gemini request failed")
            raise Exception("Gemini request failed") from exc


chat_client = ChatClient()
