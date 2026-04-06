import { NextRequest } from 'next/server';
import { generateText } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getUserModel } from '@/lib/ai/get-user-model';
import { SYSTEM_SCENE_IMPROVER } from '@/lib/ai/prompts/system-scene-improver';
import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerWarning,
  parseApiJson,
} from '@/lib/observability/server';

interface SceneContext {
  title?: string;
  description?: string;
  characters?: Array<{ name: string; prompt_snippet: string }>;
  background?: string;
  camera?: string;
  lighting?: string;
  mood?: string;
  sceneType?: string;
}

interface ImprovePromptBody {
  prompt?: string;
  instruction?: string;
  sceneContext?: SceneContext;
}

// Inline schema for the improve-prompt response
const improvePromptResponseSchema = z.object({
  improved_prompt: z.string(),
  improvements: z.array(z.object({
    type: z.enum(['improve', 'add']),
    text: z.string(),
  })),
});

export async function POST(request: NextRequest) {
  const requestContext = createApiRequestContext(request);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const { data: body, response } = await parseApiJson<ImprovePromptBody>(request, requestContext);
    if (response || !body) {
      return response;
    }

    const { prompt, instruction, sceneContext } = body;

    // If prompt is empty and no sceneContext, we can't do anything
    if (!prompt && !sceneContext) {
      return apiBadRequest(requestContext, 'Either prompt or sceneContext is required');
    }

    const { model, providerId } = await getUserModel(user.id);

    // Build context information from sceneContext
    let contextInfo = '';
    if (sceneContext) {
      if (sceneContext.title) contextInfo += `Scene Title: ${sceneContext.title}\n`;
      if (sceneContext.description) contextInfo += `Scene Description: ${sceneContext.description}\n`;
      if (sceneContext.background) contextInfo += `Background: ${sceneContext.background}\n`;
      if (sceneContext.camera) contextInfo += `Camera Angle: ${sceneContext.camera}\n`;
      if (sceneContext.lighting) contextInfo += `Lighting: ${sceneContext.lighting}\n`;
      if (sceneContext.mood) contextInfo += `Mood: ${sceneContext.mood}\n`;
      if (sceneContext.sceneType) contextInfo += `Scene Type: ${sceneContext.sceneType}\n`;
      if (sceneContext.characters?.length) {
        contextInfo += `Characters:\n${sceneContext.characters.map((c) => `- ${c.name}: ${c.prompt_snippet}`).join('\n')}\n`;
      }
    }

    // Decide whether to GENERATE a new prompt or IMPROVE an existing one
    let userPrompt: string;

    if (!prompt && sceneContext) {
      // GENERATE mode: create a prompt from the scene context
      userPrompt = `Generate a high-quality image generation prompt from this scene context:

${contextInfo}

${instruction ? `Additional instruction: ${instruction}` : ''}

Return a JSON object with "improved_prompt" (the generated prompt) and "improvements" (array of objects with "type" and "text" describing what was included).`;
    } else {
      // IMPROVE mode: improve an existing prompt
      userPrompt = `Improve this image generation prompt:

Original prompt:
${prompt}

${contextInfo ? `Context:\n${contextInfo}` : ''}

${instruction ? `User instruction: ${instruction}` : ''}

Return a JSON object with "improved_prompt" (the improved prompt) and "improvements" (array of objects with "type" and "text" describing each change).`;
    }

    const { text } = await generateText({
      model,
      system: SYSTEM_SCENE_IMPROVER,
      prompt: userPrompt,
    });

    // Parse with Zod for validation, with fallback
    let improved: z.infer<typeof improvePromptResponseSchema>;
    try {
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7);
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3);
      }
      const parsed: unknown = JSON.parse(cleanText.trim());
      improved = improvePromptResponseSchema.parse(parsed);
    } catch {
      // Fallback: treat the entire response as the improved prompt
      logServerWarning('improve-prompt', requestContext, 'Failed to parse AI response, using raw text', {
        userId: user.id,
        providerId,
      });
      improved = {
        improved_prompt: text.trim(),
        improvements: [{ type: 'improve', text: 'AI-enhanced prompt (raw response)' }],
      };
    }

    return apiJson(requestContext, {
      success: true,
      improved_prompt: improved.improved_prompt,
      improvements: improved.improvements,
      provider: providerId,
      requestId: requestContext.requestId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.startsWith('NO_PROVIDER_AVAILABLE')) {
      return apiJson(requestContext, { error: message, requestId: requestContext.requestId }, { status: 429 });
    }

    return apiError(requestContext, 'improve-prompt', error);
  }
}
