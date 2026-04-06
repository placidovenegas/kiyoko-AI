# Director Creativo IA — Documentación Técnica

## Stack B: Gemini (Ojos) + Qwen vía OpenRouter (Cerebro) + Voxtral (Voz)

### Resumen

App en Next.js que actúa como director creativo. No genera imágenes
ni vídeos — genera **prompts inteligentes** por escena + **narración
con voz**. El usuario copia los prompts a la herramienta que quiera
(Gemini Image, Runway, Kling, Pika, Midjourney…).

**Todos los proveedores son occidentales. Ningún dato pasa por China.**

```
═══════════════════════════════════════════════════════════
  STACK B — $0.022 por proyecto con audio
  100% proveedores occidentales
═══════════════════════════════════════════════════════════

  👁️ OJOS    → Gemini 2.5 Flash       ($0.15/M tokens)
               Google AI Studio (USA)
               Tier gratis ~500 req/día

  🧠 CEREBRO → Qwen3.5 Flash           ($0.065/M tokens)
               Qwen3.5 Plus            ($0.26/M tokens)
               Servido por OpenRouter (USA)
               Registro: solo email, sin DNI

  🎙️ VOZ     → Voxtral TTS (Mistral)   ($0.016/1K chars)
               Mistral (Francia)
               Clona voz con 3 seg de audio

═══════════════════════════════════════════════════════════
  Registro:
  • aistudio.google.com     → GEMINI_API_KEY
  • openrouter.ai           → OPENROUTER_API_KEY
  • console.mistral.ai      → MISTRAL_API_KEY
═══════════════════════════════════════════════════════════
```

### Flujo completo

```
1. Usuario describe el proyecto:
   "Anuncio anime 60s para peluquería"
        ↓
2. Qwen3.5 Flash genera storyboard con prompts:
   → Escena 1: prompt imagen + prompt vídeo (10s)
   → Escena 2: prompt imagen + prompt vídeo (10s)
   → ...
        ↓
3. Si sube imágenes/escenas existentes:
   → Gemini Flash las analiza (composición, mood, estilo)
   → Qwen3.5 Plus recibe el análisis y genera escenas
     nuevas que encajen entre medias
        ↓
4. Si pide consejos:
   → Qwen3.5 Plus analiza todo el storyboard
   → Da feedback creativo con propuestas concretas
        ↓
5. Narración:
   → Qwen3.5 Flash escribe el guion
   → Voxtral TTS genera las voces (clona si hay referencia)
        ↓
6. RESULTADO: Pack descargable
   - JSON del storyboard
   - Prompts copiables (imagen + vídeo por escena)
   - Audio MP3 de la narración
```

### Costes por proyecto

| Paso | Modelo | Coste |
|------|--------|-------|
| Generar storyboard 6 escenas | Qwen3.5 Flash | $0.0009 |
| Analizar 4 imágenes subidas | Gemini 2.5 Flash | $0.0021 |
| Insertar 2 escenas nuevas | Qwen3.5 Flash | $0.0011 |
| Dar consejos creativos | Qwen3.5 Plus | $0.0034 |
| Regenerar 2 escenas | Qwen3.5 Flash | $0.0010 |
| Generar guion narración | Qwen3.5 Flash | $0.0006 |
| TTS audio 60 segundos | Voxtral TTS | $0.0128 |
| **TOTAL** | | **$0.0219** |

---

## 1. Arquitectura Next.js

```
/app
  /api
    /generate-storyboard    → Qwen3.5 Flash: storyboard desde brief
    /analyze-scenes         → Gemini Flash: analiza imágenes subidas
    /insert-scenes          → Qwen3.5 Plus: genera escenas entre existentes
    /get-advice             → Qwen3.5 Plus: consejos creativos
    /edit-scene             → Qwen3.5 Flash: regenera 1 escena
    /generate-script        → Qwen3.5 Flash: escribe guion narración
    /generate-voice         → Voxtral TTS: genera audio
    /export-project         → Empaqueta JSON + prompts + audio
  /dashboard
    page.tsx
/lib
  /ai
    gemini-vision.ts        → Cliente Gemini (solo analizar imágenes)
    qwen-brain.ts           → Cliente Qwen3.5 (Flash + Plus)
    voxtral-tts.ts          → Cliente Voxtral TTS
    prompt-engine.ts        → Genera prompts creativos por escena
    scene-analyzer.ts       → Analiza + inserta escenas
    advisor.ts              → Da consejos y feedback creativo
    narration-engine.ts     → Genera guion + orquesta voces
  /templates
    styles.ts               → Estilos visuales (anime, pixar, realista…)
    narration-styles.ts     → Estilos de narración (épico, infantil…)
  /types
    storyboard.ts           → Tipos TypeScript
/components
  BriefInput.tsx
  StoryboardView.tsx
  SceneCard.tsx
  PromptDisplay.tsx
  SceneAnalyzer.tsx
  NarrationPlayer.tsx
  ExportPanel.tsx
```

---

## 2. Tipos TypeScript

```typescript
// lib/types/storyboard.ts

export interface Project {
  id: string;
  brief: string;
  style: StyleConfig;
  scenes: Scene[];
  narration?: NarrationConfig;
}

export interface StyleConfig {
  visual_style: string;        // "anime" | "pixar_3d" | "realistic" ...
  aspect_ratio: "16:9" | "9:16" | "1:1";
  color_palette?: string;
  reference_notes?: string;
}

export interface Scene {
  id: string;
  order: number;
  duration_seconds: number;
  description: string;
  camera_movement: string;
  transition: string;
  prompt_image: string;         // Prompt para 1 frame estático
  prompt_video: string;         // Prompt para clip de vídeo
  narration_text?: string;
  narration_voice?: string;
  is_new?: boolean;             // true si la IA la insertó
  reference_image_url?: string;
  analysis?: SceneAnalysis;
}

export interface SceneAnalysis {
  composition: string;
  subjects: string[];
  mood: string;
  colors: string[];
  style_detected: string;
  action: string;
  camera_angle: string;
  lighting: string;
  suggested_improvements: string[];
}

export interface NarrationConfig {
  style: "epic" | "warm" | "documentary" | "funny" | "dramatic" | "children";
  language: string;
  voices: VoiceConfig[];
}

export interface VoiceConfig {
  id: string;
  role: string;                // "narrator" | "character_1" ...
  voxtral_preset?: string;     // Voz preestablecida de Voxtral
  reference_audio_base64?: string;  // Para clonar voz
}

export interface NarrationSegment {
  scene_order: number;
  type: "narration" | "dialogue";
  voice_id: string;
  emotion: string;
  text: string;
  estimated_seconds: number;
  timing_note?: string;
}

export interface NarrationScript {
  segments: NarrationSegment[];
  voices_needed: { id: string; description: string; suggested_preset: string }[];
  total_duration_seconds: number;
  total_characters: number;
}
```

---

## 3. Clientes de IA

### 3.1 Gemini — Solo visión (los ojos)

```typescript
// lib/ai/gemini-vision.ts
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function analyzeImage(
  imageBase64: string,
  mimeType: string = "image/png"
): Promise<SceneAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          {
            text: `Analiza esta imagen en profundidad. Devuelve JSON:
{
  "composition": "Composición visual (ángulo, encuadre, profundidad)",
  "subjects": ["sujetos presentes"],
  "mood": "Atmósfera / estado de ánimo",
  "colors": ["colores dominantes"],
  "style_detected": "Estilo artístico (anime, realista, 3D...)",
  "action": "Qué está ocurriendo",
  "camera_angle": "Tipo de plano (general, medio, primer plano...)",
  "lighting": "Tipo de iluminación",
  "suggested_improvements": ["mejoras posibles"]
}
Responde SOLO el JSON.`,
          },
        ],
      },
    ],
    config: { responseMimeType: "application/json" },
  });

  return JSON.parse(response.text!);
}

export async function analyzeMultipleScenes(
  images: { base64: string; mimeType: string }[]
): Promise<SceneAnalysis[]> {
  return Promise.all(
    images.map((img) => analyzeImage(img.base64, img.mimeType))
  );
}
```

### 3.2 Qwen vía OpenRouter (USA) — Cerebro creativo

OpenRouter es un proveedor americano que sirve modelos Qwen en su propia
infraestructura. Registro solo con email en openrouter.ai. Sin DNI.
Tus datos no pasan por China.

```typescript
// lib/ai/qwen-brain.ts
import OpenAI from "openai";

const qwen = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
});

// Modelos disponibles en OpenRouter:
// "qwen/qwen3.5-flash-02-23"  → $0.065/M input (rápido, barato)
// "qwen/qwen3.5-plus-02-15"   → $0.26/M input (potente, analítico)

type QwenModel = "qwen/qwen3.5-flash-02-23" | "qwen/qwen3.5-plus-02-15";

export async function callQwen(
  systemPrompt: string,
  userMessage: string,
  model: QwenModel = "qwen/qwen3.5-flash-02-23",
  temperature: number = 0.8
): Promise<any> {
  const response = await qwen.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content!);
}
```

### 3.3 Voxtral TTS — Voz (narración)

```typescript
// lib/ai/voxtral-tts.ts

export async function generateVoice(
  text: string,
  voicePreset?: string,
  referenceAudioBase64?: string
): Promise<ArrayBuffer> {
  const body: Record<string, any> = {
    model: "voxtral-tts-2025-03-26",
    text,
    output_format: "mp3",
  };

  if (referenceAudioBase64) {
    body.voice_reference = {
      type: "base64",
      data: referenceAudioBase64,
      media_type: "audio/wav",
    };
  } else {
    body.voice = voicePreset || "mistral_adam";
  }

  const response = await fetch("https://api.mistral.ai/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Voxtral error: ${response.status}`);
  return response.arrayBuffer();
}
```

---

## 4. Motor de Prompts Creativos

```typescript
// lib/ai/prompt-engine.ts
import { callQwen } from "./qwen-brain";
import type { Scene, StyleConfig, Project } from "../types/storyboard";

const DIRECTOR_PROMPT = `
Eres un director creativo experto en storyboarding y generación de prompts
para IA (Midjourney, Gemini Image, Runway, Kling, Pika).

REGLAS PARA PROMPTS DE IMAGEN (1 frame por escena):
- Extremadamente descriptivo: sujeto, acción, composición, iluminación,
  colores, estilo, ángulo de cámara, fondo.
- Empieza siempre con el estilo ("Anime style, ...")
- Termina con calidad ("cinematic, 4K, detailed")
- Describe personajes completos cada vez (consistencia entre escenas)

REGLAS PARA PROMPTS DE VÍDEO (clip ~10s por escena):
- Empieza con movimiento de cámara ("Slow zoom into...")
- Describe la acción durante los 10 segundos
- Incluye transiciones naturales hacia la siguiente escena
- Detalles de ambiente: partículas, viento, luces, reflejos

DIRECCIÓN CINEMATOGRÁFICA:
- Varía ángulos: generales, medios, primeros planos
- Crea tensión narrativa: inicio → desarrollo → clímax → cierre
- Si es anuncio: primeros 3 segundos captan atención
- Alterna ritmos rápidos y pausas dramáticas

Responde SIEMPRE en JSON.`;

// ═══ GENERAR STORYBOARD COMPLETO ═══
export async function generateStoryboard(
  brief: string,
  style: StyleConfig,
  numScenes: number = 6,
  sceneDuration: number = 10
): Promise<{ title: string; synopsis: string; scenes: Scene[] }> {
  return callQwen(
    DIRECTOR_PROMPT,
    `BRIEF: "${brief}"
ESTILO: ${style.visual_style} | RATIO: ${style.aspect_ratio}
PALETA: ${style.color_palette || "la que mejor encaje"}
NOTAS: ${style.reference_notes || "ninguna"}
ESCENAS: ${numScenes} | DURACIÓN: ${sceneDuration}s cada una

Genera JSON:
{
  "title": "Título creativo",
  "synopsis": "Sinopsis 2 líneas",
  "scenes": [{
    "order": 1,
    "duration_seconds": ${sceneDuration},
    "description": "Qué ocurre",
    "camera_movement": "movimiento de cámara",
    "transition": "transición a siguiente",
    "prompt_image": "Prompt COMPLETO para 1 frame",
    "prompt_video": "Prompt COMPLETO para clip vídeo",
    "narration_text": "Texto narración en off"
  }]
}`,
    "qwen/qwen3.5-flash-02-23"
  );
}

// ═══ REGENERAR 1 ESCENA ═══
export async function regenerateScene(
  project: Project,
  sceneIndex: number,
  feedback: string
): Promise<Scene> {
  const scene = project.scenes[sceneIndex];
  const prev = project.scenes[sceneIndex - 1];
  const next = project.scenes[sceneIndex + 1];

  return callQwen(
    DIRECTOR_PROMPT,
    `PROYECTO: "${project.brief}" | ESTILO: ${project.style.visual_style}

ESCENA ANTERIOR: ${prev ? JSON.stringify(prev) : "Es la primera"}
ESCENA ACTUAL (regenerar): ${JSON.stringify(scene)}
ESCENA SIGUIENTE: ${next ? JSON.stringify(next) : "Es la última"}

FEEDBACK DEL USUARIO: "${feedback}"

Regenera SOLO esta escena. Mantén coherencia con las adyacentes.
Devuelve JSON con la escena completa.`,
    "qwen/qwen3.5-flash-02-23"
  );
}
```

---

## 5. Analizador de Escenas + Inserción

```typescript
// lib/ai/scene-analyzer.ts
import { analyzeMultipleScenes } from "./gemini-vision";
import { callQwen } from "./qwen-brain";
import type { Scene, StyleConfig, SceneAnalysis } from "../types/storyboard";

// ═══ ANALIZAR ESCENAS SUBIDAS (Gemini ve + Qwen interpreta) ═══
export async function analyzeUploadedScenes(
  images: { base64: string; mimeType: string }[]
): Promise<SceneAnalysis[]> {
  // Gemini analiza visualmente cada imagen
  return analyzeMultipleScenes(images);
}

// ═══ INSERTAR ESCENAS ENTRE LAS EXISTENTES ═══
export async function insertScenesBetween(
  existingScenes: Scene[],
  style: StyleConfig,
  userRules?: string
): Promise<{ analysis: string; updated_scenes: Scene[] }> {
  // Qwen3.5 Plus piensa y crea (tarea compleja → modelo grande)
  return callQwen(
    `Eres un director creativo y editor de vídeo experto.
Tu especialidad es analizar secuencias de escenas, detectar dónde
faltan transiciones, dónde el ritmo se rompe, y proponer escenas
nuevas que resuelvan estos problemas.

Cuando insertas una escena nueva:
- Genera prompt_image y prompt_video con el mismo detalle que las originales
- Mantén coherencia total de estilo y personajes
- Marca las nuevas con "is_new": true`,

    `ESCENAS EXISTENTES:
${JSON.stringify(existingScenes, null, 2)}

ESTILO: ${style.visual_style} | RATIO: ${style.aspect_ratio}
${userRules ? `INSTRUCCIONES: "${userRules}"` : ""}

Analiza las transiciones entre cada par de escenas. Si hay saltos
bruscos, inserta escenas puente. Si hay monotonía, varía ángulos.

Devuelve JSON:
{
  "analysis": "Explicación de qué detectaste y por qué insertas",
  "updated_scenes": [
    // Array COMPLETO: originales + nuevas intercaladas
    // Nuevas tienen "is_new": true
  ]
}`,
    "qwen/qwen3.5-plus-02-15"  // Tarea compleja → modelo Plus
  );
}
```

---

## 6. Consejero Creativo

```typescript
// lib/ai/advisor.ts
import { callQwen } from "./qwen-brain";
import type { Project } from "../types/storyboard";

export async function getCreativeAdvice(
  project: Project,
  question?: string
): Promise<{
  overall_score: number;
  strengths: string[];
  issues: string[];
  suggestions: { scene: number; advice: string; new_prompt?: string }[];
  general_tips: string[];
}> {
  return callQwen(
    `Eres un director creativo senior que revisa storyboards.
Das feedback constructivo, específico y accionable.
Si detectas problemas, propones soluciones concretas con prompts nuevos.
Piensa como un director de cine real.`,

    `PROYECTO: "${project.brief}"
ESTILO: ${project.style.visual_style}

STORYBOARD COMPLETO:
${JSON.stringify(project.scenes, null, 2)}

${question ? `PREGUNTA DEL USUARIO: "${question}"` : "Da tu análisis general."}

Devuelve JSON:
{
  "overall_score": 7,
  "strengths": ["Buena variación de planos...", "El ritmo..."],
  "issues": ["La escena 3 rompe la continuidad...", "Falta..."],
  "suggestions": [
    {
      "scene": 3,
      "advice": "Cambia el ángulo a cenital para...",
      "new_prompt": "Prompt mejorado si aplica..."
    }
  ],
  "general_tips": ["Para anuncios, el primer frame es clave..."]
}`,
    "qwen/qwen3.5-plus-02-15"  // Analizar storyboard completo → modelo Plus
  );
}
```

---

## 7. Motor de Narración

### 7.1 Generador de guion

```typescript
// lib/ai/narration-engine.ts
import { callQwen } from "./qwen-brain";
import type { Scene, NarrationConfig, NarrationScript } from "../types/storyboard";

export async function generateNarrationScript(
  scenes: Scene[],
  config: NarrationConfig,
  brief: string
): Promise<NarrationScript> {
  return callQwen(
    `Eres guionista de narración en off para vídeo.
Reglas:
- Cada segmento debe caber en la duración de su escena
- ~13 caracteres por segundo de habla (~150 palabras/minuto)
- Varía ritmo: momentos rápidos y pausas dramáticas
- Indica emociones para guiar la voz`,

    `BRIEF: "${brief}"
ESTILO NARRACIÓN: ${config.style}
IDIOMA: ${config.language}

ESCENAS:
${scenes.map((s, i) => `
Escena ${i + 1} (${s.duration_seconds}s):
- ${s.description}
- Narración sugerida: ${s.narration_text || "libre"}
`).join("")}

Devuelve JSON:
{
  "segments": [{
    "scene_order": 1,
    "type": "narration",
    "voice_id": "narrator",
    "emotion": "warm",
    "text": "Texto a narrar...",
    "estimated_seconds": 8,
    "timing_note": "Empieza tras 2s de silencio"
  }],
  "voices_needed": [{
    "id": "narrator",
    "description": "Voz masculina cálida",
    "suggested_preset": "mistral_adam"
  }],
  "total_duration_seconds": 60,
  "total_characters": 780
}`,
    "qwen/qwen3.5-flash-02-23"
  );
}
```

### 7.2 Orquestador de voces

```typescript
// lib/ai/narration-orchestrator.ts
import { generateVoice } from "./voxtral-tts";
import type { NarrationSegment, VoiceConfig } from "../types/storyboard";

export async function generateFullNarration(
  segments: NarrationSegment[],
  voiceMap: Record<string, VoiceConfig>
): Promise<{ scene: number; audio: Buffer }[]> {
  const results: { scene: number; audio: Buffer }[] = [];

  for (const segment of segments) {
    const voice = voiceMap[segment.voice_id] || {};
    const audio = await generateVoice(
      segment.text,
      voice.voxtral_preset,
      voice.reference_audio_base64
    );
    results.push({ scene: segment.scene_order, audio: Buffer.from(audio) });
  }

  return results;
}

export async function mergeAudioSegments(
  segments: Buffer[],
  gapMs: number = 300
): Promise<Buffer> {
  const fs = await import("fs/promises");
  const { execSync } = await import("child_process");
  const tempDir = `/tmp/narration_${Date.now()}`;
  await fs.mkdir(tempDir, { recursive: true });

  // Guardar cada segmento
  const files: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const path = `${tempDir}/seg_${String(i).padStart(3, "0")}.mp3`;
    await fs.writeFile(path, segments[i]);
    files.push(path);
  }

  // Silencio entre segmentos
  const silence = `${tempDir}/silence.mp3`;
  execSync(
    `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t ${gapMs / 1000} ${silence}`
  );

  // Concat list
  const listItems = files.flatMap((f, i) =>
    i < files.length - 1 ? [`file '${f}'`, `file '${silence}'`] : [`file '${f}'`]
  );
  await fs.writeFile(`${tempDir}/list.txt`, listItems.join("\n"));

  // Merge
  execSync(
    `ffmpeg -y -f concat -safe 0 -i ${tempDir}/list.txt -c copy ${tempDir}/final.mp3`
  );
  const result = await fs.readFile(`${tempDir}/final.mp3`);
  execSync(`rm -rf ${tempDir}`);
  return result;
}
```

---

## 8. Route Handlers

```typescript
// app/api/generate-storyboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateStoryboard } from "@/lib/ai/prompt-engine";

export async function POST(req: NextRequest) {
  const { brief, style, numScenes, sceneDuration } = await req.json();
  const result = await generateStoryboard(brief, style, numScenes, sceneDuration);
  return NextResponse.json(result);
}

// app/api/analyze-scenes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { analyzeUploadedScenes } from "@/lib/ai/scene-analyzer";

export async function POST(req: NextRequest) {
  const { images } = await req.json();
  const analyses = await analyzeUploadedScenes(images);
  return NextResponse.json({ analyses });
}

// app/api/insert-scenes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { insertScenesBetween } from "@/lib/ai/scene-analyzer";

export async function POST(req: NextRequest) {
  const { existingScenes, style, rules } = await req.json();
  const result = await insertScenesBetween(existingScenes, style, rules);
  return NextResponse.json(result);
}

// app/api/get-advice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCreativeAdvice } from "@/lib/ai/advisor";

export async function POST(req: NextRequest) {
  const { project, question } = await req.json();
  const advice = await getCreativeAdvice(project, question);
  return NextResponse.json(advice);
}

// app/api/edit-scene/route.ts
import { NextRequest, NextResponse } from "next/server";
import { regenerateScene } from "@/lib/ai/prompt-engine";

export async function POST(req: NextRequest) {
  const { project, sceneIndex, feedback } = await req.json();
  const scene = await regenerateScene(project, sceneIndex, feedback);
  return NextResponse.json(scene);
}

// app/api/generate-narration/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateNarrationScript } from "@/lib/ai/narration-engine";
import { generateFullNarration, mergeAudioSegments } from "@/lib/ai/narration-orchestrator";

export async function POST(req: NextRequest) {
  const { scenes, narrationConfig, brief, voiceMap } = await req.json();

  const script = await generateNarrationScript(scenes, narrationConfig, brief);
  const audioSegments = await generateFullNarration(script.segments, voiceMap);
  const finalAudio = await mergeAudioSegments(audioSegments.map((s) => s.audio));

  return NextResponse.json({
    script,
    audio_base64: finalAudio.toString("base64"),
  });
}
```

---

## 9. Ejemplo de uso

### Petición

```json
{
  "brief": "Anuncio 60s peluquería moderna, estilo anime, target jóvenes 18-30",
  "style": {
    "visual_style": "anime",
    "aspect_ratio": "9:16",
    "color_palette": "neon pink, dark purple, electric blue"
  },
  "numScenes": 6,
  "sceneDuration": 10
}
```

### Respuesta (ejemplo abreviado)

```json
{
  "title": "GLOW UP — Tu Mejor Versión",
  "synopsis": "Una transformación épica en la peluquería más cool de la ciudad.",
  "scenes": [
    {
      "order": 1,
      "duration_seconds": 10,
      "description": "Exterior nocturno de la peluquería con neones. Una chica camina hacia la entrada.",
      "camera_movement": "Slow dolly forward",
      "transition": "Puerta se abre → fundido a blanco",
      "prompt_image": "Anime style, night scene exterior of a modern Japanese hair salon with glowing neon signs in pink and electric blue, wet street reflections, a stylish young woman with messy hair walking toward the entrance, urban Tokyo aesthetic, cinematic, 9:16, 4K detailed",
      "prompt_video": "Slow dolly forward through a rainy night street toward a glowing neon hair salon, anime style, young woman walks ahead toward the door, neon reflections on wet ground, light rain particles, the door opens flooding scene with warm light, 10 seconds, smooth motion",
      "narration_text": "En la ciudad que nunca duerme, hay un lugar donde los sueños toman forma."
    }
  ]
}
```

### Insertar escena — el usuario pasa escenas existentes

```json
// POST /api/insert-scenes
{
  "existingScenes": [escena1, escena2],
  "style": { "visual_style": "anime", "aspect_ratio": "9:16" },
  "rules": "Añade transición entre la entrada y el corte de pelo"
}
```

La IA responde:

```json
{
  "analysis": "Hay un salto brusco de exterior a close-up. Falta el momento de recepción.",
  "updated_scenes": [
    { "order": 1, "is_new": false, "description": "Exterior..." },
    {
      "order": 2,
      "is_new": true,
      "description": "La clienta se sienta. La estilista le muestra estilos holográficos.",
      "prompt_image": "Anime style, futuristic salon interior, young woman in salon chair, hairdresser showing holographic hairstyle options, neon ambient lighting, 9:16, detailed",
      "prompt_video": "Camera follows woman sitting in anime salon chair, hairdresser swipes holographic hair previews floating in air, client points excitedly, neon lights pulse, 10 seconds"
    },
    { "order": 3, "is_new": false, "description": "Close-up corte..." }
  ]
}
```

---

## 10. Costes mensuales

| Proyectos/mes | Sin audio | Con audio 60s | Con audio 5 min |
|---------------|----------|---------------|-----------------|
| 50 | $0.45 | **$1.10** | $3.65 |
| 200 | $1.80 | **$4.40** | $14.60 |
| 1.000 | $9.00 | **$22.00** | $73.00 |
| 5.000 | $45.00 | **$110.00** | $365.00 |

### Modelo de negocio

| Plan | Incluye | Tu coste | Precio | Margen |
|------|---------|----------|--------|--------|
| Free | 5 storyboards/día, sin audio | ~$0.00 | $0 | ∞ |
| Creator | 50 proyectos + 30 audio/mes | ~$0.85 | $9.99/mes | 92% |
| Pro | 200 proyectos + 100 audio/mes | ~$6.00 | $29.99/mes | 80% |
| Studio | 1.000 proyectos + audio ilimitado | ~$22.00 | $79.99/mes | 73% |

---

## 11. Setup

### Dependencias

```bash
npx create-next-app@latest director-creativo-ia --typescript --tailwind --app
cd director-creativo-ia

npm install @google/genai          # Gemini SDK (visión)
npm install openai                 # OpenRouter + Qwen (compatible OpenAI)
npm install fluent-ffmpeg          # Merge audio
npm install @ffmpeg-installer/ffmpeg
npm install sharp                  # Procesar imágenes subidas
npm install nanoid                 # IDs únicos
npm install zustand                # Estado global
```

### Variables de entorno

```env
# .env.local

# Gemini (solo visión) — Google AI Studio (USA)
GEMINI_API_KEY=tu_clave_google

# Qwen (cerebro creativo) — vía OpenRouter (USA)
# Registro: openrouter.ai — solo email, sin DNI
OPENROUTER_API_KEY=tu_clave_openrouter

# Voxtral TTS (narración) — Mistral (Francia)
# Registro: console.mistral.ai
MISTRAL_API_KEY=tu_clave_mistral
```

---

## 12. Notas finales

- **Todos los proveedores son occidentales**: Google (USA), OpenRouter (USA),
  Mistral (Francia). Ningún dato pasa por China. Qwen es open-source y
  OpenRouter lo ejecuta en sus propios servidores.

- **Gemini 2.5 Flash** tiene tier gratis ~500 req/día. Para MVP es gratis.

- **Qwen3.5 Flash vía OpenRouter** a $0.065/M tokens es incluso más barato
  que directamente en Alibaba ($0.10/M). Solo usa **Qwen3.5 Plus** ($0.26/M)
  para tareas complejas: analizar storyboard completo, dar consejos,
  insertar escenas.

- **Voxtral TTS** se lanzó el 26/03/2026. Supera a ElevenLabs Flash v2.5
  en el 68.4% de tests humanos. $0.016/1K chars con clonación de voz.
  9 idiomas incluido español.

- Los prompts generados son **agnósticos** — funcionan en Gemini Image,
  Midjourney, DALL-E, Runway, Kling, Pika, etc.

- La función de **insertar escenas** es el diferenciador clave.
  Ninguna herramienta actual analiza un storyboard e inserta
  escenas de transición automáticamente.

- **ffmpeg** necesario en servidor para merge de audio.
  En Vercel usa Functions con Node.js runtime.

- **Registro de cuentas**:
  1. Google AI Studio → aistudio.google.com (email Google)
  2. OpenRouter → openrouter.ai (email o GitHub)
  3. Mistral → console.mistral.ai (email)
  Solo email, sin DNI, sin verificación de identidad.
