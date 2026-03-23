import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAvailableProvider, logUsage } from '@/lib/ai/router';

interface GenerateImageBody {
  prompt: string;
  projectId: string;
  videoId?: string;
  sceneId?: string;
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

    const body: GenerateImageBody = await request.json();
    const { prompt: rawPrompt, projectId, videoId, sceneId } = body;

    if (!rawPrompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 }
      );
    }

    // Verify user owns this project if projectId is provided
    if (projectId) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (projectError || !project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
    }

    // Load style preset for the project to enhance the prompt
    let prompt = rawPrompt;
    if (projectId) {
      const { data: stylePreset } = await supabase
        .from('style_presets')
        .select('prompt_prefix, prompt_suffix, negative_prompt')
        .eq('project_id', projectId)
        .eq('is_default', true)
        .single();

      if (stylePreset) {
        const prefix = stylePreset.prompt_prefix?.trim();
        const suffix = stylePreset.prompt_suffix?.trim();
        if (prefix) prompt = `${prefix} ${prompt}`;
        if (suffix) prompt = `${prompt} ${suffix}`;
      }
    }

    const provider = await getAvailableProvider(user.id, 'image');
    const startTime = Date.now();

    if (!provider.instance.generateImage) {
      return NextResponse.json(
        { error: 'Selected provider does not support image generation' },
        { status: 500 }
      );
    }

    const result = await provider.instance.generateImage(
      {
        prompt,
        width: 1024,
        height: 1024,
      },
      provider.apiKey
    );

    const responseTimeMs = Date.now() - startTime;

    await logUsage({
      userId: user.id,
      projectId: projectId ?? undefined,
      provider: provider.providerId,
      model: provider.model,
      task: 'generate-image',
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      responseTimeMs,
      success: true,
    });

    // If we have sceneId, save the image to Storage and DB
    let storedUrl = result.imageUrl;
    if (sceneId && projectId) {
      try {
        const admin = createAdminClient();
        const db = admin ?? supabase;

        // Download the generated image
        const imageResponse = await fetch(result.imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download generated image: ${imageResponse.status}`);
        }
        const imageArrayBuffer = await imageResponse.arrayBuffer();
        const imageBuffer = Buffer.from(imageArrayBuffer);

        // Upload to Supabase Storage
        const timestamp = Date.now();
        const storagePath = `projects/${projectId}/videos/${videoId ?? 'unassigned'}/scenes/${sceneId}/images/${timestamp}.png`;

        const { error: uploadError } = await db.storage
          .from('kiyoko-storage')
          .upload(storagePath, imageBuffer, {
            contentType: 'image/png',
            upsert: false,
          });

        if (uploadError) {
          console.error('[generate-image] Storage upload error:', uploadError);
        } else {
          // Get the public URL
          const { data: urlData } = db.storage
            .from('kiyoko-storage')
            .getPublicUrl(storagePath);

          storedUrl = urlData.publicUrl;

          // Set previous media for this scene to is_current = false
          await db
            .from('scene_media')
            .update({ is_current: false })
            .eq('scene_id', sceneId)
            .eq('media_type', 'image')
            .eq('is_current', true);

          // Get next version number
          const { data: lastMedia } = await db
            .from('scene_media')
            .select('version')
            .eq('scene_id', sceneId)
            .eq('media_type', 'image')
            .order('version', { ascending: false })
            .limit(1)
            .single();

          const nextVersion = (lastMedia?.version ?? 0) + 1;

          // Insert the new scene_media record
          const { error: insertError } = await db
            .from('scene_media')
            .insert({
              scene_id: sceneId,
              media_type: 'image',
              file_url: storedUrl,
              file_path: storagePath,
              prompt_used: prompt,
              generator: provider.providerId,
              version: nextVersion,
              is_current: true,
              status: 'ready',
            });

          if (insertError) {
            console.error('[generate-image] DB insert error:', insertError);
          }
        }
      } catch (saveError) {
        // Don't fail the whole request if saving fails — still return the image URL
        console.error('[generate-image] Error saving to storage/DB:', saveError);
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: storedUrl,
      provider: provider.providerId,
      model: result.model,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.startsWith('NO_PROVIDER_AVAILABLE')) {
      return NextResponse.json(
        { error: message },
        { status: 429 }
      );
    }

    console.error('[generate-image]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
