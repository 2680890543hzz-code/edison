import { ClozeLevel } from '@/types';

interface ClozeLevelSelectorProps {
  level: ClozeLevel;
  onChange: (level: ClozeLevel) => void;
}

const LEVEL_OPTIONS: { value: ClozeLevel; label: string; desc: string }[] = [
  { value: 'beginner', label: '🌟 初级', desc: '仅挖空最核心知识点 (~20%)' },
  {
    value: 'intermediate',
    label: '🌟🌟 中级',
    desc: '含初级 + 次重点知识点 (~40%)',
  },
  {
    value: 'advanced',
    label: '🌟🌟🌟 高级',
    desc: '含中级 + 更次一级知识点 (~60%)',
  },
];

export function ClozeLevelSelector({ level, onChange }: ClozeLevelSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">挖空级别：</span>
      <div className="flex bg-gray-100 rounded-lg p-0.5">
        {LEVEL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all
              ${
                level === opt.value
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            title={opt.desc}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
