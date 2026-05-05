import logging

from deepgram import DeepgramClient

from app.config.settings import settings

deepgram = DeepgramClient(api_key=settings.deepgram_api_key)
logger = logging.getLogger(__name__)


class DeepgramSTT:
    def get_text(self, audio_filename: str) -> str:
        try:
            with open(audio_filename, "rb") as audio_file:
                response = deepgram.listen.v1.media.transcribe_file(
                    request=audio_file.read(),
                    model="nova-3",
                    # language="en",
                )

            return response.results.channels[0].alternatives[0].transcript
        except Exception as exc:
            logger.exception("Deepgram STT request failed")
            raise RuntimeError("Deepgram STT request failed") from exc


class DeepgramTTS:
    def synthesize(self, text: str) -> bytes:
        try:
            response = deepgram.speak.v1.audio.generate(text=text)
            return response.stream.getvalue()
        except Exception as exc:
            logger.exception("Deepgram TTS request failed")
            raise RuntimeError("Deepgram TTS request failed") from exc


deepgram_stt = DeepgramSTT()
deepgram_tts = DeepgramTTS()
