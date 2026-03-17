import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  BaseProvider,
  type TextGenerationInput,
  type TextGenerationOutput,
  type ImageGenerationInput,
  type ImageGenerationOutput,
  type StreamChunk,
} from './base';

export class GeminiProvider extends BaseProvider {
  id = 'gemini';
  name = 'Google Gemini';

  async generateText(
    input: TextGenerationInput,
    apiKey: string
  ): Promise<TextGenerationOutput> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: input.systemPrompt,
    });

    const result = await model.generateContent(input.prompt);
    const response = result.response;
    const text = response.text();
    const usage = response.usageMetadata;

    return {
      text,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      model: 'gemini-2.0-flash',
    };
  }

  async *streamText(
    input: TextGenerationInput,
    apiKey: string
  ): AsyncIterable<StreamChunk> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: input.systemPrompt,
    });

    const result = await model.generateContentStream(input.prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      yield { text, done: false };
    }
    yield { text: '', done: true };
  }

  async generateImage(
    input: ImageGenerationInput,
    apiKey: string
  ): Promise<ImageGenerationOutput> {
    // Gemini Imagen 3 via REST API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: input.prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '16:9',
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini Imagen error: ${response.statusText}`);
    }

    const data = await response.json();
    const imageBytes = data.predictions?.[0]?.bytesBase64Encoded;

    if (!imageBytes) {
      throw new Error('No image generated');
    }

    return {
      imageUrl: `data:image/png;base64,${imageBytes}`,
      model: 'imagen-3.0-generate-001',
    };
  }
}
