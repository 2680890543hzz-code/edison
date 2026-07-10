import { useState } from 'react';
import { HiArrowRight, HiOutlineExclamationCircle } from 'react-icons/hi2';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

export function UrlInput({ onSubmit, disabled }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (input: string): string | null => {
    if (!input || !input.trim()) {
      return '请输入链接地址';
    }
    const trimmed = input.trim();
    // 标准URL
    if (/^https?:\/\//.test(trimmed)) return null;
    // B站短链
    if (/^b23\.tv\//.test(trimmed)) return null;
    // B站BV号
    if (/^BV[A-Za-z0-9]{10}$/.test(trimmed)) return null;
    // 常见域名
    if (/^[\w.-]+\.(com|cn|org|net|io|tv|me|cc)\b/.test(trimmed)) return null;

    return '请输入完整的链接地址（以 http:// 或 https:// 开头）';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = url.trim();
    const validationError = validateUrl(trimmed);

    if (validationError) {
      setError(validationError);
      return;
    }

    // B站BV号补全
    let finalUrl = trimmed;
    if (/^BV[A-Za-z0-9]{10}$/.test(trimmed)) {
      finalUrl = `https://www.bilibili.com/video/${trimmed}`;
    }
    if (/^b23\.tv\//.test(trimmed)) {
      finalUrl = `https://${trimmed}`;
    }
    if (!finalUrl.startsWith('http')) {
      finalUrl = `https://${finalUrl}`;
    }

    onSubmit(finalUrl);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError('');
          }}
          placeholder="粘贴链接... 支持网页文章、B站视频、YouTube等"
          disabled={disabled}
          className={`
            w-full px-5 py-4 pr-14 text-base bg-white border-2 rounded-xl
            focus:border-primary-400 focus:ring-4 focus:ring-primary-50
            outline-none transition-all disabled:opacity-50
            placeholder:text-gray-400 shadow-sm
            ${error ? 'border-red-300' : 'border-gray-200'}
          `}
        />
        <button
          type="submit"
          disabled={disabled || !url.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary-500 text-white
                     rounded-lg hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          <HiArrowRight className="w-5 h-5" />
        </button>
      </form>

      {error && (
        <div className="mt-2 flex items-start gap-1.5 text-sm text-red-600">
          <HiOutlineExclamationCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400">
        <p>支持的链接格式：</p>
        <ul className="mt-1 space-y-0.5 list-disc list-inside">
          <li>网页文章：https://example.com/article</li>
          <li>B站视频：https://www.bilibili.com/video/BVxxx 或直接粘贴 BV 号</li>
          <li>YouTube：https://www.youtube.com/watch?v=xxx</li>
        </ul>
      </div>
    </div>
  );
}
