import { useState } from 'react';
import { CornellNote as CornellNoteType, ClozeLevel, NoteViewMode } from '@/types';
import { generateClozeNote, getAnswer } from '@engine/cloze.engine';
import { CueColumn } from './CueColumn';
import { NoteColumn } from './NoteColumn';
import { SummarySection } from './SummarySection';
import { VersionSwitcher } from './VersionSwitcher';
import { ClozeLevelSelector } from './ClozeLevelSelector';
import { ExportButton } from '@/components/export/ExportButton';

interface CornellNoteProps {
  note: CornellNoteType;
}

export function CornellNote({ note }: CornellNoteProps) {
  const [viewMode, setViewMode] = useState<NoteViewMode>('original');
  const [clozeLevel, setClozeLevel] = useState<ClozeLevel>('beginner');
  const [revealedAnswers, setRevealedAnswers] = useState<
    Map<string, Set<number>>
  >(new Map());

  // 计算挖空版本数据
  const clozeData =
    viewMode === 'cloze'
      ? generateClozeNote(note, clozeLevel)
      : null;

  const handleRevealAnswer = (noteId: string, segmentIndex: number) => {
    setRevealedAnswers((prev) => {
      const next = new Map(prev);
      const idSet = new Set(next.get(noteId) || []);
      idSet.add(segmentIndex);
      next.set(noteId, idSet);
      return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* 笔记标题 */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {note.title}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {note.source.title} · {note.createdAt ? new Date(note.createdAt).toLocaleString('zh-CN') : ''}
      </p>

      {/* 康奈尔三栏布局 */}
      <div className="cornell-grid border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex-1">
        {/* 线索栏 */}
        <div className="cornell-cues border-r border-gray-200 bg-primary-50/30 p-4">
          <div className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-3">
            线索栏 Cues
          </div>
          <CueColumn
            cues={
              viewMode === 'original'
                ? note.cues.map((c) => c.text)
                : clozeData?.cues || []
            }
            linkedNotes={
              viewMode === 'original'
                ? note.cues
                : undefined
            }
          />
        </div>

        {/* 笔记栏 */}
        <div className="cornell-notes p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            笔记栏 Notes
          </div>
          <NoteColumn
            notes={note.notes}
            viewMode={viewMode}
            clozeNotes={clozeData?.clozeNotes}
            revealedAnswers={revealedAnswers}
            onRevealAnswer={handleRevealAnswer}
          />
        </div>

        {/* 总结栏 */}
        <div className="cornell-summary border-t border-gray-200 bg-amber-50/50 p-4">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
            总结栏 Summary
          </div>
          <SummarySection summary={note.summary} />
        </div>
      </div>

      {/* 底部控制栏 */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <VersionSwitcher viewMode={viewMode} onChange={setViewMode} />
          {viewMode === 'cloze' && (
            <ClozeLevelSelector level={clozeLevel} onChange={setClozeLevel} />
          )}
        </div>
        <ExportButton note={note} viewMode={viewMode} clozeLevel={clozeLevel} />
      </div>
    </div>
  );
}
