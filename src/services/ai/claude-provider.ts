import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './base-provider';
import { ChatMessage, ChatOptions } from './types';

export class ClaudeProvider extends BaseProvider {
  readonly name = 'Claude';
  readonly models = [
    'claude-opus-4-8',
    'claude-sonnet-4-6',
    'claude-haiku-4-5',
    'claude-sonnet-4-5',
  ];

  private client: Anthropic;

  constructor(config: {
    apiKey: string;
    baseURL?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    super(config);
    this.client = new Anthropic({
      apiKey: this.apiKey,
      baseURL: this.baseURL,
    });
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    const opts = this.resolveOptions(options);

    // 分离 system 消息
    const systemMsg = messages.filter((m) => m.role === 'system');
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await this.client.messages.create({
      model: opts.model,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
      system: systemMsg.map((m) => m.content).join('\n\n') || undefined,
      messages: chatMessages,
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock?.text || '';
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncIterable<string> {
    const opts = this.resolveOptions(options);

    const systemMsg = messages.filter((m) => m.role === 'system');
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const stream = await this.client.messages.create({
      model: opts.model,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
      system: systemMsg.map((m) => m.content).join('\n\n') || undefined,
      messages: chatMessages,
      stream: true,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }
}
