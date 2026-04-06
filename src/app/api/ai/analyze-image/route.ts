import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserModel } from '@/lib/ai/get-user-model';
import { generateObject } from 'ai';
import { z } from 'zod';
import { logUsage } from '@/lib/ai/sdk-router';
import type { Json } from '@/types/database.types';
import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
  parseApiJson,
} from '@/lib/observability/server';

const characterAnalysisSchema = z.object({
  age_range: z.string(),
  body_type: z.string(),
  facial_features: z.string(),
  hair: z.string(),
  clothing: z.string(),
  accessories: z.array(z.string()),
  expression: z.string(),
  pose: z.string(),
  skin_tone: z.string().nullable(),
  distinctive_features: z.array(z.string()),
  prompt_description: z.string().describe(
    'English prompt description optimized for consistent image generation of this person in different angles'
  ),
  reference_sheet_prompt: z.string().describe(
    'Full English turnaround/reference sheet prompt based on the uploaded real-person image'
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
  architectural_style: z.string().nullable(),
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
  persistReferenceSheetPrompt?: boolean;
}

export async function POST(req: NextRequest) {
  const requestContext = createApiRequestContext(req);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return apiUnauthorized(requestContext, 'Not authenticated');
  }

  const { data: body, response } = await parseApiJson<AnalyzeImageBody>(req, requestContext);
  if (response || !body) {
    return response;
  }

  const { imageUrl, entityType, entityId, persistReferenceSheetPrompt = false } = body;

  if (!imageUrl || !entityType || !entityId) {
    return apiBadRequest(requestContext, 'Missing imageUrl, entityType, entityId');
  }

  const isCharacter = entityType === 'character';
  const schema = isCharacter ? characterAnalysisSchema : backgroundAnalysisSchema;

  const systemPrompt = isCharacter
    ? `You are an expert visual analyst and prompt engineer for AI image generation.

Analyze this real-person character reference image and extract detailed visual attributes.

Rules:
- prompt_description must be in ENGLISH and optimized for generating this character consistently across multiple images with different angles and poses.
- reference_sheet_prompt must be in ENGLISH and must be a production-ready turnaround/reference sheet prompt.
- The reference_sheet_prompt must describe a professional 2x3 character sheet on a solid bright green chroma key background.
- Include front view, side view, back view, 3/4 view, close-up facial expression panel, and portrait/full-body support panel.
- Keep detected hairstyle, face, body type, clothing, accessories, and expression faithful to the uploaded person.
- Use polished 3D animated feature-film wording similar to a Pixar-style reference sheet.
- If skin tone is not clearly visible return null.
- Every field in the schema must be present.`
    : `You are an expert visual analyst for AI image generation. Analyze this location/space reference image and extract detailed environmental attributes. The prompt_description should be in ENGLISH and optimized for recreating this space consistently. Format: "[location_type] with [lighting], [materials], [atmosphere], [key objects]..." If the architectural style is not clear return null. Every field in the schema must be present.`;

  try {
    // Use OpenAI or Gemini for vision (they support image URLs)
    const { model, providerId } = await getUserModel(user.id, 'openai');
    const startTime = Date.now();

    logServerEvent('analyze-image', requestContext, 'Analyzing reference image', {
      userId: user.id,
      entityType,
      entityId,
      providerId,
      imageUrl,
    });

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
      const { data: characterData } = await supabase
        .from('characters')
        .select('metadata')
        .eq('id', entityId)
        .single();

      const currentMetadata = (characterData?.metadata ?? {}) as Record<string, unknown>;

      const nextMetadata: Record<string, unknown> = {
        ...currentMetadata,
      };

      if (persistReferenceSheetPrompt) {
        nextMetadata.ai_reference_sheet_prompt = charAnalysis.reference_sheet_prompt;
        nextMetadata.ai_reference_sheet_source_image_url = imageUrl;
        nextMetadata.ai_reference_sheet_updated_at = new Date().toISOString();
      }

      await supabase
        .from('characters')
        .update({
          ai_visual_analysis: {
            ...(analysisJson as Record<string, unknown>),
            source_image_url: imageUrl,
          } as Json,
          ai_prompt_description: charAnalysis.prompt_description,
          metadata: nextMetadata as Json,
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

    return apiJson(requestContext, { analysis: object });
  } catch (err: unknown) {
    return apiError(requestContext, 'analyze-image', err, {
      message: 'No se pudo analizar la imagen de referencia',
      extra: {
        entityType: body.entityType,
        entityId: body.entityId,
      },
    });
  }
}
