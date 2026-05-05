import base64
import binascii
import io
import logging
import tempfile

from pydub import AudioSegment
from pydub.exceptions import CouldntDecodeError

from app.clients.deepgram import deepgram_stt, deepgram_tts

logger = logging.getLogger(__name__)


class AudioService:
    def __init__(self, stt_client, tts_client):
        self.stt_client = stt_client
        self.tts_client = tts_client

    def transcribe_base64_audio(
        self, audio_b64: str, audio_mime_type: str | None = None
    ) -> str:
        audio_bytes = self._decode_base64_audio(audio_b64)
        audio_format = self._detect_audio_format(audio_bytes, audio_mime_type)

        wav_bytes = self._to_wav_bytes(audio_bytes, audio_format)
        transcript = self._transcribe_wav_bytes(wav_bytes)
        if not transcript or not transcript.strip():
            raise ValueError("Audio transcription returned empty text")
        return transcript.strip()

    def synthesize_base64_mp3(self, text: str) -> str:
        if not isinstance(text, str) or not text.strip():
            raise ValueError("Text cannot be empty for TTS synthesis")

        audio_bytes = self.tts_client.synthesize(text.strip())
        if not audio_bytes:
            raise RuntimeError("TTS synthesis returned empty audio")
        return base64.b64encode(audio_bytes).decode("utf-8")

    def _decode_base64_audio(self, audio_b64: str) -> bytes:
        if not isinstance(audio_b64, str) or not audio_b64.strip():
            raise ValueError("audio_b64 is required when message is empty")
        try:
            return base64.b64decode(audio_b64, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ValueError("audio_b64 is not valid base64") from exc

    def _detect_audio_format(self, audio_bytes: bytes, audio_mime_type: str | None) -> str:
        if audio_mime_type:
            mime = audio_mime_type.lower()
            if "wav" in mime or "wave" in mime:
                return "wav"
            if "mpeg" in mime or "mp3" in mime:
                return "mp3"
            if "webm" in mime:
                return "webm"

        if len(audio_bytes) >= 12 and audio_bytes[:4] == b"RIFF" and audio_bytes[8:12] == b"WAVE":
            return "wav"
        if audio_bytes.startswith(b"ID3"):
            return "mp3"
        if len(audio_bytes) >= 2 and audio_bytes[0] == 0xFF and (audio_bytes[1] & 0xE0) == 0xE0:
            return "mp3"
        if audio_bytes.startswith(b"\x1A\x45\xDF\xA3"):
            return "webm"

        raise ValueError("Unsupported audio format: only WAV, MP3, and WEBM are accepted")

    def _to_wav_bytes(self, audio_bytes: bytes, audio_format: str) -> bytes:
        if audio_format == "wav":
            return audio_bytes
        if audio_format == "mp3":
            return self._convert_to_wav(audio_bytes, "mp3")
        if audio_format == "webm":
            return self._convert_to_wav(audio_bytes, "webm")
        raise ValueError("Unsupported conversion format")

    def _convert_to_wav(self, source_bytes: bytes, source_format: str) -> bytes:
        try:
            audio_segment = AudioSegment.from_file(io.BytesIO(source_bytes), format=source_format)
            output = io.BytesIO()
            audio_segment.export(output, format="wav")
            return output.getvalue()
        except (CouldntDecodeError, FileNotFoundError, OSError) as exc:
            logger.exception("Failed to convert audio to WAV")
            raise RuntimeError(
                "Could not convert input audio to WAV. Verify ffmpeg is installed."
            ) from exc

    def _transcribe_wav_bytes(self, wav_bytes: bytes) -> str:
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp_wav:
            tmp_wav.write(wav_bytes)
            tmp_wav.flush()
            return self.stt_client.get_text(tmp_wav.name)


def get_audio_service():
    return AudioService(deepgram_stt, deepgram_tts)
