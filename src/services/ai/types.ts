export interface AIProvider {
  readonly name: string;
  readonly models: string[];
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;
  chatStream(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncIterable<string>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface ProviderConfig {
  type: 'claude' | 'openai' | 'ollama';
  apiKey: string;
  baseURL?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}
