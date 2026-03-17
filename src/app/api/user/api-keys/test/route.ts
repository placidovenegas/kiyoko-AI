import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AiProviderId } from '@/types';

interface TestKeyBody {
  provider: AiProviderId;
  apiKey: string;
}

/**
 * POST /api/user/api-keys/test
 * Test if an API key is valid by making a minimal request to the provider.
 */
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

    const body: TestKeyBody = await request.json();
    const { provider, apiKey } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, apiKey' },
        { status: 400 }
      );
    }

    let isValid = false;
    let errorMessage: string | null = null;

    try {
      switch (provider) {
        case 'gemini': {
          // Test with a minimal request to Gemini API
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
          );
          isValid = response.ok;
          if (!response.ok) {
            errorMessage = `Gemini API returned status ${response.status}`;
          }
          break;
        }

        case 'claude': {
          // Test with a minimal message to Claude API
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 1,
              messages: [{ role: 'user', content: 'hi' }],
            }),
          });
          // 200 or 400 (bad request but authenticated) means key is valid
          isValid = response.status !== 401 && response.status !== 403;
          if (!isValid) {
            errorMessage = `Anthropic API returned status ${response.status}`;
          }
          break;
        }

        case 'openai': {
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          isValid = response.ok;
          if (!response.ok) {
            errorMessage = `OpenAI API returned status ${response.status}`;
          }
          break;
        }

        case 'groq': {
          const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          isValid = response.ok;
          if (!response.ok) {
            errorMessage = `Groq API returned status ${response.status}`;
          }
          break;
        }

        case 'stability': {
          const response = await fetch('https://api.stability.ai/v1/engines/list', {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          isValid = response.ok;
          if (!response.ok) {
            errorMessage = `Stability API returned status ${response.status}`;
          }
          break;
        }

        default:
          return NextResponse.json(
            { error: `Unknown provider: ${provider}` },
            { status: 400 }
          );
      }
    } catch (fetchError) {
      isValid = false;
      errorMessage = fetchError instanceof Error ? fetchError.message : 'Connection failed';
    }

    return NextResponse.json({
      success: true,
      isValid,
      provider,
      error: errorMessage,
    });
  } catch (error) {
    console.error('[api-keys/test]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
