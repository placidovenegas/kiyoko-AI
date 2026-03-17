import OpenAI from 'openai';
import {
  BaseProvider,
  type TextGenerationInput,
  type TextGenerationOutput,
  type ImageGenerationInput,
  type ImageGenerationOutput,
  type StreamChunk,
} from './base';

export class OpenAIProvider extends BaseProvider {
  id = 'openai';
  name = 'OpenAI';

  async generateText(
    input: TextGenerationInput,
    apiKey: string
  ): Promise<TextGenerationOutput> {
    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
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
      model: 'gpt-4o-mini',
    };
  }

  async *streamText(
    input: TextGenerationInput,
    apiKey: string
  ): AsyncIterable<StreamChunk> {
    const client = new OpenAI({ apiKey });

    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
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

  async generateImage(
    input: ImageGenerationInput,
    apiKey: string
  ): Promise<ImageGenerationOutput> {
    const client = new OpenAI({ apiKey });

    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: input.prompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) throw new Error('No image generated');

    return { imageUrl, model: 'dall-e-3' };
  }
}
