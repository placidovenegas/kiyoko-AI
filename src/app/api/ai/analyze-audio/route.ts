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
  lyrics?: string;
  suggestedSceneType: 'hook' | 'build' | 'peak' | 'close';
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
                text: `Analyze this audio/song and return a JSON object with this EXACT structure. No markdown, only JSON:

{
  "bpm": number (estimated beats per minute),
  "totalDurationSeconds": number,
  "genre": "string (e.g. pop, rock, electronic, hip-hop)",
  "mood": "string (e.g. energetic, melancholic, uplifting, dramatic)",
  "hasLyrics": boolean,
  "language": "string or null",
  "sections": [
    {
      "type": "intro" | "verse" | "chorus" | "bridge" | "outro" | "instrumental" | "buildup" | "drop",
      "startSeconds": number,
      "endSeconds": number,
      "durationSeconds": number,
      "mood": "string describing the mood of this section",
      "energy": "low" | "medium" | "high" | "very_high",
      "lyrics": "brief lyrics summary if applicable, null if instrumental",
      "suggestedSceneType": "hook" | "build" | "peak" | "close"
    }
  ]
}

Rules for suggestedSceneType:
- intro → "hook"
- verse → "build"
- chorus/drop → "peak"
- bridge → "build"
- outro → "close"
- buildup → "build"

Make sure sections cover the entire duration without gaps. Each section should be between 3 and 15 seconds for video generation purposes. If a section is longer than 15s, split it into multiple subsections.`,
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
  const dur = durationHint || 180; // default 3 min
  const sections: AudioSection[] = [];

  // Generate realistic song structure
  const structure: Array<{ type: AudioSection['type']; pct: number; mood: string; energy: AudioSection['energy']; scene: AudioSection['suggestedSceneType'] }> = [
    { type: 'intro', pct: 0.08, mood: 'atmospheric', energy: 'low', scene: 'hook' },
    { type: 'verse', pct: 0.15, mood: 'building', energy: 'medium', scene: 'build' },
    { type: 'chorus', pct: 0.12, mood: 'energetic', energy: 'high', scene: 'peak' },
    { type: 'verse', pct: 0.15, mood: 'developing', energy: 'medium', scene: 'build' },
    { type: 'chorus', pct: 0.12, mood: 'powerful', energy: 'very_high', scene: 'peak' },
    { type: 'bridge', pct: 0.10, mood: 'reflective', energy: 'medium', scene: 'build' },
    { type: 'buildup', pct: 0.05, mood: 'tense', energy: 'high', scene: 'build' },
    { type: 'chorus', pct: 0.12, mood: 'climactic', energy: 'very_high', scene: 'peak' },
    { type: 'outro', pct: 0.11, mood: 'fading', energy: 'low', scene: 'close' },
  ];

  let t = 0;
  for (const s of structure) {
    const rawDur = Math.round(dur * s.pct);
    const secDur = Math.max(3, Math.min(10, rawDur)); // Snap to 3-10s
    sections.push({
      type: s.type, startSeconds: t, endSeconds: t + secDur,
      durationSeconds: secDur, mood: s.mood, energy: s.energy,
      suggestedSceneType: s.scene,
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
