import Groq from 'groq-sdk';
import {
  BaseProvider,
  type TextGenerationInput,
  type TextGenerationOutput,
  type StreamChunk,
} from './base';

export class GroqProvider extends BaseProvider {
  id = 'groq';
  name = 'Groq';

  async generateText(
    input: TextGenerationInput,
    apiKey: string
  ): Promise<TextGenerationOutput> {
    const client = new Groq({ apiKey });

    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: input.maxTokens ?? 4096,
      temperature: input.temperature ?? 0.7,
      messages: [
        ...(input.systemPrompt
          ? [{ role: 'system' as const, content: input.systemPrompt }]
          : []),
        { role: 'user' as const, content: input.prompt },
      ],
    });

    return {
      text: completion.choices[0]?.message?.content ?? '',
      inputTokens: completion.usage?.prompt_tokens ?? 0,
      outputTokens: completion.usage?.completion_tokens ?? 0,
      model: 'llama-3.3-70b-versatile',
    };
  }

  async *streamText(
    input: TextGenerationInput,
    apiKey: string
  ): AsyncIterable<StreamChunk> {
    const client = new Groq({ apiKey });

    const stream = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: input.maxTokens ?? 4096,
      stream: true,
      messages: [
        ...(input.systemPrompt
          ? [{ role: 'system' as const, content: input.systemPrompt }]
          : []),
        { role: 'user' as const, content: input.prompt },
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) yield { text, done: false };
    }
    yield { text: '', done: true };
  }
}
