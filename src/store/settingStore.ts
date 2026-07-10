import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProviderConfig, AIProviderType } from '@/types';
import { getDefaultProviderConfig } from '@services/ai/provider.factory';

interface SettingState {
  aiProvider: ProviderConfig;

  setProviderType: (type: AIProviderType) => void;
  setApiKey: (key: string) => void;
  setBaseURL: (url: string) => void;
  setModel: (model: string) => void;
  updateProvider: (config: Partial<ProviderConfig>) => void;
}

export const useSettingStore = create<SettingState>()(
  persist(
    (set, get) => ({
      aiProvider: getDefaultProviderConfig(),

      setProviderType: (type) =>
        set((s) => {
          const newConfig = { ...s.aiProvider, type };
          // 切换类型时更新默认模型
          if (type === 'openai') newConfig.model = 'gpt-4o';
          else if (type === 'claude') newConfig.model = 'claude-sonnet-4-6';
          else if (type === 'ollama') newConfig.model = 'qwen2.5:7b';
          return { aiProvider: newConfig };
        }),

      setApiKey: (key) =>
        set((s) => ({ aiProvider: { ...s.aiProvider, apiKey: key } })),

      setBaseURL: (url) =>
        set((s) => ({ aiProvider: { ...s.aiProvider, baseURL: url } })),

      setModel: (model) =>
        set((s) => ({ aiProvider: { ...s.aiProvider, model } })),

      updateProvider: (config) =>
        set((s) => ({ aiProvider: { ...s.aiProvider, ...config } })),
    }),
    {
      name: 'cornell-notes-settings',
    }
  )
);
