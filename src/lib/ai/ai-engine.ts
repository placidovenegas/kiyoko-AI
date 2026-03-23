// AI Engine — executeAI (generateText) and streamAI (streamText) with automatic
// provider fallback. Uses resolveProviderChain for ordered provider selection.

import { generateText, streamText, type ModelMessage } from 'ai';
import { resolveProviderChain, markProviderFailed, type AITask } from './provider-registry';

interface AIEngineOptions {
  task?: AITask;
  mode?: string;                        // "auto" or specific providerId
  userKeys?: Record<string, string>;    // from loadUserKeys()
  system?: string;
  messages: ModelMessage[];
  temperature?: number;
  maxTokens?: number;
}

interface ExecuteAIResult {
  text: string;
  providerId: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Execute AI with automatic fallback using generateText (non-streaming).
 * Tries providers in order until one succeeds.
 */
export async function executeAI(options: AIEngineOptions): Promise<ExecuteAIResult> {
  const { task = 'chat', mode = 'auto', userKeys = {}, system, messages, temperature, maxTokens } = options;

  const chain = resolveProviderChain(task, mode, userKeys);
  if (chain.length === 0) {
    throw new Error('NO_PROVIDER_AVAILABLE: No hay proveedores de IA disponibles.');
  }

  let lastError: Error | null = null;

  for (const { model, providerId } of chain) {
    try {
      const result = await generateText({
        model,
        system,
        messages,
        maxRetries: 0,
        ...(temperature != null ? { temperature } : {}),
        ...(maxTokens != null ? { maxTokens } : {}),
      });

      return {
        text: result.text,
        providerId,
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      lastError = new Error(msg);
      console.warn(`[ai-engine] ${providerId} FAILED: ${msg.slice(0, 150)}`);
      markProviderFailed(providerId, msg);
    }
  }

  throw lastError ?? new Error('All AI providers failed.');
}

interface StreamAIOptions extends AIEngineOptions {
  onFinish?: (params: { text: string; providerId: string; usage: { inputTokens: number; outputTokens: number } }) => void;
}

/**
 * Stream AI with automatic fallback using streamText.
 * Returns the streamText result from the first working provider.
 * Uses "first chunk" verification to detect silent failures.
 */
export async function streamAI(options: StreamAIOptions): Promise<{
  stream: ReadableStream<string>;
  providerId: string;
}> {
  const { task = 'chat', mode = 'auto', userKeys = {}, system, messages, temperature, maxTokens, onFinish } = options;

  const chain = resolveProviderChain(task, mode, userKeys);
  if (chain.length === 0) {
    throw new Error('NO_PROVIDER_AVAILABLE: No hay proveedores de IA disponibles.');
  }

  let lastError: Error | null = null;

  for (const { model, providerId } of chain) {
    try {
      const result = streamText({
        model,
        system,
        messages,
        maxRetries: 0,
        ...(temperature != null ? { temperature } : {}),
        ...(maxTokens != null ? { maxTokens } : {}),
        onFinish: onFinish
          ? ({ text, usage }) => {
              onFinish({
                text,
                providerId,
                usage: {
                  inputTokens: usage?.inputTokens ?? 0,
                  outputTokens: usage?.outputTokens ?? 0,
                },
              });
            }
          : undefined,
      });

      // Verify the stream works by reading the first chunk
      const reader = result.textStream.getReader();
      let firstChunk: ReadableStreamReadResult<string>;

      try {
        const textPromise = Promise.resolve(result.text).then(
          () => null as never,
          (e: unknown) => { throw e; },
        );
        const readPromise = reader.read();
        firstChunk = await Promise.race([readPromise, textPromise]);
      } catch (readError) {
        try { reader.releaseLock(); } catch { /* ignore */ }
        throw readError;
      }

      if (firstChunk.done && !firstChunk.value) {
        try { reader.releaseLock(); } catch { /* ignore */ }
        throw new Error(`Provider ${providerId} returned empty response`);
      }

      // Provider works — re-assemble the stream with the already-read first chunk
      const firstValue = firstChunk.value;
      const stream = new ReadableStream<string>({
        async start(controller) {
          if (firstValue) controller.enqueue(firstValue);
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) controller.enqueue(value);
            }
          } finally {
            controller.close();
          }
        },
      });

      return { stream, providerId };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      lastError = new Error(msg);
      console.warn(`[ai-engine] stream ${providerId} FAILED: ${msg.slice(0, 150)}`);
      markProviderFailed(providerId, msg);
    }
  }

  throw lastError ?? new Error('All AI providers failed during streaming.');
}
