import { NoteItem, NoteViewMode, ClozeSegment } from '@/types';

interface NoteColumnProps {
  notes: NoteItem[];
  viewMode: NoteViewMode;
  clozeNotes?: Map<string, ClozeSegment[]>;
  revealedAnswers: Map<string, Set<number>>;
  onRevealAnswer: (noteId: string, segmentIndex: number) => void;
}

export function NoteColumn({
  notes,
  viewMode,
  clozeNotes,
  revealedAnswers,
  onRevealAnswer,
}: NoteColumnProps) {
  return (
    <div className="space-y-4">
      {notes.map((note, noteIndex) => {
        const importanceColor =
          note.importance >= 0.85
            ? 'border-red-300'
            : note.importance >= 0.6
            ? 'border-amber-300'
            : 'border-blue-300';

        if (viewMode === 'original') {
          // 原文模式
          return (
            <div
              key={note.id}
              className={`pl-3 border-l-2 ${importanceColor} transition-colors`}
            >
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {note.text}
              </p>
              {note.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {note.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // 挖空模式
        const segments = clozeNotes?.get(note.id) || [];
        const revealedForNote = revealedAnswers.get(note.id) || new Set();

        return (
          <div
            key={note.id}
            className={`pl-3 border-l-2 ${importanceColor} transition-colors`}
          >
            <p className="text-sm text-gray-800 leading-relaxed">
              {segments.map((seg, segIndex) => {
                if (seg.type === 'text') {
                  return <span key={segIndex}>{seg.content}</span>;
                }

                // 挖空
                const isRevealed = revealedForNote.has(segIndex);
                return (
                  <span
                    key={segIndex}
                    onClick={() =>
                      !isRevealed &&
                      onRevealAnswer(note.id, segIndex)
                    }
                    className={`cloze-blank ${isRevealed ? 'revealed' : ''}`}
                    title={seg.hint || ''}
                  >
                    {isRevealed ? seg.answer : '______'}
                  </span>
                );
              })}
            </p>
            {note.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {note.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {notes.length === 0 && (
        <div className="text-sm text-gray-400 italic">暂无笔记内容</div>
      )}
    </div>
  );
}
