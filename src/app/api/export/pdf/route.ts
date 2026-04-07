import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ScenePromptRow {
  prompt_type: string;
  prompt_text: string;
  is_current: boolean;
}

interface SceneCharacterJoin {
  character: { name: string } | null;
}

interface SceneBackgroundJoin {
  background: { name: string } | null;
}

interface SceneCameraRow {
  camera_angle: string | null;
  camera_movement: string | null;
}

interface SceneRow {
  scene_number: number;
  title: string;
  description: string | null;
  duration_seconds: number | null;
  arc_phase: string | null;
  scene_camera: SceneCameraRow[] | null;
  scene_prompts: ScenePromptRow[] | null;
  scene_characters: SceneCharacterJoin[] | null;
  scene_backgrounds: SceneBackgroundJoin[] | null;
}

interface ProjectRow {
  title: string | null;
  style: string | null;
}

interface VideoRow {
  title: string;
  platform: string | null;
  target_duration_seconds: number | null;
}

/**
 * POST /api/export/pdf
 * Generates a self-contained HTML storyboard optimized for printing to PDF.
 * Opens in a new tab where the user can use the browser's print dialog.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId, videoId } = await request.json() as { projectId?: string; videoId?: string };
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    // Fetch video
    const { data: video } = await supabase.from('videos').select('title, platform, target_duration_seconds').eq('id', videoId).single();
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    // Fetch project
    const { data: project } = projectId
      ? await supabase.from('projects').select('title, style').eq('id', projectId).single()
      : { data: null };

    // Fetch scenes with relationships
    const { data: scenes } = await supabase
      .from('scenes')
      .select('scene_number, title, description, duration_seconds, arc_phase, scene_camera(camera_angle, camera_movement), scene_prompts(prompt_type, prompt_text, is_current), scene_characters(character:characters!character_id(name)), scene_backgrounds(background:backgrounds!background_id(name))')
      .eq('video_id', videoId)
      .order('scene_number');

    // Generate HTML storyboard
    const html = generateStoryboardHTML(
      project as ProjectRow | null,
      video as VideoRow,
      (scenes ?? []) as unknown as SceneRow[],
    );

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="storyboard-${video.title}.html"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateStoryboardHTML(project: ProjectRow | null, video: VideoRow, scenes: SceneRow[]): string {
  const sceneCards = scenes.map((scene) => {
    const camera = scene.scene_camera?.[0];
    const imagePrompt = scene.scene_prompts?.find((p) => p.prompt_type === 'image' && p.is_current);
    const videoPrompt = scene.scene_prompts?.find((p) => p.prompt_type === 'video' && p.is_current);
    const chars = scene.scene_characters?.map((sc) => sc.character?.name).filter(Boolean).join(', ') || '\u2014';
    const bg = scene.scene_backgrounds?.[0]?.background?.name || '\u2014';

    return `
    <div class="scene-card">
      <div class="scene-header">
        <span class="scene-number">#${scene.scene_number}</span>
        <span class="scene-title">${escapeHtml(scene.title)}</span>
        <span class="scene-phase">${escapeHtml(scene.arc_phase ?? '')}</span>
        <span class="scene-duration">${scene.duration_seconds ?? 0}s</span>
      </div>
      <div class="scene-body">
        ${scene.description ? `<p class="scene-desc">${escapeHtml(scene.description)}</p>` : ''}
        <div class="scene-meta">
          <span>Camera: ${escapeHtml(camera?.camera_angle ?? 'auto')} / ${escapeHtml(camera?.camera_movement ?? 'auto')}</span>
          <span>Personajes: ${escapeHtml(chars)}</span>
          <span>Fondo: ${escapeHtml(bg)}</span>
        </div>
        ${imagePrompt ? `<div class="prompt-block"><strong>Prompt imagen:</strong><pre>${escapeHtml(imagePrompt.prompt_text)}</pre></div>` : ''}
        ${videoPrompt ? `<div class="prompt-block"><strong>Prompt video:</strong><pre>${escapeHtml(videoPrompt.prompt_text)}</pre></div>` : ''}
      </div>
    </div>`;
  }).join('');

  const videoTitle = escapeHtml(video.title);
  const projectTitle = escapeHtml(project?.title ?? '');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Storyboard \u2014 ${videoTitle}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #111; color: #eee; padding: 2rem; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  .subtitle { color: #888; font-size: 0.85rem; margin-bottom: 2rem; }
  .scene-card { border: 1px solid #333; border-radius: 12px; margin-bottom: 1rem; overflow: hidden; background: #1a1a1a; }
  .scene-header { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid #333; background: #222; }
  .scene-number { font-weight: 700; color: #058B96; font-size: 0.8rem; }
  .scene-title { flex: 1; font-weight: 600; font-size: 0.9rem; }
  .scene-phase { background: rgba(5,139,150,0.2); color: #058B96; padding: 2px 8px; border-radius: 999px; font-size: 0.7rem; font-weight: 600; }
  .scene-duration { color: #888; font-size: 0.75rem; }
  .scene-body { padding: 1rem; }
  .scene-desc { color: #aaa; font-size: 0.85rem; margin-bottom: 0.75rem; line-height: 1.5; }
  .scene-meta { display: flex; gap: 1rem; font-size: 0.75rem; color: #888; margin-bottom: 0.75rem; flex-wrap: wrap; }
  .prompt-block { margin-top: 0.75rem; }
  .prompt-block strong { font-size: 0.7rem; color: #888; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.25rem; }
  .prompt-block pre { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #ccc; background: #111; border: 1px solid #333; border-radius: 8px; padding: 0.75rem; white-space: pre-wrap; word-break: break-word; line-height: 1.5; }
  @media print {
    body { background: white; color: #111; padding: 1rem; }
    .scene-card { border-color: #ddd; background: white; page-break-inside: avoid; }
    .scene-header { background: #f5f5f5; border-color: #ddd; }
    .scene-number { color: #058B96; }
    .scene-phase { background: rgba(5,139,150,0.1); }
    .prompt-block pre { background: #f5f5f5; border-color: #ddd; color: #333; }
    .scene-desc { color: #555; }
    .scene-meta { color: #666; }
  }
</style>
</head>
<body>
<h1>${videoTitle}</h1>
<p class="subtitle">${projectTitle} \u00B7 ${escapeHtml(video.platform ?? '')} \u00B7 ${video.target_duration_seconds ?? 0}s \u00B7 ${scenes.length} escenas</p>
${sceneCards}
<script>window.print();</script>
</body>
</html>`;
}
