import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callQwen } from '@/lib/ai/providers/openrouter';

interface RequestBody {
  projectId?: string;
  videoId?: string;
  platform?: string;
  publicationType?: string;
}

interface GeneratedContent {
  caption: string;
  hashtags: string[];
  best_time: string;
  tips: string[];
}

/**
 * POST /api/ai/generate-publication-content
 * Generates captions and hashtags for a social media publication.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId, videoId, platform, publicationType } = (await request.json()) as RequestBody;

    // Fetch project and video info
    const { data: project } = projectId
      ? await supabase.from('projects').select('title, description, style, tags').eq('id', projectId).single()
      : { data: null };

    const { data: video } = videoId
      ? await supabase.from('videos').select('title, description, platform').eq('id', videoId).single()
      : { data: null };

    const prompt = `Generate social media content for ${platform || 'instagram'}.
Project: "${project?.title ?? 'Untitled'}" - ${project?.description || 'No description'}
${video ? `Video: "${video.title}" - ${video.description || ''}` : ''}
Type: ${publicationType || 'post'}

Return JSON:
{
  "caption": "engaging caption in Spanish, 2-3 sentences max",
  "hashtags": ["hashtag1", "hashtag2", ...up to 10],
  "best_time": "suggested posting time in Spanish",
  "tips": ["tip for better engagement in Spanish"]
}`;

    try {
      const result = await callQwen(
        'You are a social media expert. Generate engaging content optimized for the specified platform. Always respond in Spanish.',
        prompt,
        'qwen/qwen3.5-flash-02-23',
        0.8
      );
      return NextResponse.json(result);
    } catch {
      // Fallback mock response
      const tags = (project?.tags as string[] | null) ?? ['contenido', 'creatividad', 'video'];
      const fallback: GeneratedContent = {
        caption: `Descubre ${project?.title ?? 'nuestro proyecto'} \u2728 Una experiencia unica que no te puedes perder.`,
        hashtags: tags,
        best_time: 'Martes a jueves, 12:00-14:00',
        tips: ['Usa el primer segundo para captar atencion', 'Agrega subtitulos para accesibilidad'],
      };
      return NextResponse.json(fallback);
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
