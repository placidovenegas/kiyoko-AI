import Anthropic from '@anthropic-ai/sdk';
import {
  BaseProvider,
  type TextGenerationInput,
  type TextGenerationOutput,
  type StreamChunk,
} from './base';

export class ClaudeProvider extends BaseProvider {
  id = 'claude';
  name = 'Anthropic Claude';

  async generateText(
    input: TextGenerationInput,
    apiKey: string
  ): Promise<TextGenerationOutput> {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: input.maxTokens ?? 4096,
      system: input.systemPrompt ?? '',
      messages: [{ role: 'user', content: input.prompt }],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return {
      text,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      model: 'claude-sonnet-4-20250514',
    };
  }

  async *streamText(
    input: TextGenerationInput,
    apiKey: string
  ): AsyncIterable<StreamChunk> {
    const client = new Anthropic({ apiKey });

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: input.maxTokens ?? 4096,
      system: input.systemPrompt ?? '',
      messages: [{ role: 'user', content: input.prompt }],
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield { text: event.delta.text, done: false };
      }
    }
    yield { text: '', done: true };
  }
}
