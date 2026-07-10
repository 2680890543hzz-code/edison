import { useState } from 'react';
import { HiArrowRight } from 'react-icons/hi2';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

export function UrlInput({ onSubmit, disabled }: UrlInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="粘贴链接（B站、YouTube、网页文章...）"
        disabled={disabled}
        className="w-full px-5 py-4 pr-14 text-base bg-white border-2 border-gray-200 rounded-xl
                   focus:border-primary-400 focus:ring-4 focus:ring-primary-50
                   outline-none transition-all disabled:opacity-50
                   placeholder:text-gray-400 shadow-sm"
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
  );
}
