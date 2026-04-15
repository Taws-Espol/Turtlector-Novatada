#!/usr/bin/env python3
"""
Script de prueba para el servicio TTSService
Demuestra cómo usar la clase TTSService para convertir texto a voz
"""

import os
import sys
from pathlib import Path

from tts_service import TTSService

# Importar directamente el servicio TTS

sys.pathappend(str(Path(__file__).parent / "app" / "services"))


def test_tts_service():
    """
    Prueba el servicio TTSService con la voz por defecto
    """
    print("🎙️  === PRUEBA DEL SERVICIO TTS ===")
    print()

    # Verificar credenciales
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not credentials_path:
        print("❌ Error: No se encontró la variable GOOGLE_APPLICATION_CREDENTIALS")
        return

    print(f"✅ Credenciales encontradas: {credentials_path}")
    print()

    # Crear instancia sin especificar voz (usará la por defecto)
    print("🔧 Creando instancia TTSService sin especificar voz...")
    tts = TTSService()

    # Texto de prueba
    texto_prueba = (
        "Hola, soy Polito, la tortuga seleccionadora de ESPOL. Esta es mi voz oficial."
    )

    print(f"📝 Generando audio con texto: {texto_prueba}")
    print()

    # Generar audio
    resultado = tts.synthesize_and_save(texto_prueba)

    if resultado:
        print(f"✅ Audio generado exitosamente: {os.path.basename(resultado)}")
        print(f"🎤 Voz utilizada: {tts.voice_name}")
        print()

        # Verificar que es la voz correcta
        if tts.voice_name == "es-US-Neural2-B":
            print("🎉 ¡PERFECTO! La voz por defecto es la correcta:")
            print("   - Voz: es-US-Neural2-B")
            print("   - Descripción: Español masculino de Estados Unidos (Neural2)")
            print("   - Calidad: Alta calidad con tecnología Neural2")
        else:
            print(f"⚠️  La voz por defecto es: {tts.voice_name}")
            print("   (No es la voz esperada)")
    else:
        print("❌ Error al generar audio")


if __name__ == "__main__":
    try:
        test_tts_service()
    except Exception as e:
        print(f"❌ Error durante la prueba: {str(e)}")
