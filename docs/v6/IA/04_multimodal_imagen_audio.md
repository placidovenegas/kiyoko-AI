# Multimodal (V6) — Imágenes ya integradas, Audio (entrada) aún no

## 1) Imágenes (entrada del usuario) — cómo funciona hoy
Backend:
- `src/app/api/ai/chat/route.ts`
  - Detecta el marcador `"[Imagenes adjuntas: ...]"` dentro del `content` del mensaje.
  - Convierte el texto a un formato multimodal para el SDK:
    - `[{ type: 'text', text }, { type: 'image', image: url1 }, ...]`
  - Priorización de modelos:
    - si hay imágenes, mueve al frente providers de visión: `gemini | claude | openai`.

Frontend:
- `src/components/chat/ChatInput.tsx` permite adjuntar archivos (input con `accept="image/*,.pdf,.doc,.docx,.txt,.md"`).
- El flujo existente (en el store/hook) sube imágenes a Supabase Storage y luego:
  - inserta las URLs como parte del mensaje,
  - y el backend detecta el marcador para convertir a multimodal.

Implicación:
- la IA “ve” imágenes solo a través de ese pipeline de conversión multimodal.

## 2) Audio (entrada del usuario) — gap actual
- `src/components/chat/ChatInput.tsx` no acepta audio (no hay `accept="audio/*"` ni manejo de `File` de audio).
- `src/app/api/ai/chat/route.ts` solo convierte multimodal para `images` (regex `IMAGE_URL_REGEX`).

Consecuencia:
- el chat **no puede**:
  - transcribir voz del usuario dentro del endpoint `/api/ai/chat`,
  - ni usar audio como entrada multimodal para acciones.

## 3) Audio de salida (TTS) — lo que sí existe
- `src/components/chat/ChatMessage.tsx` tiene `AudioPlayer` que renderiza un `<audio>` si encuentra una URL en:
  - `message.audioUrl`, o
  - un marcador del texto con regex `"[AUDIO: https://...]"`.

## 4) Recomendación V6 (para audio perfecto)
1. Añadir “entrada audio”:
   - Extender `ChatInput` con `accept="audio/*"` (o UI con mic/recording).
2. Crear endpoint de transcripción:
   - `/api/ai/transcribe` (mapea archivo audio → texto).
3. Integrar transcripción en el flujo chat:
   - antes de llamar a `/api/ai/chat`, convertir audio a texto y continuar con mensajes normales,
   - o mandar audio como multimodal si el modelo/SDK lo soporta.
4. Persistencia:
   - guardar audio y su transcripción en tablas canónicas (probablemente `scene_media` con `media_type=audio` y/o una tabla dedicada según tu schema actual).

