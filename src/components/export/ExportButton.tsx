import { useState, useCallback } from 'react';
import { CornellNote, NoteViewMode, ClozeLevel } from '@/types';
import { HiOutlineArrowDownTray, HiOutlineDocumentText, HiOutlineDocument } from 'react-icons/hi2';

interface ExportButtonProps {
  note: CornellNote;
  viewMode: NoteViewMode;
  clozeLevel: ClozeLevel;
}

export function ExportButton({ note, viewMode, clozeLevel }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(
    async (format: 'pdf' | 'word') => {
      setIsOpen(false);
      setIsExporting(true);

      try {
        const ext = format === 'pdf' ? 'pdf' : 'docx';
        const defaultPath = `${note.title.replace(/[\\/:*?"<>|]/g, '_')}_${viewMode === 'cloze' ? '挖空版' : '原文版'}.${ext}`;

        const filePath = await window.electronAPI.saveFileDialog({
          defaultPath,
          filters: [
            format === 'pdf'
              ? { name: 'PDF 文档', extensions: ['pdf'] }
              : { name: 'Word 文档', extensions: ['docx'] },
          ],
        });

        if (!filePath) {
          setIsExporting(false);
          return;
        }

        if (format === 'pdf') {
          await window.electronAPI.exportPDF({
            note,
            mode: viewMode,
            clozeLevel: viewMode === 'cloze' ? clozeLevel : undefined,
            includeAnswerKey: viewMode === 'cloze',
            filePath,
          });
        } else {
          await window.electronAPI.exportWord({
            note,
            mode: viewMode,
            clozeLevel: viewMode === 'cloze' ? clozeLevel : undefined,
            includeAnswerKey: viewMode === 'cloze',
            filePath,
          });
        }

        alert(`导出成功！\n文件已保存到: ${filePath}`);
      } catch (err: any) {
        alert(`导出失败: ${err.message}`);
      } finally {
        setIsExporting(false);
      }
    },
    [note, viewMode, clozeLevel]
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg
                   hover:bg-primary-600 disabled:opacity-50 transition-colors text-sm font-medium"
      >
        <HiOutlineArrowDownTray className="w-4 h-4" />
        {isExporting ? '导出中...' : '导出'}
      </button>

      {isOpen && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          {/* 下拉菜单 */}
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
            <button
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700
                         hover:bg-gray-50 transition-colors"
            >
              <HiOutlineDocumentText className="w-5 h-5 text-red-500" />
              导出为 PDF
            </button>
            <button
              onClick={() => handleExport('word')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700
                         hover:bg-gray-50 transition-colors"
            >
              <HiOutlineDocument className="w-5 h-5 text-blue-500" />
              导出为 Word
            </button>
          </div>
        </>
      )}
    </div>
  );
}
