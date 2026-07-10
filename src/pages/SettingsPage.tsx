import { useSettingStore } from '@store/settingStore';
import { AIProviderType } from '@/types';
import {
  HiOutlineKey,
  HiOutlineGlobeAlt,
  HiOutlineCpuChip,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { useState } from 'react';

const PROVIDER_OPTIONS: { value: AIProviderType; label: string; icon: string }[] = [
  { value: 'claude', label: 'Claude (Anthropic)', icon: '🧠' },
  { value: 'openai', label: 'OpenAI（兼容 DeepSeek 等）', icon: '🤖' },
  { value: 'ollama', label: 'Ollama（本地部署）', icon: '💻' },
];

const MODEL_OPTIONS: Record<AIProviderType, string[]> = {
  claude: ['claude-sonnet-4-6', 'claude-opus-4-8', 'claude-haiku-4-5'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'deepseek-chat', 'deepseek-reasoner', 'qwen-plus', 'qwen-max'],
  ollama: ['qwen2.5:7b', 'qwen2.5:14b', 'llama3.1:8b', 'mistral:7b', 'deepseek-r1:8b'],
};

export function SettingsPage() {
  const { aiProvider, setProviderType, setApiKey, setBaseURL, setModel } =
    useSettingStore();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Zustand persist 自动保存到 localStorage
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">设置</h1>
      <p className="text-gray-500 text-sm mb-8">
        配置 AI 服务与常规选项
      </p>

      <div className="space-y-6">
        {/* AI 提供商选择 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineCpuChip className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-800">AI 服务提供商</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {PROVIDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setProviderType(opt.value)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  aiProvider.type === opt.value
                    ? 'border-primary-400 bg-primary-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl block mb-1">{opt.icon}</span>
                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* API 密钥 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineKey className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-800">API 密钥</h2>
          </div>

          <input
            type="password"
            value={aiProvider.apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              aiProvider.type === 'ollama'
                ? 'Ollama 本地部署无需密钥'
                : `输入你的 ${aiProvider.type === 'claude' ? 'Claude' : 'OpenAI'} API 密钥...`
            }
            disabled={aiProvider.type === 'ollama'}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg
                       focus:border-primary-400 focus:ring-4 focus:ring-primary-50
                       outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* 自定义接口地址 */}
        {aiProvider.type !== 'claude' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineGlobeAlt className="w-5 h-5 text-gray-500" />
              <h2 className="font-semibold text-gray-800">
                {aiProvider.type === 'ollama' ? 'Ollama 服务地址' : '自定义接口地址（可选）'}
              </h2>
            </div>

            <input
              type="url"
              value={aiProvider.baseURL || ''}
              onChange={(e) => setBaseURL(e.target.value)}
              placeholder={
                aiProvider.type === 'ollama'
                  ? 'http://localhost:11434/v1'
                  : 'https://api.openai.com/v1'
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg
                         focus:border-primary-400 focus:ring-4 focus:ring-primary-50
                         outline-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-2">
              {aiProvider.type === 'ollama'
                ? 'Ollama 默认运行在本地 11434 端口'
                : '可填入代理地址或兼容 OpenAI 格式的第三方服务地址'}
            </p>
          </div>
        )}

        {/* 模型选择 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineCpuChip className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-800">模型选择</h2>
          </div>

          <select
            value={aiProvider.model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg
                       focus:border-primary-400 focus:ring-4 focus:ring-primary-50
                       outline-none text-sm"
          >
            {MODEL_OPTIONS[aiProvider.type].map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>

          {/* 自定义模型 */}
          <div className="mt-3">
            <input
              type="text"
              value={
                MODEL_OPTIONS[aiProvider.type].includes(aiProvider.model)
                  ? ''
                  : aiProvider.model
              }
              onChange={(e) => e.target.value && setModel(e.target.value)}
              placeholder="或手动输入模型名称..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg
                         focus:border-primary-400 focus:ring-4 focus:ring-primary-50
                         outline-none text-sm"
            />
          </div>
        </div>

        {/* 保存 */}
        <button
          onClick={handleSave}
          className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium
                     hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <HiOutlineCheckCircle className="w-5 h-5" />
              已保存
            </>
          ) : (
            '保存设置'
          )}
        </button>
      </div>
    </div>
  );
}
