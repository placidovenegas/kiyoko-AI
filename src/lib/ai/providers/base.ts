export interface TextGenerationInput {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface TextGenerationOutput {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface ImageGenerationInput {
  prompt: string;
  width?: number;
  height?: number;
  style?: string;
}

export interface ImageGenerationOutput {
  imageUrl: string;
  model: string;
}

export interface StreamChunk {
  text: string;
  done: boolean;
}

export abstract class BaseProvider {
  abstract id: string;
  abstract name: string;

  abstract generateText(
    input: TextGenerationInput,
    apiKey: string
  ): Promise<TextGenerationOutput>;

  abstract streamText(
    input: TextGenerationInput,
    apiKey: string
  ): AsyncIterable<StreamChunk>;

  /** Only required for providers that support image generation */
  generateImage?(
    input: ImageGenerationInput,
    apiKey: string
  ): Promise<ImageGenerationOutput>;
}
