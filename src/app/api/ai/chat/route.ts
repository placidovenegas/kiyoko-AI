import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailableProviders, logUsage } from '@/lib/ai/router';
import { SYSTEM_CHAT_ASSISTANT } from '@/lib/ai/prompts/system-chat-assistant';
import { SYSTEM_PROJECT_GENERATOR } from '@/lib/ai/prompts/system-project-generator';
import { buildStoryboardDirectorPrompt } from '@/lib/ai/prompts/system-storyboard-director';
import type { SceneContext, CharacterContext, BackgroundContext } from '@/lib/ai/prompts/system-storyboard-director';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type ChatMode = 'storyboard' | 'general';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, messages, mode } = await request.json() as {
      projectId: string;
      messages: ChatMessage[];
      mode?: ChatMode;
    };

    if (!messages?.length) {
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 });
    }

    // Build system prompt based on mode
    let systemPrompt = SYSTEM_PROJECT_GENERATOR;

    if (projectId && projectId !== '__wizard__') {
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (project) {
        if (mode === 'storyboard') {
          // Storyboard mode: full context with action plan support
          systemPrompt = await buildStoryboardContext(supabase, project, projectId);
        } else {
          // General mode: lightweight context (existing behavior)
          const [{ data: scenes }, { data: characters }, { data: backgrounds }] = await Promise.all([
            supabase.from('scenes').select('scene_number, title, scene_type, arc_phase, prompt_image, duration_seconds').eq('project_id', projectId).order('sort_order').limit(30),
            supabase.from('characters').select('name, role, prompt_snippet').eq('project_id', projectId),
            supabase.from('backgrounds').select('code, name, prompt_snippet').eq('project_id', projectId),
          ]);

          systemPrompt = SYSTEM_CHAT_ASSISTANT + `\n\nPROYECTO ACTUAL:
- Título: ${project.title}
- Cliente: ${project.client_name || 'N/A'}
- Estilo: ${project.style}
- Plataforma: ${project.target_platform}
- Duración: ${project.target_duration_seconds}s
- Escenas (${scenes?.length || 0}): ${scenes?.map((s: Record<string, unknown>) => `${s.scene_number} "${s.title}" (${s.scene_type}, ${s.arc_phase}, ${s.duration_seconds}s)`).join(', ') || 'ninguna'}
- Personajes: ${characters?.map((c: Record<string, unknown>) => `${c.name} (${c.role})`).join(', ') || 'ninguno'}
- Fondos: ${backgrounds?.map((b: Record<string, unknown>) => `${b.code} "${b.name}"`).join(', ') || 'ninguno'}`;
        }
      }
    }

    // Build conversation prompt
    const lastMessage = messages[messages.length - 1];
    const history = messages.slice(0, -1)
      .map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
      .join('\n\n');

    const fullPrompt = history
      ? `Conversación previa:\n${history}\n\nUsuario: ${lastMessage.content}`
      : lastMessage.content;

    const input = {
      prompt: fullPrompt,
      systemPrompt,
      maxTokens: mode === 'storyboard' ? 4096 : 2048,
      temperature: 0.7,
    };

    // Get ALL available providers and try each with fallback
    const providers = getAvailableProviders('text');
    if (providers.length === 0) {
      return NextResponse.json({ error: 'NO_PROVIDER_AVAILABLE' }, { status: 429 });
    }

    // Try each provider with fallback
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const isLast = i === providers.length - 1;

      try {
        const stream = provider.instance.streamText(input, provider.apiKey);
        const startTime = Date.now();

        const readableStream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            try {
              for await (const chunk of stream) {
                const data = JSON.stringify({ text: chunk.text, done: chunk.done });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                if (chunk.done) break;
              }

              logUsage({
                userId: user.id,
                projectId: projectId !== '__wizard__' ? projectId : undefined,
                provider: provider.providerId,
                model: provider.model,
                task: mode === 'storyboard' ? 'storyboard-chat' : 'chat',
                inputTokens: 0,
                outputTokens: 0,
                estimatedCost: 0,
                responseTimeMs: Date.now() - startTime,
                success: true,
              }).catch(() => {});

              controller.close();
            } catch (streamError) {
              // If streaming fails mid-way, report the error
              const msg = streamError instanceof Error ? streamError.message : 'Stream error';
              console.error(`[chat] ${provider.providerId} stream error:`, msg);

              // If rate limited or quota exceeded, and there are more providers, signal to retry
              if (!isLast && (msg.includes('429') || msg.includes('quota') || msg.includes('rate'))) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `${provider.providerId} agotado, intentando siguiente...`, done: false })}\n\n`));
                controller.close();
                return;
              }

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg, done: true })}\n\n`));
              controller.close();
            }
          },
        });

        return new NextResponse(readableStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      } catch (providerError) {
        console.error(`[chat] ${provider.providerId} failed:`, providerError instanceof Error ? providerError.message : providerError);
        if (isLast) {
          return NextResponse.json({ error: 'Todos los proveedores de IA fallaron' }, { status: 500 });
        }
        // Continue to next provider
      }
    }

    return NextResponse.json({ error: 'No providers available' }, { status: 429 });
  } catch (error) {
    console.error('[chat]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ---------- Storyboard context builder ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildStoryboardContext(supabase: any, project: any, projectId: string): Promise<string> {
  // Fetch full scene, character, and background data in parallel
  const [{ data: rawScenes }, { data: rawCharacters }, { data: rawBackgrounds }] = await Promise.all([
    supabase
      .from('scenes')
      .select('id, scene_number, title, scene_type, arc_phase, description, duration_seconds, prompt_image, prompt_video, audio_config, character_ids, background_id, sort_order')
      .eq('project_id', projectId)
      .order('sort_order')
      .limit(50),
    supabase
      .from('characters')
      .select('id, name, code, role, archetype, rules, prompt_snippet')
      .eq('project_id', projectId),
    supabase
      .from('backgrounds')
      .select('id, code, name, prompt_snippet')
      .eq('project_id', projectId),
  ]);

  const characters: CharacterContext[] = (rawCharacters || []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    name: c.name as string,
    code: (c.code as string) || null,
    role: (c.role as string) || '',
    archetype: (c.archetype as string) || null,
    rules: (c.rules as string[]) || null,
    prompt_snippet: (c.prompt_snippet as string) || null,
  }));

  const backgrounds: BackgroundContext[] = (rawBackgrounds || []).map((b: Record<string, unknown>) => ({
    id: b.id as string,
    code: (b.code as string) || '',
    name: (b.name as string) || '',
    prompt_snippet: (b.prompt_snippet as string) || null,
  }));

  // Build a lookup map for characters and backgrounds by ID
  const charMap = new Map(characters.map(c => [c.id, c]));
  const bgMap = new Map(backgrounds.map(b => [b.id, b]));

  const scenes: SceneContext[] = (rawScenes || []).map((s: Record<string, unknown>, idx: number) => {
    const charIds = (s.character_ids as string[]) || [];
    const charNames = charIds
      .map(id => charMap.get(id)?.name)
      .filter(Boolean) as string[];

    const bgId = s.background_id as string | null;
    const bgName = bgId ? bgMap.get(bgId)?.name || null : null;

    return {
      id: s.id as string,
      sort_index: idx + 1,
      scene_number: (s.scene_number as string) || `?${idx + 1}`,
      title: (s.title as string) || '',
      scene_type: (s.scene_type as string) || 'original',
      arc_phase: (s.arc_phase as string) || 'build',
      description: (s.description as string) || null,
      duration_seconds: (s.duration_seconds as number) || 3,
      prompt_image: (s.prompt_image as string) || null,
      prompt_video: (s.prompt_video as string) || null,
      audio_config: (s.audio_config as string) || null,
      character_names: charNames.length > 0 ? charNames : null,
      background_name: bgName,
    };
  });

  return buildStoryboardDirectorPrompt({
    project: {
      title: project.title,
      client_name: project.client_name,
      style: project.style,
      target_platform: project.target_platform,
      target_duration_seconds: project.target_duration_seconds,
    },
    scenes,
    characters,
    backgrounds,
  });
}
