import { createClient } from '@/lib/supabase/server';

export async function generateMarkdownExport(projectId: string): Promise<string> {
  const supabase = await createClient();

  const [project, scenes, characters, backgrounds] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase.from('scenes').select('*').eq('project_id', projectId).order('sort_order'),
    supabase.from('characters').select('*').eq('project_id', projectId).order('sort_order'),
    supabase.from('backgrounds').select('*').eq('project_id', projectId).order('sort_order'),
  ]);

  const p = project.data as Record<string, unknown> | null;
  if (!p) throw new Error('Project not found');

  let md = `# ${p.title}\n\n`;
  md += `**Cliente:** ${p.client_name || 'N/A'}  \n`;
  md += `**Estilo:** ${p.style}  \n`;
  md += `**Plataforma:** ${p.target_platform ?? ''}  \n`;
  md += `**Duración objetivo:** ${p.target_duration_seconds ?? ''}s  \n\n`;

  if (p.description) {
    md += `## Descripción\n\n${p.description}\n\n`;
  }

  // Characters
  if (characters.data?.length) {
    md += `## Personajes\n\n`;
    for (const c of characters.data) {
      md += `### ${c.name} [${c.initials}]\n`;
      md += `**Rol:** ${c.role}  \n`;
      md += `**Descripción visual:** ${c.visual_description}  \n`;
      md += `\n**Prompt snippet:**\n\`\`\`\n${c.prompt_snippet}\n\`\`\`\n\n`;
    }
  }

  // Backgrounds
  if (backgrounds.data?.length) {
    md += `## Fondos / Localizaciones\n\n`;
    for (const b of backgrounds.data) {
      md += `### ${b.code} — ${b.name}\n`;
      md += `${b.description}  \n`;
      md += `\n**Prompt snippet:**\n\`\`\`\n${b.prompt_snippet}\n\`\`\`\n\n`;
    }
  }

  // Scenes
  if (scenes.data?.length) {
    md += `## Escenas\n\n`;
    for (const s of scenes.data) {
      const sc = s as Record<string, unknown>;
      md += `### ${sc.scene_number} — ${sc.title}\n`;
      md += `**Tipo:** ${sc.scene_type} | **Fase:** ${sc.arc_phase} | **Duración:** ${sc.duration_seconds}s  \n\n`;

      if (sc.description) md += `${sc.description}\n\n`;

      if (sc.image_prompt) {
        md += `**Prompt de imagen:**\n\`\`\`\n${sc.image_prompt}\n\`\`\`\n\n`;
      }

      md += `---\n\n`;
    }
  }

  md += `\n---\n*Generado por Kiyoko AI — ${new Date().toLocaleDateString('es-ES')}*\n`;

  return md;
}
