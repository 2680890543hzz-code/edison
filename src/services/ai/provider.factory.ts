import { AIProvider, ProviderConfig } from './types';
import { ClaudeProvider } from './claude-provider';
import { OpenAIProvider } from './openai-provider';

export function createProvider(config: ProviderConfig): AIProvider {
  switch (config.type) {
    case 'claude':
      return new ClaudeProvider({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });
    case 'openai':
    case 'ollama': // Ollama 兼容 OpenAI API 格式
      return new OpenAIProvider({
        apiKey: config.apiKey || 'ollama', // Ollama 不需要真实 key
        baseURL: config.type === 'ollama'
          ? (config.baseURL || 'http://localhost:11434/v1')
          : config.baseURL,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });
    default:
      throw new Error(`不支持的 AI 提供商: ${config.type}`);
  }
}

export function getDefaultProviderConfig(): ProviderConfig {
  return {
    type: 'claude',
    apiKey: '',
    model: 'claude-sonnet-4-6',
    temperature: 0.7,
    maxTokens: 4096,
  };
}
