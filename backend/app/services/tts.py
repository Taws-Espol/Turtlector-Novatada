import base64

from app.clients.texttospeech import tts_client


class TTSService:
    def __init__(self, client):
        """ """
        self.client = client

    def synthesize_and_save(self, text: str):
        """ """
        audio = self.client.synthesize(text)
        audio_base64 = base64.b64encode(audio).decode("utf-8")

        return audio_base64


def get_tts_service():
    return TTSService(tts_client)
