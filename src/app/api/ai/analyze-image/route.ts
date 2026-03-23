import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserModel } from '@/lib/ai/get-user-model';
import { generateObject } from 'ai';
import { z } from 'zod';
import { logUsage } from '@/lib/ai/sdk-router';
import type { Json } from '@/types/database.types';

const characterAnalysisSchema = z.object({
  age_range: z.string(),
  body_type: z.string(),
  facial_features: z.string(),
  hair: z.string(),
  clothing: z.string(),
  accessories: z.array(z.string()),
  expression: z.string(),
  pose: z.string(),
  skin_tone: z.string().optional(),
  distinctive_features: z.array(z.string()),
  prompt_description: z.string().describe(
    'English prompt description optimized for consistent image generation of this person in different angles'
  ),
});

const backgroundAnalysisSchema = z.object({
  location_type: z.string(),
  time_of_day: z.string(),
  lighting: z.string(),
  materials: z.array(z.string()),
  colors: z.array(z.string()),
  atmosphere: z.string(),
  depth: z.string(),
  objects: z.array(z.string()),
  architectural_style: z.string().optional(),
  prompt_description: z.string().describe(
    'English prompt description optimized for recreating this space consistently'
  ),
});

type CharacterAnalysis = z.infer<typeof characterAnalysisSchema>;
type BackgroundAnalysis = z.infer<typeof backgroundAnalysisSchema>;

interface AnalyzeImageBody {
  imageUrl: string;
  entityType: 'character' | 'background';
  entityId: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body: AnalyzeImageBody = await req.json();
  const { imageUrl, entityType, entityId } = body;

  if (!imageUrl || !entityType || !entityId) {
    return NextResponse.json(
      { error: 'Missing imageUrl, entityType, entityId' },
      { status: 400 }
    );
  }

  const isCharacter = entityType === 'character';
  const schema = isCharacter ? characterAnalysisSchema : backgroundAnalysisSchema;

  const systemPrompt = isCharacter
    ? `You are an expert visual analyst for AI image generation. Analyze this character reference image and extract detailed visual attributes. The prompt_description should be in ENGLISH and optimized for generating this character consistently across multiple images with different angles and poses. Format: "A [body_type] [age] [gender] with [hair], wearing [clothing], [accessories], [expression]..."`
    : `You are an expert visual analyst for AI image generation. Analyze this location/space reference image and extract detailed environmental attributes. The prompt_description should be in ENGLISH and optimized for recreating this space consistently. Format: "[location_type] with [lighting], [materials], [atmosphere], [key objects]..."`;

  try {
    // Use OpenAI or Gemini for vision (they support image URLs)
    const { model, providerId } = await getUserModel(user.id, 'openai');
    const startTime = Date.now();

    const { object, usage } = await generateObject({
      model,
      schema,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this ${entityType} reference image in detail.`,
            },
            { type: 'image', image: imageUrl },
          ],
        },
      ],
    });

    const responseTimeMs = Date.now() - startTime;

    // Save analysis to the entity
    const analysisJson = object as unknown as Json;

    if (isCharacter) {
      const charAnalysis = object as CharacterAnalysis;
      await supabase
        .from('characters')
        .update({
          ai_visual_analysis: analysisJson,
          ai_prompt_description: charAnalysis.prompt_description,
        })
        .eq('id', entityId);
    } else {
      const bgAnalysis = object as BackgroundAnalysis;
      await supabase
        .from('backgrounds')
        .update({
          ai_visual_analysis: analysisJson,
          ai_prompt_description: bgAnalysis.prompt_description,
        })
        .eq('id', entityId);
    }

    // Log usage
    await logUsage({
      userId: user.id,
      provider: providerId,
      model: 'vision',
      task: 'analyze_image',
      inputTokens: usage?.inputTokens ?? 0,
      outputTokens: usage?.outputTokens ?? 0,
      estimatedCost: 0,
      responseTimeMs,
      success: true,
    });

    return NextResponse.json({ analysis: object });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
