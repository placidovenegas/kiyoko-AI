import { createClient } from '@/lib/supabase/server';

export async function generateHtmlExport(projectId: string): Promise<string> {
  const supabase = await createClient();

  const [project, scenes, characters, backgrounds, arcs, timeline, issues] =
    await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('scenes').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('characters').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('backgrounds').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('narrative_arcs').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('timeline_entries').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('project_issues').select('*').eq('project_id', projectId).order('sort_order'),
    ]);

  const p = project.data;
  if (!p) throw new Error('Project not found');

  const scenesHtml = (scenes.data || [])
    .map(
      (s) => `
    <div class="scene-card">
      <h3>${s.scene_number} — ${s.title}</h3>
      <div class="scene-meta">
        <span class="badge badge-${s.scene_type}">${s.scene_type}</span>
        <span class="badge badge-${s.arc_phase}">${s.arc_phase}</span>
        <span>${s.duration_seconds}s</span>
      </div>
      ${s.description ? `<p>${s.description}</p>` : ''}
      ${s.prompt_image ? `<div class="prompt"><h4>Prompt Imagen</h4><pre>${escapeHtml(s.prompt_image)}</pre></div>` : ''}
      ${s.prompt_video ? `<div class="prompt"><h4>Prompt Vídeo</h4><pre>${escapeHtml(s.prompt_video)}</pre></div>` : ''}
    </div>`
    )
    .join('\n');

  const charsHtml = (characters.data || [])
    .map(
      (c) => `
    <div class="char-card">
      <h3>${c.name} [${c.initials}]</h3>
      <p><strong>${c.role}</strong></p>
      <p>${c.visual_description}</p>
      <pre>${escapeHtml(c.prompt_snippet)}</pre>
    </div>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(p.title)} — Storyboard</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, sans-serif; background: #0F1117; color: #F9FAFB; line-height: 1.6; }
  .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
  h1 { color: #FBAE24; font-size: 2rem; margin-bottom: 0.5rem; }
  h2 { color: #FCC44D; margin: 2rem 0 1rem; border-bottom: 1px solid #252833; padding-bottom: 0.5rem; }
  h3 { color: #F9FAFB; margin-bottom: 0.5rem; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-right: 4px; }
  .badge-original { background: #6B7280; } .badge-improved { background: #D97706; }
  .badge-new { background: #2563EB; } .badge-filler { background: #8B5CF6; }
  .badge-video { background: #EC4899; } .badge-hook { background: #E24B4A; }
  .badge-build { background: #BA7517; } .badge-peak { background: #1D9E75; }
  .badge-close { background: #185FA5; }
  .scene-card, .char-card { background: #1A1D27; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; }
  .scene-meta { display: flex; gap: 0.5rem; align-items: center; margin: 0.5rem 0; }
  pre { background: #252833; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; margin: 0.5rem 0; white-space: pre-wrap; }
  .prompt h4 { color: #9CA3AF; font-size: 0.8rem; margin-bottom: 0.25rem; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 1rem 0; }
  .stat { background: #1A1D27; border-radius: 8px; padding: 1rem; text-align: center; }
  .stat-value { font-size: 1.5rem; font-weight: bold; color: #FBAE24; }
  .stat-label { font-size: 0.8rem; color: #9CA3AF; }
  footer { text-align: center; padding: 2rem; color: #6B7280; font-size: 0.8rem; }
</style>
</head>
<body>
<div class="container">
  <h1>${escapeHtml(p.title)}</h1>
  <p style="color:#9CA3AF">${p.client_name || ''} · ${p.style} · ${p.target_platform} · ~${p.target_duration_seconds}s</p>

  <div class="stats">
    <div class="stat"><div class="stat-value">${p.total_scenes}</div><div class="stat-label">Escenas</div></div>
    <div class="stat"><div class="stat-value">${p.total_characters}</div><div class="stat-label">Personajes</div></div>
    <div class="stat"><div class="stat-value">${p.total_backgrounds}</div><div class="stat-label">Fondos</div></div>
    <div class="stat"><div class="stat-value">~${p.estimated_duration_seconds}s</div><div class="stat-label">Duración</div></div>
  </div>

  ${charsHtml ? `<h2>Personajes</h2>${charsHtml}` : ''}
  ${scenesHtml ? `<h2>Escenas</h2>${scenesHtml}` : ''}
</div>
<footer>Generado por Kiyoko AI — ${new Date().toLocaleDateString('es-ES')}</footer>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
