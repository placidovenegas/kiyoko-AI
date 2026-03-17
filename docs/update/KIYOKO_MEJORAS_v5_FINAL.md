# 🎤 KIYOKO AI — Mejoras v5: Narración, Voces, Traducción y Producción

## Mejoras adicionales para producción de vídeo profesional

### Para: Claude Code — Implementación sobre el proyecto existente

---

## 1. SISTEMA DE NARRACIÓN

### 1.1 Dos Modos de Narración

Cada proyecto puede tener narración de dos formas:

**MODO A — Narración por escena**: Cada escena tiene su propio texto de voz en off. Útil para anuncios donde un narrador describe lo que pasa en cada momento.

**MODO B — Narración continua**: Un texto completo y fluido que se lee sobre todo el vídeo, sin cortes entre escenas. Útil para vídeos corporativos, documentales, presentaciones.

```
┌─ CONFIG NARRACIÓN ───────────────────────────────────────────────┐
│                                                                   │
│  Modo: [◉ Por escena] [○ Continua] [○ Sin narración]             │
│                                                                   │
│  Idioma: [Español ▾]  ← dropdown con idiomas                     │
│  Tono: [Profesional ▾]  ← cálido, formal, enérgico, emotivo     │
│  Perspectiva: [Tercera persona ▾]  ← 1ra, 2da, 3ra              │
│                                                                   │
│  [🤖 Generar narración completa con IA]                           │
└───────────────────────────────────────────────────────────────────┘
```

### 1.2 Narración POR ESCENA — Campos en DB

```sql
-- Añadir a la tabla scenes
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS
  narration_text TEXT DEFAULT '';
-- Ejemplo: "Nerea aplica con precisión el adhesivo profesional 
-- sobre el cuero cabelludo. Cada movimiento es exacto, medido, 
-- fruto de años de experiencia."

ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS
  narration_audio_url TEXT;
-- URL del audio generado en Storage

ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS
  narration_audio_duration_ms INTEGER;
-- Duración del audio en milisegundos (para sincronizar con la escena)
```

### 1.3 Narración CONTINUA — Campos en DB

```sql
-- Añadir a la tabla projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS
  narration_mode TEXT DEFAULT 'none'; -- 'none' | 'per_scene' | 'continuous'

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS
  narration_config JSONB DEFAULT '{
    "language": "es",
    "tone": "professional",
    "perspective": "third_person",
    "voice_id": null,
    "voice_provider": null
  }';

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS
  narration_full_text TEXT DEFAULT '';
-- El guión completo de narración continua

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS
  narration_full_audio_url TEXT;
-- Audio completo generado
```

### 1.4 Cómo se ve en cada Scene Card

```
┌─ ESCENA E4A ── Pegamento ── 6s ────────────────────────────────┐
│                                                                  │
│  🖼️ [Imagen]                                                    │
│                                                                  │
│  📝 QUÉ PASA: Nerea aplica pegamento en el cuero cabelludo...   │
│                                                                  │
│  🎤 NARRACIÓN:                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ "Con la precisión de una cirujana, Nerea aplica el       │    │
│  │  adhesivo profesional sobre la línea del nacimiento      │    │
│  │  del cabello. Cada milímetro cuenta."                    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ⏱️ Duración texto: ~4.2s (estimado a velocidad normal)          │
│  ⚠️ El texto dura 4.2s pero la escena dura 6s → 1.8s de margen  │
│                                                                  │
│  [✏️ Editar texto] [🤖 Regenerar con IA] [🔊 Generar voz]       │
│  [▶️ Escuchar]  ← si ya se generó el audio                      │
│                                                                  │
│  ── PROMPTS ──                                                   │
│  (prompt_image, prompt_video como siempre)                       │
└──────────────────────────────────────────────────────────────────┘
```

**Cálculo automático de duración del texto**: ~150 palabras/minuto en español = ~2.5 palabras/segundo. Si el texto tiene 10 palabras → ~4 segundos. Se compara con la duración de la escena y se muestra warning si no cabe.

### 1.5 Generación de Narración con IA

Desde el chat o con botón dedicado:

```
USUARIO: "Genera la narración para todas las escenas"

KIYOKO:
┌──────────────────────────────────────────────────────────────────┐
│ 🤖 Voy a generar narración para las 15 escenas. Configuración:  │
│                                                                  │
│  Idioma: Español                                                 │
│  Tono: Profesional y cálido                                      │
│  Perspectiva: Tercera persona                                    │
│                                                                  │
│  Preview de las primeras 3 escenas:                              │
│                                                                  │
│  N1 (3s): "El sonido del acero. Una tijera se cierra con        │
│  precisión milimétrica."                                         │
│  ⏱️ ~2.8s ✅ Cabe en 3s                                          │
│                                                                  │
│  E1 (5s): "Domenech. Más que una peluquería. Un lugar donde     │
│  cada detalle importa."                                          │
│  ⏱️ ~4.1s ✅ Cabe en 5s                                          │
│                                                                  │
│  E2 (4s): "En el corazón de la ciudad, una fachada que guarda   │
│  décadas de confianza."                                          │
│  ⏱️ ~3.5s ✅ Cabe en 4s                                          │
│                                                                  │
│ [✅ Generar las 15] [✏️ Ajustar tono] [❌ Cancelar]               │
└──────────────────────────────────────────────────────────────────┘
```

### 1.6 System Prompt para Narración

```typescript
// src/lib/ai/prompts/system-narration-generator.ts

export const SYSTEM_NARRATION = `
Eres un guionista de voz en off profesional para vídeos publicitarios.

REGLAS:
1. El texto DEBE caber en la duración de la escena
   - Velocidad normal de lectura: ~2.5 palabras/segundo en español
   - Para 5 segundos → máximo 12-13 palabras
   - Siempre dejar 0.5-1s de margen para respirar

2. TONO según configuración:
   - "professional": Formal pero cercano, inspira confianza
   - "warm": Emocional, cálido, empático
   - "energetic": Dinámico, ritmo rápido, entusiasta
   - "cinematic": Dramático, pausas, impactante
   - "minimal": Pocas palabras, cada una cuenta

3. NO describir lo que se ve (eso ya lo hace la imagen)
   → MAL: "Vemos a Nerea aplicando pegamento"
   → BIEN: "Cada milímetro cuenta. Precisión de cirujana."

4. La narración COMPLEMENTA la imagen, no la repite

5. Si el modo es CONTINUO:
   - El texto debe fluir como una historia
   - Transiciones suaves entre escenas
   - Ritmo que sube y baja: calma → emoción → calma → impacto

6. NUNCA incluir indicaciones técnicas en el texto
   → MAL: "(pausa de 2 segundos)"
   → Las pausas se gestionan con el timing de las escenas
`;
```

---

## 2. GENERACIÓN DE VOZ GRATIS (TTS)

### 2.1 Proveedores TTS — Cadena de Fallback

| Provider | Tier gratuito | Calidad | Idiomas | Uso en Kiyoko |
|----------|--------------|---------|---------|---------------|
| **Web Speech API** (navegador) | ✅ Totalmente gratis | Media | 40+ | **DEFAULT** — funciona offline |
| **Google Cloud TTS** | ✅ 4M chars/mes gratis | Alta (WaveNet) | 50+ | Fallback 1 — si hay API key |
| **ElevenLabs** | ✅ 10K chars/mes gratis | Muy alta | 32+ | Premium — si hay API key |
| **OpenAI TTS** | ⚠️ De pago ($15/1M chars) | Alta | 57+ | Premium — si hay API key |

### 2.2 Web Speech API — Gratis y Sin Límites

El navegador tiene TTS incorporado. Es gratis, funciona offline, y no necesita API key:

```typescript
// src/lib/tts/web-speech.ts

export async function generateSpeechWebAPI(
  text: string,
  options: {
    lang?: string;        // 'es-ES', 'en-US', etc
    rate?: number;        // 0.5 - 2 (velocidad)
    pitch?: number;       // 0 - 2
    voiceName?: string;   // Nombre de la voz del sistema
  }
): Promise<{ audioBlob: Blob; durationMs: number }> {
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || 'es-ES';
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    
    // Seleccionar voz específica si se indica
    if (options.voiceName) {
      const voices = speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === options.voiceName);
      if (voice) utterance.voice = voice;
    }

    // Para capturar el audio necesitamos MediaRecorder + Audio Context
    // porque Web Speech API no devuelve blob directamente
    // Se usa un workaround con AudioContext destination recording
    
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();
    const mediaRecorder = new MediaRecorder(destination.stream);
    const chunks: BlobPart[] = [];
    
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      resolve({ audioBlob: blob, durationMs: /* calc */ 0 });
    };
    
    mediaRecorder.start();
    speechSynthesis.speak(utterance);
    
    utterance.onend = () => {
      mediaRecorder.stop();
      audioContext.close();
    };
    utterance.onerror = reject;
  });
}

// Listar voces disponibles en el navegador
export function getAvailableVoices(lang?: string): SpeechSynthesisVoice[] {
  const voices = speechSynthesis.getVoices();
  if (lang) return voices.filter(v => v.lang.startsWith(lang));
  return voices;
}
```

### 2.3 Google Cloud TTS — Alta Calidad Gratis (con límite)

```typescript
// src/lib/tts/google-tts.ts

// 4 millones de caracteres gratis al mes (WaveNet: 1M gratis)
// Voces en español: es-ES (España), es-US (Latinoamérica)

export async function generateSpeechGoogle(
  text: string,
  options: {
    languageCode: string;      // 'es-ES'
    voiceName: string;         // 'es-ES-Wavenet-B' (masculina profesional)
    audioEncoding: string;     // 'MP3' | 'OGG_OPUS' | 'LINEAR16'
    speakingRate?: number;     // 0.25 - 4.0
    pitch?: number;            // -20 a 20 semitones
  }
): Promise<{ audioBase64: string; durationMs: number }> {
  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: options.languageCode,
          name: options.voiceName,
        },
        audioConfig: {
          audioEncoding: options.audioEncoding || 'MP3',
          speakingRate: options.speakingRate || 1.0,
          pitch: options.pitch || 0,
        },
      }),
    }
  );
  
  const data = await response.json();
  return { audioBase64: data.audioContent, durationMs: /* parse */ 0 };
}
```

### 2.4 Selector de Voz en la UI

```
┌─ CONFIGURACIÓN DE VOZ ──────────────────────────────────────────┐
│                                                                   │
│  Provider: [◉ Navegador (gratis)] [○ Google WaveNet] [○ ElevenLabs]│
│                                                                   │
│  Idioma: [Español (España) ▾]                                     │
│                                                                   │
│  Voz: [▶️ Google Español Femenina (Helena)]  ← play preview       │
│       [▶️ Google Español Masculina (Pablo)]                        │
│       [▶️ Sistema: Microsoft Helena]                               │
│       [▶️ Sistema: Google español]                                 │
│                                                                   │
│  Velocidad: ◀ ████████░░ ▶  1.0x                                  │
│  Tono:      ◀ █████░░░░░ ▶  0 (normal)                            │
│                                                                   │
│  [▶️ Probar con texto de ejemplo]                                  │
│  "Con la precisión de una cirujana, Nerea aplica..."              │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### 2.5 Generar y Descargar Audio

Desde cada escena o para el vídeo completo:

```
POR ESCENA:
[🔊 Generar voz] → genera audio → guarda en Storage → muestra player
[▶️ Escuchar] [⏸️] [⬇️ Descargar MP3] [🔄 Regenerar]

COMPLETO:
[🔊 Generar narración completa] → concatena todos los audios con 
silencios entre escenas → un solo archivo MP3
[⬇️ Descargar narración completa (MP3)]
[⬇️ Descargar audios por escena (ZIP)]
```

### 2.6 API Route para TTS

```typescript
// src/app/api/ai/generate-voice/route.ts

// POST: Genera audio de un texto
interface GenerateVoiceRequest {
  text: string;
  language: string;          // 'es-ES'
  provider: 'web_speech' | 'google' | 'elevenlabs' | 'openai';
  voiceId?: string;
  speed?: number;
  pitch?: number;
  outputFormat?: 'mp3' | 'wav' | 'ogg';
}

// GET: Lista voces disponibles por provider
interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  provider: string;
  previewUrl?: string;       // URL de audio de muestra
  isFree: boolean;
}

// POST: Genera narración completa del proyecto
interface GenerateFullNarrationRequest {
  projectId: string;
  mode: 'per_scene' | 'continuous';
  voiceConfig: {
    provider: string;
    voiceId: string;
    speed: number;
    language: string;
  };
}
// Devuelve:
// - Array de audios por escena (con URLs en Storage)
// - Audio completo concatenado (URL en Storage)
// - Archivo ZIP descargable
```

---

## 3. TRADUCCIÓN DE PROMPTS — CHROME TRANSLATOR API

### 3.1 Cómo Funciona

La Chrome Translator API permite traducir texto directamente en el navegador, sin servidor, sin coste, y respetando la privacidad. Es perfecta para traducir prompts entre español e inglés.

```typescript
// src/lib/translation/chrome-translator.ts

/**
 * Usa la Chrome Translator API (built-in AI) si está disponible.
 * Fallback a Google Translate API si no.
 */

export async function isTranslatorAvailable(): Promise<boolean> {
  return 'Translator' in window;
}

export async function translateText(
  text: string,
  from: string,  // 'es'
  to: string     // 'en'
): Promise<string> {
  // Intento 1: Chrome Translator API (gratis, offline, privado)
  if ('Translator' in window) {
    try {
      const translator = await (window as any).Translator.create({
        sourceLanguage: from,
        targetLanguage: to,
      });
      return await translator.translate(text);
    } catch (e) {
      console.warn('Chrome Translator no disponible, usando fallback');
    }
  }
  
  // Intento 2: Google Translate API (necesita API key)
  // (implementar como fallback del servidor)
  const response = await fetch('/api/translate', {
    method: 'POST',
    body: JSON.stringify({ text, from, to }),
  });
  const data = await response.json();
  return data.translatedText;
}
```

### 3.2 Botón de Traducción en Cada Prompt

Junto a cada bloque de prompt, un botón para ver la traducción:

```
── PROMPT DE IMAGEN (EN) ──────────────────── [📋 Copiar] ──
```
Pixar Studios 3D animated render, interior of Domenech
hair salon prosthesis consultation area...
```

[🌐 Traducir a Español]  ← click

── TRADUCCIÓN (ES) — solo para referencia ─────────────────
```
Render 3D animado estilo Pixar, interior de la zona de
consulta de prótesis del salón Domenech...
```
[🌐 Ocultar traducción]
```

**Importante**: La traducción es SOLO informativa. Los prompts para los generadores de imagen SIEMPRE van en inglés. El botón de traducción ayuda al usuario a entender qué dice el prompt sin saber inglés.

### 3.3 Traducción Bidireccional en el Chat

Si el usuario escribe un prompt en español, el chat puede traducirlo:

```
USUARIO: "Traduce esto a prompt en inglés: Nerea coloca la prótesis 
sobre la cabeza del cliente con cuidado, presionando los bordes"

KIYOKO:
┌──────────────────────────────────────────────────────────────────┐
│ 🤖 Aquí tienes el prompt traducido y mejorado para generador:   │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ Nerea carefully places the hair prosthesis onto the        │   │
│ │ client's head, gently pressing the edges along the         │   │
│ │ hairline perimeter with her fingertips, bonding the        │   │
│ │ prosthesis seamlessly to the scalp.                        │   │
│ └─────────────────────────────────────────────── [📋 Copiar]┘   │
│                                                                  │
│ ¿Quieres que lo convierta en un prompt completo con estilo       │
│ Pixar, cámara e iluminación?                                     │
│                                                                  │
│ [✅ Sí, prompt completo] [📋 Usar así]                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. MEJORAS ADICIONALES DE PRODUCCIÓN

### 4.1 Música y Sonido — Sugerencias por Escena

Cada escena puede tener sugerencias de música y efectos de sonido:

```sql
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS
  music_suggestion TEXT DEFAULT '';
-- "Piano suave emotivo, tipo Ludovico Einaudi"

ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS
  sfx_suggestion TEXT DEFAULT '';
-- "Sonido de tijeras cortando, ambiente de salón"

ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS
  music_intensity INTEGER DEFAULT 5;
-- 1=silencio, 5=normal, 10=máximo impacto
```

En la Scene Card:
```
🎵 MÚSICA: Piano emotivo, crescendo suave [Intensidad: ████████░░ 8/10]
🔊 SFX: Tijeras cortando, ambiente salón suave
```

La IA puede generar estas sugerencias automáticamente:
```
USUARIO: "Genera sugerencias de música para todas las escenas"

KIYOKO genera:
- N1 (Gancho): Silencio → Solo SFX tijeras. Intensidad 1/10
- E1 (Logo): Entrada de piano suave. Intensidad 3/10
- E2 (Exterior): Música sube, guitarra acústica. Intensidad 5/10
- E4A (Prótesis): Piano emotivo, notas largas. Intensidad 7/10
- N7 (POV espejo): Clímax musical, cuerdas. Intensidad 10/10
- E9 (Cierre): Resolución cálida, fade out. Intensidad 6/10
```

### 4.2 Vista Previa Multi-Formato (Aspect Ratio)

Los vídeos se hacen para diferentes plataformas con diferentes aspect ratios. Poder previsualizar cómo se verá la composición en cada uno:

```
┌─ PREVIEW DE FORMATO ─────────────────────────────────────────────┐
│                                                                   │
│  [16:9 YouTube] [9:16 Reels/TikTok] [1:1 Instagram] [4:5 Feed]  │
│                                                                   │
│  ┌─────────────────────┐  ← Preview de la escena actual          │
│  │                     │     con overlay del aspect ratio         │
│  │    🖼️ Imagen de la   │     y guías de safe zone                │
│  │    escena con crop   │                                         │
│  │    del formato       │     ⚠️ En 9:16 se pierde el             │
│  │    seleccionado      │     personaje de la izquierda.          │
│  │                     │     Ajustar composición.                 │
│  └─────────────────────┘                                          │
└───────────────────────────────────────────────────────────────────┘
```

### 4.3 Checklist de Producción

Cada escena tiene un checklist de lo que falta por hacer:

```
┌─ CHECKLIST E4A ────────────────────────────┐
│ ✅ Descripción en español                   │
│ ✅ Prompt de imagen                          │
│ ✅ Prompt de vídeo                           │
│ ✅ Personajes asignados                      │
│ ✅ Fondo asignado                            │
│ ✅ Duración definida (6s)                    │
│ ⬜ Imagen generada                           │
│ ⬜ Imagen aprobada                           │
│ ⬜ Narración escrita                         │
│ ⬜ Audio de narración generado               │
│ ⬜ Música sugerida                           │
│ ─────────────────────                       │
│ Completado: 6/10 (60%)                      │
└─────────────────────────────────────────────┘
```

Esto se calcula automáticamente y alimenta la barra de progreso del proyecto.

### 4.4 Shot List Export (para rodaje real)

Si alguien quiere grabar las escenas en vídeo real (no generadas por IA), poder exportar un shot list profesional:

```markdown
# SHOT LIST — Domenech Peluquerías

## DÍA 1 — Locación: Salón Interior

| # | Escena | Plano | Ángulo | Mov. | Duración | Personajes | Notas |
|---|--------|-------|--------|------|----------|------------|-------|
| 1 | E3 | Wide | Eye-level | Dolly-in | 6s | José, Conchi, Nerea, Raúl | Todos con herramientas |
| 2 | E6 | Wide | Above | Pan L→R | 6s | Conchi, Raúl, Nerea | 3 espejos ocupados |
| 3 | E4A | Medium | Side | Static | 6s | Nerea, Cliente | Close-up manos |
| 4 | E4B | Medium | Side | Static | 8s | Nerea, Cliente | Colocación prótesis |
| 5 | E5 | Medium-Wide | Eye | Static | 6s | Todos + Cliente | Celebración |

## DÍA 2 — Locación: Exterior
...
```

Exportable como PDF o Markdown.

### 4.5 Storyboard Imprimible (Print Layout)

Botón para generar un PDF diseñado para imprimir y llevar al set:

```
┌────────────────────────────────────────────────┐
│  DOMENECH PELUQUERÍAS — Storyboard v3          │
│                                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ 🖼️ E1   │  │ 🖼️ E2   │  │ 🖼️ E3   │       │
│  │ Logo    │  │ Exterior│  │ Equipo  │       │
│  │ 5s      │  │ 4s      │  │ 6s      │       │
│  │ _______ │  │ _______ │  │ _______ │       │
│  │ Narración│  │ Narración│  │ Narración│       │
│  └─────────┘  └─────────┘  └─────────┘       │
│                                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ 🖼️ E6   │  │ 🖼️ N8   │  │ 🖼️ R4   │       │
│  │ Montaje │  │ José    │  │ Título  │       │
│  │ 6s      │  │ 4s      │  │ 3s      │       │
│  └─────────┘  └─────────┘  └─────────┘       │
│                                                │
│  Página 1 de 3           Total: 73s            │
└────────────────────────────────────────────────┘
```

3 escenas por fila, 6 por página, con: thumbnail, título, duración, narración, notas de cámara.

### 4.6 Estimador de Duración de Texto

Herramienta para saber si un texto de narración cabe en X segundos:

```typescript
// src/lib/utils/text-duration.ts

const WORDS_PER_MINUTE = {
  es: 150,    // Español: ~150 palabras/minuto
  en: 160,    // Inglés: ~160
  fr: 145,    // Francés: ~145
  de: 130,    // Alemán: ~130
  it: 155,    // Italiano: ~155
};

export function estimateTextDuration(
  text: string, 
  lang: string = 'es'
): { 
  durationSeconds: number; 
  wordCount: number;
  fitsInSeconds: (seconds: number) => boolean;
  maxWordsForSeconds: (seconds: number) => number;
} {
  const words = text.trim().split(/\s+/).length;
  const wpm = WORDS_PER_MINUTE[lang] || 150;
  const durationSeconds = (words / wpm) * 60;
  
  return {
    durationSeconds: Math.round(durationSeconds * 10) / 10,
    wordCount: words,
    fitsInSeconds: (s) => durationSeconds <= s,
    maxWordsForSeconds: (s) => Math.floor((s * wpm) / 60),
  };
}
```

### 4.7 Color Script / Mood Board Automático

La IA analiza las escenas y genera una guía visual de color y mood para todo el vídeo:

```
USUARIO: "Genera el color script del vídeo"

KIYOKO genera un diagrama de barras de color:

┌─────────────────────────────────────────────────────────────┐
│ COLOR SCRIPT — Domenech · 73 segundos                        │
│                                                              │
│ ██ ██ ████ ██████ ██ ████ ████████████ ████████ ████ ██████ │
│ ⬛ 🟡 🟠🟡 🟠🟠🟡 🟡 🟠🟡 🟢🟢🟡🟡🟡 🟢🟢🟢🟡 🟡🟠 🔵🟡🟡 │
│ ^    ^      ^       ^     ^              ^         ^    ^    │
│ Mist Logo  Equipo  Serv  Título  Prótesis  Celeb  José  Cierre │
│ erio                                                         │
│                                                              │
│ Paleta dominante: Dorado cálido (#F5930B) → Verde esper.     │
│ Progresión emocional: Misterio → Energía → Emoción → Calma  │
└──────────────────────────────────────────────────────────────┘
```

### 4.8 Duplicar Proyecto

Botón para clonar un proyecto completo (con todas sus escenas, personajes, fondos):

```
[📋 Duplicar proyecto] → "¿Duplicar 'Domenech Peluquerías'?"
→ Crea copia con título "Domenech Peluquerías (copia)"
→ Duplica: escenas, personajes, fondos, arco, timeline
→ NO duplica: imágenes generadas, audios, exports
```

### 4.9 Templates de Proyecto

Proyectos plantilla que el usuario puede usar como punto de partida:

```
┌─ TEMPLATES ──────────────────────────────────────────────────────┐
│                                                                   │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│ │ 📺 30s   │  │ 📱 15s   │  │ 🎬 60s   │  │ 🎥 90s   │          │
│ │ TV Spot  │  │ Reel     │  │ YouTube  │  │ Corto    │          │
│ │          │  │          │  │          │  │          │          │
│ │ 8 escenas│  │ 5 escenas│  │ 12 escen │  │ 18 escen │          │
│ │ Gancho + │  │ Hook +   │  │ Full arc │  │ Extended │          │
│ │ CTA      │  │ Impact   │  │          │  │          │          │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│                                                                   │
│ [Usar template] → Crea proyecto con estructura predefinida        │
└───────────────────────────────────────────────────────────────────┘
```

---

## 5. RESUMEN DE NUEVOS ARCHIVOS Y CAMBIOS EN DB

### Nuevos archivos a crear:

```
src/lib/tts/
├── index.ts               # Router TTS (elige provider)
├── web-speech.ts           # Web Speech API (gratis)
├── google-tts.ts           # Google Cloud TTS
├── elevenlabs-tts.ts       # ElevenLabs
└── openai-tts.ts           # OpenAI TTS

src/lib/translation/
├── chrome-translator.ts    # Chrome Translator API
└── fallback-translator.ts  # Google Translate API (server)

src/lib/narration/
├── generator.ts            # Genera textos de narración con IA
├── timing.ts               # Calcula duración de texto
└── concatenator.ts         # Concatena audios de escenas

src/lib/export/
├── generate-shot-list.ts   # Exportar shot list
└── generate-print-pdf.ts   # Storyboard imprimible

src/components/narration/
├── NarrationConfig.tsx     # Config de narración del proyecto
├── NarrationPerScene.tsx   # Editor de narración por escena
├── NarrationFull.tsx       # Editor de narración continua
├── NarrationPlayer.tsx     # Player de audio inline
├── VoiceSelector.tsx       # Selector de voz con preview
└── NarrationDownload.tsx   # Botones de descarga

src/components/translation/
├── TranslateButton.tsx     # Botón "Traducir a Español"
├── TranslationPreview.tsx  # Preview de traducción inline
└── TranslateChatInput.tsx  # Traducir input del chat

src/components/production/
├── ProductionChecklist.tsx  # Checklist por escena
├── AspectRatioPreview.tsx   # Preview multi-formato
├── MusicSuggestions.tsx     # Sugerencias de música
├── ColorScript.tsx          # Mood board visual
├── ShotListExport.tsx       # Exportar shot list
└── ProjectTemplates.tsx     # Templates de proyecto

src/app/api/ai/
├── generate-narration/route.ts    # Genera texto de narración
└── generate-voice/route.ts        # Genera audio TTS (ya existía)

src/app/api/
├── translate/route.ts             # Traducción server-side (fallback)
└── export/
    ├── shot-list/route.ts         # Genera shot list PDF/MD
    └── print-storyboard/route.ts  # Genera storyboard imprimible
```

### Cambios en DB (resumen):

```sql
-- scenes: 4 columnas nuevas
ALTER TABLE scenes ADD COLUMN narration_text TEXT DEFAULT '';
ALTER TABLE scenes ADD COLUMN narration_audio_url TEXT;
ALTER TABLE scenes ADD COLUMN narration_audio_duration_ms INTEGER;
ALTER TABLE scenes ADD COLUMN music_suggestion TEXT DEFAULT '';
ALTER TABLE scenes ADD COLUMN sfx_suggestion TEXT DEFAULT '';
ALTER TABLE scenes ADD COLUMN music_intensity INTEGER DEFAULT 5;
ALTER TABLE scenes ADD COLUMN image_versions JSONB DEFAULT '[]';

-- projects: 4 columnas nuevas  
ALTER TABLE projects ADD COLUMN narration_mode TEXT DEFAULT 'none';
ALTER TABLE projects ADD COLUMN narration_config JSONB DEFAULT '{}';
ALTER TABLE projects ADD COLUMN narration_full_text TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN narration_full_audio_url TEXT;
ALTER TABLE projects ADD COLUMN global_rules JSONB DEFAULT '[]';

-- characters: 2 columnas nuevas
ALTER TABLE characters ADD COLUMN role_rules JSONB DEFAULT '[]';
ALTER TABLE characters ADD COLUMN ai_notes TEXT DEFAULT '';

-- nueva tabla
CREATE TABLE change_history (...); -- ver doc v4
```

---

## 6. PRIORIDAD DE IMPLEMENTACIÓN

| # | Tarea | Esfuerzo | Impacto |
|---|-------|----------|---------|
| 1 | Narración por escena (campo + generación IA) | Medio | 🔴 Crítico |
| 2 | TTS con Web Speech API (gratis, sin config) | Medio | 🔴 Crítico |
| 3 | Botón traducir prompt (Chrome Translator API) | Bajo | 🔴 Crítico |
| 4 | Descargar audio MP3 por escena y completo | Medio | 🔴 Crítico |
| 5 | Estimador de duración de texto automático | Bajo | 🟠 Alto |
| 6 | Selector de voz con preview | Medio | 🟠 Alto |
| 7 | TTS Google Cloud como upgrade (calidad alta) | Medio | 🟠 Alto |
| 8 | Sugerencias de música/SFX por escena | Bajo | 🟠 Alto |
| 9 | Checklist de producción por escena | Bajo | 🟠 Alto |
| 10 | Narración continua (modo guión completo) | Medio | 🟡 Medio |
| 11 | Shot list exportable PDF/MD | Medio | 🟡 Medio |
| 12 | Storyboard imprimible (PDF layout 3x2) | Alto | 🟡 Medio |
| 13 | Preview multi-formato (16:9, 9:16, 1:1) | Medio | 🟡 Medio |
| 14 | Duplicar proyecto completo | Bajo | 🟡 Medio |
| 15 | Templates de proyecto (30s, 15s, 60s, 90s) | Medio | 🟡 Medio |
| 16 | Color script / mood board automático | Medio | 🟢 Nice-to-have |
| 17 | ElevenLabs/OpenAI TTS como premium | Medio | 🟢 Nice-to-have |

---

*Kiyoko AI — Mejoras v5 · Narración, Voces, Traducción y Producción · 17 marzo 2026*
