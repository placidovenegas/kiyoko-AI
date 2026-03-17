import {
  BaseProvider,
  type TextGenerationInput,
  type TextGenerationOutput,
  type ImageGenerationInput,
  type ImageGenerationOutput,
  type StreamChunk,
} from './base';

export class StabilityProvider extends BaseProvider {
  id = 'stability';
  name = 'Stability AI';

  async generateText(
    _input: TextGenerationInput,
    _apiKey: string
  ): Promise<TextGenerationOutput> {
    throw new Error('Stability AI does not support text generation');
  }

  async *streamText(
    _input: TextGenerationInput,
    _apiKey: string
  ): AsyncIterable<StreamChunk> {
    throw new Error('Stability AI does not support text streaming');
  }

  async generateImage(
    input: ImageGenerationInput,
    apiKey: string
  ): Promise<ImageGenerationOutput> {
    const formData = new FormData();
    formData.append('prompt', input.prompt);
    formData.append('output_format', 'webp');

    const response = await fetch(
      'https://api.stability.ai/v2beta/stable-image/generate/sd3',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'image/*',
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Stability AI error: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return {
      imageUrl: `data:image/webp;base64,${base64}`,
      model: 'stable-diffusion-3',
    };
  }
}
