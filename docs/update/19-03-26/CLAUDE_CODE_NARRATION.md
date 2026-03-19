# INSTRUCCIONES PARA CLAUDE CODE — Sistema de Narración y Voz de Kiyoko AI

## CONTEXTO DEL PROYECTO

**Stack:** Next.js 16.1 · Supabase (PostgreSQL 17) · Tailwind CSS v4 · Vercel AI SDK 6 · Zustand · TypeScript estricto
**Repo:** El proyecto ya existe y funciona. Estamos AÑADIENDO una nueva feature.
**API key necesaria:** `ELEVENLABS_API_KEY` en `.env.local`
**Paquete a instalar:** `npm install elevenlabs`

Lee la documentación completa del proyecto en `KIYOKO_AI_DOCUMENTACION_COMPLETA.md` para entender la estructura existente de archivos, stores, API routes y patrones. Sigue EXACTAMENTE los mismos patrones que el resto de la app.

---

## QUÉ VAMOS A CONSTRUIR

Una página `/project/[slug]/narration` donde el usuario puede:
1. Ver todas las escenas del proyecto con su estado de narración
2. Escribir o generar con IA el texto de narración de cada escena
3. Seleccionar voz, estilo y configuración en un sidebar lateral
4. Generar audio con ElevenLabs (escena por escena o todo de golpe)
5. Previsualizar el audio con un reproductor inline (waveform + controles)
6. Descargar como MP3 (individual o ZIP)
7. Cancelar la generación en cualquier momento
8. Subir audio propio (upload manual)
9. El audio se sube a Supabase Storage y se asocia a la escena en la BD

---

## PASO 1: MIGRACIÓN DE BASE DE DATOS

Crear archivo `supabase/migrations/XXXXXX_narration_system.sql`:

```sql
-- Nuevos campos en scenes para narración avanzada
ALTER TABLE scenes
  ADD COLUMN IF NOT EXISTS narration_status VARCHAR(20) DEFAULT 'no_text'
    CHECK (narration_status IN ('no_text','has_text','silence','generating','generated','uploaded','error','cancelled')),
  ADD COLUMN IF NOT EXISTS narration_voice_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS narration_voice_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS narration_style VARCHAR(50)
    CHECK (narration_style IN ('documentary','cartoon','pixar','epic','asmr','commercial','kids','thriller','custom')),
  ADD COLUMN IF NOT EXISTS narration_speed FLOAT DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS narration_audio_path TEXT,
  ADD COLUMN IF NOT EXISTS narration_metadata JSONB DEFAULT '{}';

-- Los campos narration_text, narration_audio_url, narration_audio_duration_ms YA EXISTEN en scenes

-- Nuevos campos en projects para narración global
-- Los campos narration_mode, narration_config, narration_full_text, narration_full_audio_url YA EXISTEN en projects

-- Tabla de historial de narraciones
CREATE TABLE IF NOT EXISTS narration_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  narration_text TEXT,
  audio_url TEXT,
  audio_path TEXT,
  audio_duration_ms INTEGER,
  voice_id VARCHAR(100),
  voice_name VARCHAR(100),
  style VARCHAR(50),
  speed FLOAT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_narration_history_scene ON narration_history(scene_id);
CREATE INDEX IF NOT EXISTS idx_narration_history_project ON narration_history(project_id);

-- RLS
ALTER TABLE narration_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "narration_history_owner" ON narration_history FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()));

CREATE POLICY "narration_history_admin" ON narration_history FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Bucket de Storage para audio de narración
-- (ejecutar manualmente en Supabase Dashboard > Storage > New Bucket)
-- Nombre: narration-audio
-- Public: true
-- File size limit: 50MB
-- Allowed MIME types: audio/mpeg, audio/mp3, audio/wav, audio/ogg
```

---

## PASO 2: CONFIGURACIÓN DE ESTILOS DE NARRACIÓN

Crear archivo `src/lib/narration/styles.ts`:

```typescript
export type NarrationStyle = 
  | 'documentary' | 'cartoon' | 'pixar' | 'epic' 
  | 'asmr' | 'commercial' | 'kids' | 'thriller' | 'custom';

export interface NarrationStyleConfig {
  id: NarrationStyle;
  name: string;
  description: string;
  icon: string;
  aiPrompt: string; // Instrucciones para que la IA de texto escriba el guión
  elevenLabsSettings: {
    stability: number;      // 0.0 a 1.0
    similarity_boost: number; // 0.0 a 1.0
    style: number;           // 0.0 a 1.0 (style exaggeration)
    speed: number;           // 0.7 a 1.3
  };
  recommendedVoiceIds: string[];
}

export const NARRATION_STYLES: Record<NarrationStyle, NarrationStyleConfig> = {
  documentary: {
    id: 'documentary',
    name: 'Narrador Documental',
    description: 'Voz seria, informativa, ritmo pausado. Como National Geographic.',
    icon: '🎬',
    aiPrompt: `Escribe la narración como un documental profesional. Tono serio e informativo.
Usa frases cortas y contundentes. Incluye pausas dramáticas entre ideas importantes.
NO uses exclamaciones. Sé objetivo y descriptivo. Vocabulario culto pero accesible.
Cada escena debe narrar lo que se VE en pantalla, no lo que se siente.`,
    elevenLabsSettings: { stability: 0.7, similarity_boost: 0.8, style: 0.3, speed: 0.95 },
    recommendedVoiceIds: ['TxGEqnHWrfWFTfGW9XjX', 'ErXwobaYiN019PkySvjV'],
  },
  cartoon: {
    id: 'cartoon',
    name: 'Cartoon / Animación',
    description: 'Voz exagerada, divertida, expresiva. Como un dibujo animado.',
    icon: '🎪',
    aiPrompt: `Escribe la narración como un dibujo animado. ¡Energía al máximo!
Exagera las emociones. Usa exclamaciones y onomatopeyas. Sé juguetón y sorprendente.
Las frases deben ser cortas y punchy. Incluye momentos de asombro ("¡Woooow!").
Haz que suene como el narrador de un cartoon de los sábados por la mañana.`,
    elevenLabsSettings: { stability: 0.3, similarity_boost: 0.7, style: 0.8, speed: 1.1 },
    recommendedVoiceIds: ['MF3mGyEYCl7XYWbV9V6O'],
  },
  pixar: {
    id: 'pixar',
    name: 'Pixar / Emotivo',
    description: 'Voz cálida, con emoción contenida. Como un trailer de Pixar.',
    icon: '✨',
    aiPrompt: `Escribe la narración como un trailer de película Pixar. Cálido y emotivo.
Empieza con una frase gancho que genere curiosidad. Construye emoción gradualmente.
Usa metáforas sencillas pero poderosas. El tono debe evocar nostalgia y esperanza.
Incluye UN momento de silencio dramático entre el clímax y el cierre.
Las últimas palabras deben ser memorables, como un eslogan que se queda en la mente.`,
    elevenLabsSettings: { stability: 0.5, similarity_boost: 0.8, style: 0.6, speed: 1.0 },
    recommendedVoiceIds: ['EXAVITQu4vr4xnSDxMaL', 'TxGEqnHWrfWFTfGW9XjX'],
  },
  epic: {
    id: 'epic',
    name: 'Épico / Cinemático',
    description: 'Voz grave, dramática. Como un trailer de película de acción.',
    icon: '⚔️',
    aiPrompt: `Escribe la narración como un trailer de película épica. Voz profunda y dramática.
Frases cortas y contundentes con peso. Pausas largas entre frases para dar gravedad.
Usa palabras poderosas: destino, lucha, honor, verdad, sacrificio.
Construye tensión que explota al final. El cierre debe ser una frase de impacto absoluto.`,
    elevenLabsSettings: { stability: 0.6, similarity_boost: 0.9, style: 0.5, speed: 0.9 },
    recommendedVoiceIds: ['pNInz6obpgDQGcFmaJgB', 'ErXwobaYiN019PkySvjV'],
  },
  asmr: {
    id: 'asmr',
    name: 'ASMR / Susurro',
    description: 'Voz suave, íntima, muy cercana. Como si hablaras al oído.',
    icon: '🌙',
    aiPrompt: `Escribe la narración como un susurro íntimo. Muy suave y personal.
Frases cortas y delicadas. Cada palabra debe sonar como un secreto compartido.
NO uses exclamaciones. Tono meditativo y tranquilo. Ritmo muy lento.
Describe texturas y sensaciones: "suave", "cálido", "delicado", "preciso".`,
    elevenLabsSettings: { stability: 0.8, similarity_boost: 0.9, style: 0.2, speed: 0.8 },
    recommendedVoiceIds: ['EXAVITQu4vr4xnSDxMaL'],
  },
  commercial: {
    id: 'commercial',
    name: 'Comercial / Energético',
    description: 'Voz fuerte, rápida, motivadora. Como un anuncio de TV.',
    icon: '📢',
    aiPrompt: `Escribe la narración como un anuncio de TV profesional. Energético y positivo.
Empieza con un problema o pregunta ("¿Buscas...?"). Presenta la solución con entusiasmo.
Incluye beneficios concretos. Ritmo rápido y dinámico. Termina con una llamada a la acción
clara y directa: "Visítanos", "Llama ahora", "Descúbrelo".`,
    elevenLabsSettings: { stability: 0.5, similarity_boost: 0.7, style: 0.7, speed: 1.15 },
    recommendedVoiceIds: ['21m00Tcm4TlvDq8ikWAM', 'ErXwobaYiN019PkySvjV'],
  },
  kids: {
    id: 'kids',
    name: 'Infantil',
    description: 'Voz dulce, simple, clara. Para público infantil.',
    icon: '🧸',
    aiPrompt: `Escribe la narración para niños de 5-8 años. Vocabulario simple y claro.
Tono dulce y lleno de asombro. Usa muchas preguntas ("¿Sabes qué pasó?").
Frases muy cortas. Repite ideas importantes. Incluye sonidos divertidos entre líneas.
Haz que el niño quiera saber qué pasa después.`,
    elevenLabsSettings: { stability: 0.4, similarity_boost: 0.7, style: 0.6, speed: 0.9 },
    recommendedVoiceIds: ['MF3mGyEYCl7XYWbV9V6O'],
  },
  thriller: {
    id: 'thriller',
    name: 'Misterioso / Thriller',
    description: 'Voz baja, tensa, con suspense. Algo oscuro acecha.',
    icon: '🔮',
    aiPrompt: `Escribe la narración como un thriller. Voz baja y tensa.
Construye misterio con preguntas sin respuesta. Frases incompletas que dejan en suspenso.
Usa palabras oscuras: sombra, secreto, peligro, silencio, acecho.
El ritmo debe ser irregular: frases largas seguidas de una palabra sola. Impactante.`,
    elevenLabsSettings: { stability: 0.6, similarity_boost: 0.8, style: 0.4, speed: 0.9 },
    recommendedVoiceIds: ['pNInz6obpgDQGcFmaJgB'],
  },
  custom: {
    id: 'custom',
    name: 'Personalizado',
    description: 'Define tus propias instrucciones de estilo.',
    icon: '🎨',
    aiPrompt: '', // Se usa customInstructions del usuario
    elevenLabsSettings: { stability: 0.5, similarity_boost: 0.75, style: 0.5, speed: 1.0 },
    recommendedVoiceIds: [],
  },
};
```

---

## PASO 3: ZUSTAND STORE

Crear archivo `src/stores/useNarrationStore.ts`.

Este store gestiona TODO el estado de la página de narración:

```typescript
import { create } from 'zustand';

interface NarrationScene {
  sceneId: string;
  sceneNumber: string;
  title: string;
  description: string;
  durationSeconds: number;
  narrationText: string | null;
  narrationStatus: 'no_text' | 'has_text' | 'silence' | 'generating' | 'generated' | 'uploaded' | 'error' | 'cancelled';
  narrationAudioUrl: string | null;
  narrationAudioDurationMs: number | null;
  narrationVoiceId: string | null;
  narrationVoiceName: string | null;
  narrationStyle: string | null;
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  labels: Record<string, string>; // { accent, gender, age, description, use_case }
  preview_url: string;
  category: string;
}

interface NarrationStore {
  // --- Config del sidebar ---
  mode: 'per_scene' | 'full_video';
  selectedVoiceId: string | null;
  selectedVoiceName: string | null;
  selectedStyle: NarrationStyle;
  speed: number;           // 0.7 a 1.3
  stability: number;       // 0 a 1
  similarity: number;      // 0 a 1
  language: string;        // 'es', 'en', etc.
  customInstructions: string;

  // --- Voces disponibles ---
  voices: ElevenLabsVoice[];
  voicesLoading: boolean;

  // --- Escenas ---
  scenes: NarrationScene[];
  scenesLoading: boolean;

  // --- Generación ---
  generatingSceneIds: Set<string>;
  batchProgress: { current: number; total: number } | null;
  abortControllers: Map<string, AbortController>;

  // --- Audio completo del video ---
  fullAudioUrl: string | null;
  fullAudioDurationMs: number | null;
  fullText: string | null;

  // --- Reproductor ---
  playingSceneId: string | null;
  isPlaying: boolean;

  // --- Setters ---
  setMode: (mode: 'per_scene' | 'full_video') => void;
  setVoice: (voiceId: string, voiceName: string) => void;
  setStyle: (style: NarrationStyle) => void;
  setSpeed: (speed: number) => void;
  setStability: (stability: number) => void;
  setSimilarity: (similarity: number) => void;
  setLanguage: (lang: string) => void;
  setCustomInstructions: (text: string) => void;

  // --- Data fetching ---
  fetchScenes: (projectId: string) => Promise<void>;
  fetchVoices: () => Promise<void>;

  // --- Generación ---
  generateForScene: (sceneId: string, text: string) => Promise<void>;
  generateBatch: (projectId: string) => Promise<void>;
  generateFullVideo: (projectId: string) => Promise<void>;
  cancelGeneration: (sceneId: string) => void;
  cancelAllGenerations: () => void;

  // --- Texto ---
  updateNarrationText: (sceneId: string, text: string) => void;
  markAsSilence: (sceneId: string) => void;
  unmarkSilence: (sceneId: string) => void;
  generateTextsWithAI: (projectId: string) => Promise<void>;

  // --- Audio ---
  deleteNarration: (sceneId: string) => Promise<void>;
  deleteAllNarrations: (projectId: string) => Promise<void>;
  uploadAudio: (sceneId: string, file: File) => Promise<void>;

  // --- Reproductor ---
  playScene: (sceneId: string) => void;
  stopPlaying: () => void;

  // --- Descargas ---
  downloadScene: (sceneId: string, sceneName: string) => void;
  downloadAllAsZip: (projectTitle: string) => Promise<void>;

  // --- Reset ---
  reset: () => void;
}
```

IMPLEMENTA todas las funciones. Sigue el patrón de `useProjectStore` y `useKiyokoChat` existentes en la app para la estructura y manejo de errores.

Para `generateForScene`:
1. Crear AbortController y guardarlo en `abortControllers`
2. Marcar sceneId como 'generating' en el store
3. POST a `/api/ai/generate-narration` con signal del AbortController
4. Si OK → actualizar escena como 'generated' con la URL del audio
5. Si error AbortError → marcar como 'cancelled'
6. Si error otro → marcar como 'error'
7. Limpiar AbortController

Para `generateBatch`:
1. Filtrar escenas que tienen texto pero no audio (status 'has_text')
2. Si alguna no tiene texto, primero llamar a `generateTextsWithAI`
3. Crear un AbortController global
4. Hacer fetch SSE a `/api/ai/generate-narration-batch`
5. Parsear cada evento SSE y actualizar la escena correspondiente en el store
6. Actualizar `batchProgress` con cada evento

Para `cancelGeneration`:
1. Buscar el AbortController del sceneId en el Map
2. Llamar `.abort()`
3. Actualizar estado de la escena a 'cancelled'

Para `downloadAllAsZip`:
1. Importar JSZip dinámicamente (`const JSZip = (await import('jszip')).default`)
2. Para cada escena con audio, hacer fetch del audio URL y añadir al ZIP
3. Añadir también un archivo `guion.txt` con todos los textos
4. Generar el ZIP como blob y descargarlo

---

## PASO 4: API ROUTES

### 4.1 Ruta: `app/api/ai/generate-narration/route.ts`

Genera audio para UNA escena con ElevenLabs.

```
POST /api/ai/generate-narration
Body: {
  text: string,           // Texto a narrar
  voiceId: string,        // ID de voz de ElevenLabs
  sceneId: string,        // ID de la escena
  projectId: string,      // ID del proyecto
  style: NarrationStyle,  // Estilo de narración
  speed?: number,         // 0.7-1.3 (default 1.0)
  stability?: number,     // 0-1 (default 0.5)
  similarity?: number,    // 0-1 (default 0.75)
}
Response: {
  audioUrl: string,       // URL pública del audio en Supabase
  audioPath: string,      // Path en Storage (para borrar)
  durationMs: number,     // Duración en ms
}
```

Implementación:
1. Verificar auth con `createClient(req)` y `supabase.auth.getUser()`
2. Validar que el texto no esté vacío y el sceneId exista
3. Obtener la API key: primero de `process.env.ELEVENLABS_API_KEY`, si no existe, buscar key del usuario en `user_api_keys` y descifrarla
4. Instanciar ElevenLabs client: `new ElevenLabsClient({ apiKey })`
5. Llamar a `client.textToSpeech.convert(voiceId, { text, model_id: 'eleven_multilingual_v2', voice_settings: { stability, similarity_boost, style: styleExaggeration } })`
6. El resultado es un ReadableStream. Recoger todos los chunks en un Buffer.
7. Calcular duración del audio. Método simple: `(audioBuffer.length * 8) / (128 * 1000)` para MP3 128kbps, resultado en ms. Para más precisión, usar un parser de MP3 headers.
8. Subir a Supabase Storage: bucket `narration-audio`, path `{projectId}/narration/{sceneId}/{Date.now()}.mp3`
9. Obtener URL pública
10. Actualizar `scenes` en la BD: narration_audio_url, narration_audio_path, narration_audio_duration_ms, narration_status='generated', narration_voice_id, narration_voice_name, narration_style, narration_speed, narration_metadata
11. Insertar registro en `narration_history`
12. Devolver `{ audioUrl, audioPath, durationMs }`

### 4.2 Ruta: `app/api/ai/generate-narration-batch/route.ts`

Genera audio para MÚLTIPLES escenas con SSE para mostrar progreso.

```
POST /api/ai/generate-narration-batch
Body: {
  projectId: string,
  scenes: Array<{ sceneId: string, text: string }>,
  voiceId: string,
  style: NarrationStyle,
  speed?: number,
  stability?: number,
  similarity?: number,
}
Response: SSE stream con eventos:
  data: { type: 'generating', sceneId, index, total }
  data: { type: 'completed', sceneId, audioUrl, durationMs, index, total }
  data: { type: 'error', sceneId, error, index, total }
  data: { type: 'done', completed, failed, total }
```

Implementación:
1. Verificar auth
2. Crear un ReadableStream con SSE
3. Para cada escena en el array:
   a. Enviar evento `generating` al stream
   b. Generar audio con ElevenLabs (misma lógica que la ruta individual)
   c. Si OK → enviar evento `completed` con audioUrl y durationMs
   d. Si error → enviar evento `error` con mensaje
   e. Esperar 200ms entre escenas para no saturar la API de ElevenLabs
4. Al terminar todas → enviar evento `done`
5. Cerrar el stream

IMPORTANTE: Incluir header `Content-Type: text/event-stream` y `Cache-Control: no-cache`.

### 4.3 Ruta: `app/api/ai/generate-narration-text/route.ts`

La IA genera los textos de narración para las escenas que no tienen texto. NO genera audio, solo texto.

```
POST /api/ai/generate-narration-text
Body: {
  projectId: string,
  style: NarrationStyle,
  customInstructions?: string,
  sceneIds?: string[],  // Si vacío, genera para todas las que no tienen texto
}
Response: {
  scenes: Array<{ sceneId: string, text: string, isSilence: boolean }>
}
```

Implementación:
1. Cargar todas las escenas del proyecto de Supabase (igual que hace `/api/ai/chat`)
2. Cargar los personajes y fondos para contexto
3. Construir un prompt para la IA de TEXTO (Groq/Gemini, NO ElevenLabs):

```
Eres Kiyoko, directora creativa. Genera el texto de narración para las escenas de un video.

PROYECTO: {title}
ESTILO VISUAL: {style}
PLATAFORMA: {platform}
DURACIÓN: {duration}s

ESTILO DE NARRACIÓN: {NARRATION_STYLES[style].aiPrompt}

{customInstructions ? `INSTRUCCIONES ADICIONALES: ${customInstructions}` : ''}

ESCENAS:
{scenes.map(s => `
[${s.scene_number}] ${s.title} (${s.duration_seconds}s)
Descripción: ${s.description}
Fase: ${s.arc_phase}
Personajes: ${s.character_ids}
Fondo: ${s.background_id}
`).join('\n')}

REGLAS:
1. Genera texto de narración SOLO para las escenas que lo necesiten
2. Algunas escenas pueden ser SILENCIO (escenas puramente visuales, sin narración)
3. El texto debe caber en la duración de la escena (aprox 2-3 palabras por segundo)
4. Adapta el tono al estilo de narración seleccionado
5. Mantén coherencia narrativa entre escenas
6. NO incluyas indicaciones de audio como [PAUSA], eso se gestiona automáticamente

FORMATO DE RESPUESTA (JSON estricto, sin markdown):
[
  { "sceneId": "uuid", "text": "Texto de narración", "isSilence": false },
  { "sceneId": "uuid", "text": "", "isSilence": true }
]
```

4. Usar la cadena de fallback de providers de texto existente (Groq → Gemini → Mistral...)
5. Parsear la respuesta JSON
6. Actualizar cada escena en la BD: `narration_text` y `narration_status` ('has_text' o 'silence')
7. Devolver los textos generados

### 4.4 Ruta: `app/api/ai/voices/route.ts`

Lista las voces disponibles de ElevenLabs.

```
GET /api/ai/voices
Response: {
  voices: Array<{
    voice_id: string,
    name: string,
    labels: { accent, gender, age, description, use_case },
    preview_url: string,
    category: string,
  }>
}
```

Implementación:
1. Llamar a `client.voices.getAll()` de ElevenLabs
2. Filtrar para devolver solo las voces útiles (excluir voces de clonación privadas si las hay)
3. Cachear el resultado 1 hora (las voces no cambian frecuentemente). Usar `globalThis` para caché como los cooldowns de providers.

### 4.5 Ruta: `app/api/narration/upload/route.ts`

Upload manual de un archivo de audio.

```
POST /api/narration/upload
Body: FormData con:
  - file: File (audio/mpeg, audio/wav)
  - sceneId: string
  - projectId: string
Response: {
  audioUrl: string,
  audioPath: string,
  durationMs: number,
}
```

### 4.6 Ruta: `app/api/narration/[sceneId]/route.ts`

```
DELETE /api/narration/[sceneId]
```

Borra el audio de una escena: eliminar archivo de Storage + limpiar campos en `scenes`.

---

## PASO 5: PÁGINA Y COMPONENTES

### Estructura de archivos a crear

```
src/
├── app/project/[slug]/narration/
│   └── page.tsx                          ← Página principal
├── components/narration/
│   ├── NarrationPage.tsx                 ← Layout (sidebar + content + chat)
│   ├── NarrationHeader.tsx               ← Stats bar (N con audio, N sin, progreso)
│   ├── NarrationSidebar.tsx              ← Sidebar izquierdo completo
│   │   ├── VoiceSelector.tsx             ← Lista de voces con preview
│   │   ├── StyleSelector.tsx             ← Grid de estilos
│   │   ├── SpeedSlider.tsx               ← Slider de velocidad
│   │   └── NarrationSidebarActions.tsx   ← Botones: generar todo, cancelar, descargar
│   ├── NarrationSceneList.tsx            ← Lista scrollable de escenas
│   ├── NarrationSceneCard.tsx            ← Card individual de escena
│   ├── NarrationTextEditor.tsx           ← Textarea editable para texto de narración
│   ├── NarrationAudioPlayer.tsx          ← Reproductor con waveform
│   ├── NarrationStatusBadge.tsx          ← Badge de estado (color + icono)
│   ├── NarrationEmptyState.tsx           ← Estado vacío con 4 opciones
│   ├── NarrationBatchProgress.tsx        ← Overlay/banner de progreso batch
│   ├── NarrationGeneratingState.tsx      ← Spinner + barra de progreso inline
│   └── WaveformVisualizer.tsx            ← Forma de onda con Web Audio API
├── stores/
│   └── useNarrationStore.ts              ← Zustand store (paso 3)
└── lib/narration/
    ├── styles.ts                         ← Configuración de estilos (paso 2)
    └── utils.ts                          ← Helpers (duración, slugify, etc.)
```

### Página principal: `app/project/[slug]/narration/page.tsx`

- Usa el mismo layout que las otras páginas del proyecto (sidebar de navegación del proyecto a la izquierda)
- Añadir "Narración" como item en la sidebar del proyecto (entre "Exportar" y "Ajustes" en el sidebar existente, con icono 🎙️)
- Al montar: cargar escenas del proyecto + cargar voces de ElevenLabs
- Layout: `flex` con `NarrationSidebar` (280px, fijo) + área principal (flex-1, scroll)
- El panel de chat IA existente de Kiyoko se puede abrir/cerrar como en cualquier otra página

### NarrationSidebar.tsx

Panel lateral izquierdo DENTRO de la página de narración (no confundir con el sidebar de navegación del proyecto). Ancho fijo 280px, scroll vertical independiente.

Secciones (de arriba a abajo):
1. **Modo**: Radio buttons "Por escena" / "Video completo"
2. **Voz**: Lista scrollable de VoiceCards con botón preview (reproducir sample de la voz). Cada card muestra nombre, idioma, género, y un botón ▶ para escuchar 3 segundos de preview.
3. **Estilo**: Grid 2×4 de botones con icono y nombre de cada estilo. El seleccionado tiene borde primario.
4. **Velocidad**: Slider de 0.7 a 1.3 con valor numérico visible.
5. **Instrucciones custom**: Textarea que aparece SOLO si el estilo es "custom" o si el usuario quiere añadir instrucciones extra a cualquier estilo.
6. **Acciones**: Botones apilados verticalmente:
   - `🤖 Generar Todo` (primario, prominente)
   - `⏹ Cancelar Todo` (solo visible si hay generación activa)
   - `⏬ Descargar ZIP`
   - `🗑 Borrar Todo`

Usa los mismos colores y estilos de UI que el resto de la app (Tailwind CSS v4, dark mode, variables CSS existentes).

### NarrationSceneCard.tsx

Una card por escena. Muestra:
- Número de escena, título, duración, fase (badge de color)
- `NarrationStatusBadge` arriba a la derecha
- `NarrationTextEditor`: textarea con el texto de narración. Editable inline. Debajo: contador de caracteres + botón [🤖 Generar texto con IA] que llama a la API de texto para esa sola escena.
- Si hay audio: `NarrationAudioPlayer` con controles
- Si no hay audio: botones [🤖 Generar Audio] [📤 Subir MP3] [⬜ Marcar silencio]
- Si está generando: `NarrationGeneratingState` con barra de progreso y botón cancelar
- Si hay error: mensaje de error en rojo con botón [🔄 Reintentar]
- Botones de acción (solo si hay audio): [🔄 Regenerar] [🎤 Otra voz] [⏬ MP3] [🗑 Borrar]

### NarrationAudioPlayer.tsx

Reproductor de audio reutilizable. Props: `audioUrl: string`, `durationMs: number`.

Funcionalidades:
- Play/Pause con icono ▶/⏸ (click o tecla Space)
- Barra de progreso clickable (seek)
- Tiempo actual / tiempo total
- Control de volumen (slider pequeño)
- Botones de velocidad: 0.7x, 0.8x, 1.0x, 1.1x, 1.2x
- `WaveformVisualizer`: forma de onda estática generada a partir del audio

Para la forma de onda, usa Web Audio API:
```typescript
const audioContext = new AudioContext();
const response = await fetch(audioUrl);
const arrayBuffer = await response.arrayBuffer();
const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
const rawData = audioBuffer.getChannelData(0);
// Samplear a ~80 barras para la visualización
// Renderizar como divs con height proporcional al valor
```

Renderizar como una fila de divs con `height` variable, background primario. Al reproducir, las barras ya reproducidas cambian a color más intenso (como un progreso visual).

### NarrationEmptyState.tsx

Se muestra cuando el video no tiene NINGUNA narración. 4 cards clickeables:

1. **🤖 Generar con IA** — Abre el chat lateral con un prompt pre-escrito: "Quiero generar la narración para todo el video con estilo {selectedStyle}. Escribe los textos y genera los audios."
2. **✏️ Escribir manualmente** — Enfoca el textarea de la primera escena
3. **📤 Subir audio** — Abre file picker para un MP3
4. **🎯 Escena por escena** — Scrollea a la primera escena y enfoca su textarea

### NarrationBatchProgress.tsx

Banner flotante que aparece en la parte inferior de la página cuando hay una generación batch en progreso:

```
┌──────────────────────────────────────────────────────────────┐
│ 🎙️ Generando narración · 8/22 escenas                       │
│ [████████████░░░░░░░░░░░░░░░░] 36%    ⏱ ~45s    [⏹ Cancelar]│
└──────────────────────────────────────────────────────────────┘
```

Posición fija en el bottom de la pantalla, con `backdrop-blur`, z-index alto. Anima la barra de progreso. Muestra tiempo estimado restante (promedio de tiempo por escena × escenas restantes).

---

## PASO 6: INTEGRACIÓN CON EL CHAT IA EXISTENTE

Cuando el usuario está en la página de narración y abre el chat de Kiyoko, el system prompt debe incluir contexto de narración.

Añadir al system prompt (en `/api/ai/chat/route.ts`), cuando la URL actual incluya `/narration`:

```
═══ CONTEXTO DE NARRACIÓN ═══
El usuario está en la página de narración del video "{videoTitle}".
Escenas con narración: {withAudio}/{totalScenes}
Estilo seleccionado: {selectedStyle}
Voz seleccionada: {selectedVoiceName}

Puedes ayudar al usuario a:
1. Escribir textos de narración para escenas específicas
2. Reescribir textos en otro tono o estilo
3. Generar narración para todo el video
4. Sugerir qué escenas deberían tener narración y cuáles silencio
5. Ajustar la duración del texto para que encaje en la escena

Cuando generes textos de narración, devuélvelos en un action_plan con type "update_narration":
{
  "type": "action_plan",
  "actions": [
    { "type": "update_narration", "sceneId": "uuid", "narrationText": "texto...", "isSilence": false }
  ]
}
```

Añadir una nueva Quick Action al chat (la #13):
```
| 13 | Generar narración | 🎙️ | "Genera textos de narración para todas las escenas del video que no tengan texto. Usa el estilo {selectedStyle}." |
```

---

## PASO 7: AÑADIR A LA SIDEBAR DE NAVEGACIÓN

En el componente de sidebar del proyecto (el que muestra Overview, Storyboard, etc.), añadir un nuevo item:

```typescript
{
  label: 'Narración',
  icon: Mic, // de lucide-react
  href: `/project/${slug}/narration`,
}
```

Colocarlo DESPUÉS de "Timeline" y ANTES de "Chat IA" en el orden de la sidebar.

---

## COMPORTAMIENTO DE CANCELACIÓN

Esto es CRÍTICO. El usuario debe poder cancelar en cualquier momento:

1. **Cancelar UNA escena**: Click en [⏹ Cancelar] de la escena → `controller.abort()` → estado 'cancelled' → mostrar [🔄 Reintentar]

2. **Cancelar TODO el batch**: Click en [⏹ Cancelar] del banner de progreso → Abortar el fetch SSE → Las escenas ya completadas se MANTIENEN → Las pendientes quedan como estaban → Banner desaparece con resumen: "8 completadas, 14 canceladas"

3. **Cerrar la página mientras genera**: `beforeunload` warning → Si acepta cerrar: las completadas se mantienen (ya están en Supabase), las en proceso se pierden

4. **Cambiar de voz/estilo durante batch**: NO cancelar automáticamente. Mostrar aviso: "¿Quieres aplicar la nueva voz a las escenas pendientes?" [Sí] [No, solo a futuras generaciones]

---

## ESTILOS CSS / TAILWIND

Usa los MISMOS patrones de CSS que el resto de la app. Revisa `globals.css` para las variables de color y los estilos de dark/light mode. La app usa dark mode como default.

Para el waveform, usa divs con `bg-primary/40` para barras no reproducidas y `bg-primary` para las ya reproducidas. Height variable con `style={{ height: `${value * 100}%` }}`.

Para la barra de progreso del batch, usa el mismo patrón de barra de progreso que ya existe en el overview del proyecto (`completion_percentage`).

---

## CHECKLIST DE FUNCIONALIDADES

Antes de dar por terminado, verifica que TODO esto funciona:

- [ ] La página se carga y muestra las escenas del proyecto
- [ ] Las voces de ElevenLabs se cargan en el sidebar
- [ ] Se puede hacer click en el preview de una voz y suena un sample
- [ ] Se puede seleccionar estilo y los parámetros cambian
- [ ] Se puede escribir texto de narración en una escena y se guarda en Supabase
- [ ] Click en [🤖 Generar texto con IA] genera texto para UNA escena
- [ ] Click en [🤖 Generar Audio] genera audio con ElevenLabs para UNA escena
- [ ] Mientras genera, se muestra barra de progreso con spinner
- [ ] Se puede CANCELAR la generación y el estado cambia a 'cancelled'
- [ ] El audio generado se puede reproducir con el player inline
- [ ] La forma de onda se visualiza correctamente
- [ ] Se puede cambiar la velocidad de reproducción
- [ ] Click en [⏬ MP3] descarga el audio de esa escena
- [ ] Click en [🔄 Regenerar] genera un audio nuevo (el anterior se guarda en historial)
- [ ] Click en [🗑 Borrar] elimina el audio de Storage y limpia la BD
- [ ] Click en [📤 Subir MP3] abre file picker y sube audio manual
- [ ] Click en [⬜ Marcar silencio] marca la escena como silencio
- [ ] Click en [🤖 Generar Todo] en el sidebar genera textos + audios para TODAS las escenas
- [ ] El batch muestra progreso con SSE (banner inferior)
- [ ] Se puede cancelar el batch completo
- [ ] Click en [⏬ Descargar ZIP] descarga un ZIP con todos los MP3s + guión TXT
- [ ] El estado vacío se muestra cuando no hay narración
- [ ] Los 4 botones del estado vacío funcionan correctamente
- [ ] "Narración" aparece en la sidebar de navegación del proyecto
- [ ] La narración se asocia correctamente en la BD (narration_audio_url en scenes)
- [ ] Al recargar la página, los audios generados siguen ahí
- [ ] Si ElevenLabs falla, se muestra error claro con opción de reintentar
- [ ] El slider de velocidad funciona (0.7x a 1.3x)
- [ ] Se puede usar desde el chat: "genera narración para la escena 1 estilo Pixar"
