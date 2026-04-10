import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  apiBadRequest, apiError, apiJson, apiUnauthorized,
  createApiRequestContext, logServerEvent, parseApiJson,
} from '@/lib/observability/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnalyzeAudioBody {
  videoId: string;
  audioUrl: string;
}

interface AudioSection {
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'instrumental' | 'buildup' | 'drop';
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  mood: string;
  energy: 'low' | 'medium' | 'high' | 'very_high';
  lyrics?: string | null;
  suggestedSceneType: 'hook' | 'build' | 'peak' | 'close';
  visualSuggestion?: string;
}

interface AudioAnalysis {
  bpm: number;
  totalDurationSeconds: number;
  genre: string;
  mood: string;
  sections: AudioSection[];
  hasLyrics: boolean;
  language?: string;
}

// ---------------------------------------------------------------------------
// Gemini audio analysis
// ---------------------------------------------------------------------------

async function analyzeWithGemini(audioUrl: string): Promise<AudioAnalysis | null> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;

  try {
    // Fetch audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) return null;
    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const mimeType = audioResponse.headers.get('content-type') ?? 'audio/mpeg';

    // Call Gemini with audio
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: audioBase64,
                },
              },
              {
                text: `You are a music video director. Analyze this song for creating a professional music video (videoclip).

Return a JSON object with this EXACT structure. No markdown, ONLY valid JSON:

{
  "bpm": number,
  "totalDurationSeconds": number,
  "genre": "string",
  "mood": "string",
  "hasLyrics": boolean,
  "language": "string or null",
  "fullLyrics": "Complete transcription of all lyrics in the original language. If instrumental, set to null.",
  "sections": [
    {
      "type": "intro" | "verse" | "chorus" | "bridge" | "outro" | "instrumental" | "buildup" | "drop",
      "startSeconds": number,
      "endSeconds": number,
      "durationSeconds": number,
      "mood": "string — the emotional feeling of this section",
      "energy": "low" | "medium" | "high" | "very_high",
      "lyrics": "EXACT lyrics sung in this section (transcribe word by word). null if instrumental.",
      "suggestedSceneType": "hook" | "build" | "peak" | "close",
      "visualSuggestion": "Describe in Spanish what should be VISUALLY happening in the music video during this section. Be specific: who is doing what, camera movement, lighting, mood. Example: 'El cantante camina por una calle vacia bajo la lluvia. Camara le sigue con tracking. Plano medio. Expresion melancolica.'"
    }
  ]
}

IMPORTANT RULES:
- Transcribe ALL lyrics word by word in the original language
- Each section MUST have visualSuggestion in SPANISH describing the video scene
- Sections must cover the ENTIRE duration with NO gaps
- Split sections longer than 10 seconds into subsections of 6-10 seconds
- For the visualSuggestion, think like a music video director:
  * Intro: atmospheric, establishing shot, slow reveal
  * Verse: narrative, storytelling, character focus
  * Chorus: high energy, dynamic camera, impactful visuals
  * Bridge: change of pace, different angle, emotional moment
  * Outro: closing, fade, final image
- suggestedSceneType mapping: intro→hook, verse→build, chorus/drop→peak, bridge→build, outro→close`,
              },
            ],
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
          },
        }),
      },
    );

    if (!response.ok) return null;

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const analysis = JSON.parse(jsonMatch[0]) as AudioAnalysis;
    return analysis;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Mock analysis for development
// ---------------------------------------------------------------------------

function mockAnalysis(durationHint: number): AudioAnalysis {
  const dur = durationHint || 180;
  const sections: AudioSection[] = [];

  const structure: Array<{ type: AudioSection['type']; pct: number; mood: string; energy: AudioSection['energy']; scene: AudioSection['suggestedSceneType']; visual: string; lyrics: string | null }> = [
    { type: 'intro', pct: 0.08, mood: 'atmospheric', energy: 'low', scene: 'hook', visual: 'Plano general atmosferico. La camara avanza lentamente revelando el escenario principal. Iluminacion suave y calida.', lyrics: null },
    { type: 'verse', pct: 0.15, mood: 'building', energy: 'medium', scene: 'build', visual: 'El protagonista aparece en plano medio. Camara tracking le sigue mientras camina. Expresion pensativa, mirada al horizonte.', lyrics: '(Letra de la estrofa 1)' },
    { type: 'chorus', pct: 0.12, mood: 'energetic', energy: 'high', scene: 'peak', visual: 'Explosion de energia. Primer plano del protagonista cantando con emocion. Camara orbita alrededor. Iluminacion dramatica.', lyrics: '(Letra del estribillo)' },
    { type: 'verse', pct: 0.15, mood: 'developing', energy: 'medium', scene: 'build', visual: 'Narrativa se desarrolla. Plano medio con los personajes interactuando. Tracking suave. Momentos emotivos entre ellos.', lyrics: '(Letra de la estrofa 2)' },
    { type: 'chorus', pct: 0.12, mood: 'powerful', energy: 'very_high', scene: 'peak', visual: 'Repeticion del estribillo con mas intensidad. Close-up de caras. Movimiento dinamico. La gente baila o celebra detras.', lyrics: '(Letra del estribillo - repeticion)' },
    { type: 'bridge', pct: 0.10, mood: 'reflective', energy: 'medium', scene: 'build', visual: 'Cambio de ritmo. Plano general diferente. Momento reflexivo. El protagonista solo, mirando lejos. Camara lenta.', lyrics: '(Letra del puente)' },
    { type: 'chorus', pct: 0.15, mood: 'climactic', energy: 'very_high', scene: 'peak', visual: 'Estribillo final. Maximo impacto. Todos los personajes juntos. Primer plano rotando. Explosion de color y emocion.', lyrics: '(Estribillo final)' },
    { type: 'outro', pct: 0.13, mood: 'fading', energy: 'low', scene: 'close', visual: 'Cierre. Plano general alejandose. El protagonista queda solo. Fade a negro. Logo o titulo final.', lyrics: null },
  ];

  let t = 0;
  for (const s of structure) {
    const secDur = Math.max(3, Math.min(10, Math.round(dur * s.pct)));
    sections.push({
      type: s.type, startSeconds: t, endSeconds: t + secDur,
      durationSeconds: secDur, mood: s.mood, energy: s.energy,
      suggestedSceneType: s.scene, lyrics: s.lyrics,
      visualSuggestion: s.visual,
    });
    t += secDur;
  }

  return {
    bpm: 120, totalDurationSeconds: t,
    genre: 'pop', mood: 'energetic', hasLyrics: true, language: 'es',
    sections,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const ctx = createApiRequestContext(request);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return apiUnauthorized(ctx);

    const { data: body, response } = await parseApiJson<AnalyzeAudioBody>(request, ctx);
    if (response || !body) return response;

    const { videoId, audioUrl } = body;
    if (!videoId || !audioUrl) return apiBadRequest(ctx, 'Missing videoId or audioUrl');

    // Verify video ownership
    const { data: video } = await supabase
      .from('videos').select('id, project_id')
      .eq('id', videoId).single();
    if (!video) return apiJson(ctx, { error: 'Video not found' }, { status: 404 });

    const { data: project } = await supabase
      .from('projects').select('owner_id')
      .eq('id', video.project_id).single();
    if (!project || project.owner_id !== user.id) return apiUnauthorized(ctx);

    logServerEvent('analyze-audio', ctx, 'Analyzing audio file', { videoId, audioUrl: audioUrl.slice(0, 100) });

    // Try Gemini analysis, fallback to mock
    let analysis = await analyzeWithGemini(audioUrl);
    const provider = analysis ? 'gemini' : 'mock';
    if (!analysis) {
      analysis = mockAnalysis(180);
    }

    // Save to video
    await supabase.from('videos').update({
      audio_file_url: audioUrl,
      audio_analysis: JSON.parse(JSON.stringify(analysis)),
    }).eq('id', videoId);

    logServerEvent('analyze-audio', ctx, 'Audio analyzed', {
      videoId, provider, sections: analysis.sections.length, bpm: analysis.bpm,
    });

    return apiJson(ctx, {
      success: true,
      analysis,
      provider,
    });
  } catch (error) {
    return apiError(ctx, 'analyze-audio', error, { message: 'Error analyzing audio' });
  }
}
