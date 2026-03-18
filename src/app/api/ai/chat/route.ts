import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { getModelWithFallback } from '@/lib/ai/sdk-router';
import { storyboardTools } from '@/lib/ai/tools';
import { SYSTEM_CHAT_DIRECTOR } from '@/lib/ai/prompts/system-chat-director';

interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  projectId?: string;
  projectContext?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { messages, projectContext } =
      (await request.json()) as ChatRequestBody;

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'Missing messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { model } = getModelWithFallback();

    // Build system prompt with project context if available
    const systemPrompt = projectContext
      ? `${SYSTEM_CHAT_DIRECTOR}\n\n--- CONTEXTO DEL PROYECTO ---\n${projectContext}`
      : SYSTEM_CHAT_DIRECTOR;

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      tools: storyboardTools,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[chat]', error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
