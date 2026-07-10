import OpenAI from 'openai';
import { BaseProvider } from './base-provider';
import { ChatMessage, ChatOptions } from './types';

export class OpenAIProvider extends BaseProvider {
  readonly name = 'OpenAI';
  readonly models = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
    // 兼容第三方模型（通过 baseURL 切换）
    'deepseek-chat',
    'deepseek-reasoner',
    'qwen-plus',
    'qwen-max',
  ];

  private client: OpenAI;

  constructor(config: {
    apiKey: string;
    baseURL?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    super(config);
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseURL || 'https://api.openai.com/v1',
      dangerouslyAllowBrowser: true, // Electron 渲染进程环境
    });
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    const opts = this.resolveOptions(options);

    const response = await this.client.chat.completions.create({
      model: opts.model,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    });

    return response.choices[0]?.message?.content || '';
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncIterable<string> {
    const opts = this.resolveOptions(options);

    const stream = await this.client.chat.completions.create({
      model: opts.model,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}
