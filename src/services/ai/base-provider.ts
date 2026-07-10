import { AIProvider, ChatMessage, ChatOptions } from './types';

export abstract class BaseProvider implements AIProvider {
  abstract readonly name: string;
  abstract readonly models: string[];

  protected apiKey: string;
  protected baseURL?: string;
  protected defaultModel: string;
  protected temperature: number;
  protected maxTokens: number;

  constructor(config: {
    apiKey: string;
    baseURL?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL;
    this.defaultModel = config.model;
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 4096;
  }

  abstract chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;
  abstract chatStream(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncIterable<string>;

  protected resolveOptions(options?: ChatOptions): Required<ChatOptions> & { temperature: number } {
    return {
      temperature: options?.temperature ?? this.temperature,
      maxTokens: options?.maxTokens ?? this.maxTokens,
      model: options?.model ?? this.defaultModel,
    };
  }
}
