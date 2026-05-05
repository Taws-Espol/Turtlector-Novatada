import uuid

from deepgram import DeepgramClient, SpeakOptions

from app.config.settings import settings

deepgram = DeepgramClient(api_key=settings.deepgram_api_key)


class DeepgramSTT:
    def get_text(self, audio_filename) -> str:
        try:
            with open(audio_filename, "rb") as audio_file:
                response = deepgram.listen.v1.media.transcribe_file(
                    request=audio_file.read(),
                    model="nova-3",
                    # language="en",
                )

            return response.results.channels[0].alternatives[0].transcript
        except Exception as e:
            print(e)


class DeepgramTTS:
    def synthesize(self, text) -> str:
        try:
            response = deepgram.speak.v1.audio.generate(
                text=text
            )
            return response.stream.getvalue() # Binary 
        except Exception as e:
            print(e)


deepgram_stt = DeepgramSTT()
deepgram_tts = DeepgramTTS()
