import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailableProvider } from '@/lib/ai/router';
import { SYSTEM_SCENE_IMPROVER } from '@/lib/ai/prompts/system-scene-improver';

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: ImprovePromptBody = await request.json();
    const { prompt, instruction, sceneContext } = body;

    // If prompt is empty and no sceneContext, we can't do anything
    if (!prompt && !sceneContext) {
      return NextResponse.json(
        { error: 'Either prompt or sceneContext is required' },
        { status: 400 }
      );
    }

    const provider = await getAvailableProvider(user.id, 'text');

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

Respond with a JSON object containing:
- "improved_prompt": the generated prompt
- "improvements": array of objects with { "type": "add", "text": "description of what was included" }`;
    } else {
      // IMPROVE mode: improve an existing prompt
      userPrompt = `Improve this image generation prompt:

Original prompt:
${prompt}

${contextInfo ? `Context:\n${contextInfo}` : ''}

${instruction ? `User instruction: ${instruction}` : ''}

Respond with a JSON object containing:
- "improved_prompt": the improved prompt
- "improvements": array of objects with { "type": "improve" | "add", "text": "description of the change" }`;
    }

    const result = await provider.instance.generateText(
      {
        prompt: userPrompt,
        systemPrompt: SYSTEM_SCENE_IMPROVER,
        maxTokens: 2048,
        temperature: 0.6,
      },
      provider.apiKey
    );

    // Try to parse the AI response as JSON
    let improved;
    try {
      // Strip markdown code fences if present
      let text = result.text.trim();
      if (text.startsWith('```json')) {
        text = text.slice(7);
      } else if (text.startsWith('```')) {
        text = text.slice(3);
      }
      if (text.endsWith('```')) {
        text = text.slice(0, -3);
      }
      improved = JSON.parse(text.trim());
    } catch {
      // Fallback: treat the entire response as the improved prompt
      console.error('[improve-prompt] Failed to parse AI response as JSON, using raw text');
      improved = {
        improved_prompt: result.text.trim(),
        improvements: [{ type: 'improve', text: 'AI-enhanced prompt (raw response)' }],
      };
    }

    return NextResponse.json({
      success: true,
      improved_prompt: improved.improved_prompt,
      improvements: improved.improvements ?? [],
      provider: provider.providerId,
      model: provider.model,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.startsWith('NO_PROVIDER_AVAILABLE')) {
      return NextResponse.json(
        { error: message },
        { status: 429 }
      );
    }

    console.error('[improve-prompt]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
