import { CueItem } from '@/types';

interface CueColumnProps {
  cues: string[];
  linkedNotes?: CueItem[];
}

export function CueColumn({ cues, linkedNotes }: CueColumnProps) {
  return (
    <ul className="space-y-3">
      {cues.map((cue, index) => {
        const hasLink = linkedNotes && linkedNotes[index]?.linkedNoteIds?.length;
        return (
          <li
            key={index}
            className="text-sm text-primary-800 leading-relaxed cursor-pointer
                       hover:text-primary-600 transition-colors
                       border-l-2 border-primary-200 pl-3 py-1
                       hover:border-primary-400"
            title={hasLink ? `关联笔记条目: ${linkedNotes?.[index]?.linkedNoteIds?.join(', ')}` : undefined}
          >
            {cue}
          </li>
        );
      })}
      {cues.length === 0 && (
        <li className="text-sm text-gray-400 italic">暂无线索条目</li>
      )}
    </ul>
  );
}
