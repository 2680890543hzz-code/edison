import { NoteViewMode } from '@/types';

interface VersionSwitcherProps {
  viewMode: NoteViewMode;
  onChange: (mode: NoteViewMode) => void;
}

export function VersionSwitcher({ viewMode, onChange }: VersionSwitcherProps) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-0.5">
      <button
        onClick={() => onChange('original')}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
          viewMode === 'original'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        📄 原文版本
      </button>
      <button
        onClick={() => onChange('cloze')}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
          viewMode === 'cloze'
            ? 'bg-white text-primary-700 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        ✏️ 挖空版本
      </button>
    </div>
  );
}
