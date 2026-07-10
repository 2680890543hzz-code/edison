import { useState, useCallback, DragEvent } from 'react';
import { HiOutlineCloudArrowUp, HiOutlineExclamationTriangle } from 'react-icons/hi2';

interface FileDropZoneProps {
  onFileDrop: (filePath: string) => void;
  disabled?: boolean;
}

const SUPPORTED_CATEGORIES = [
  { exts: ['.pdf'], label: 'PDF', icon: '📄' },
  { exts: ['.docx', '.doc'], label: 'Word', icon: '📝' },
  { exts: ['.txt', '.md', '.csv', '.json'], label: '文本', icon: '📃' },
  { exts: ['.mp4', '.avi', '.mkv', '.mov', '.webm'], label: '视频', icon: '🎬' },
  { exts: ['.mp3', '.wav', '.m4a', '.ogg'], label: '音频', icon: '🎵' },
];

// 实时获取 Electron 文件路径的辅助函数
function getElectronFilePath(file: File): string {
  return (file as any).path || file.name;
}

export function FileDropZone({ onFileDrop, disabled }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragFiles, setDragFiles] = useState<string[]>([]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    // Electron 中拖拽文件进来时 dataTransfer 已经有文件信息
    const items = Array.from(e.dataTransfer.files || []).map(f => f.name);
    setDragFiles(items);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragFiles([]);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setDragFiles([]);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (!files || files.length === 0) {
        alert('未检测到文件。请确认已从文件管理器中拖拽文件到此处。');
        return;
      }

      const file = files[0];
      const filePath = getElectronFilePath(file);
      console.log('FileDropZone: 拖拽文件路径 =', filePath);

      if (!filePath || filePath === file.name) {
        alert(
          '无法获取文件完整路径，请点击此区域打开文件对话框选择文件。\n\n' +
          '(拖拽文件时Electron需要获取文件的完整磁盘路径)'
        );
        return;
      }

      onFileDrop(filePath);
    },
    [disabled, onFileDrop]
  );

  const handleClick = useCallback(async () => {
    if (disabled) return;

    try {
      const filters = [
        {
          name: '所有支持的文件',
          extensions: ['pdf', 'docx', 'doc', 'txt', 'md', 'csv', 'json', 'xml', 'html',
                       'mp4', 'avi', 'mkv', 'mov', 'webm', 'flv', 'wmv',
                       'mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac'],
        },
        { name: '文档', extensions: ['pdf', 'docx', 'doc', 'txt', 'md', 'csv'] },
        { name: '视频', extensions: ['mp4', 'avi', 'mkv', 'mov', 'webm'] },
        { name: '音频', extensions: ['mp3', 'wav', 'm4a', 'ogg'] },
      ];

      const files = await window.electronAPI.openFileDialog({ filters });
      console.log('FileDropZone: 文件对话框选择了 =', files);

      if (files && files.length > 0) {
        onFileDrop(files[0]);
      }
    } catch (err: any) {
      console.error('打开文件对话框失败:', err);
      alert('打开文件对话框失败: ' + (err.message || '未知错误'));
    }
  }, [disabled, onFileDrop]);

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
        transition-all duration-200 select-none
        ${isDragging ? 'border-primary-400 bg-primary-50 scale-[1.02] shadow-lg' : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {isDragging && dragFiles.length > 0 ? (
        <>
          <HiOutlineCloudArrowUp className="mx-auto mb-4 w-12 h-12 text-primary-500" />
          <p className="text-base font-medium text-primary-700 mb-2">
            松手即可解析文件
          </p>
          <p className="text-sm text-primary-500">
            {dragFiles[0]}
            {dragFiles.length > 1 ? ` 等${dragFiles.length}个文件` : ''}
          </p>
        </>
      ) : (
        <>
          <HiOutlineCloudArrowUp className="mx-auto mb-4 w-12 h-12 text-gray-400" />
          <p className="text-base font-medium text-gray-700 mb-2">
            拖拽文件到此处，或点击选择文件
          </p>
          <p className="text-sm text-gray-500 mb-4">
            支持 PDF、Word、TXT、Markdown、CSV、视频、音频等格式
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {SUPPORTED_CATEGORIES.map((cat) => (
              <span
                key={cat.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600"
              >
                <span>{cat.icon}</span>
                {cat.label}
              </span>
            ))}
          </div>
        </>
      )}

      {/* 提示信息 */}
      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <HiOutlineExclamationTriangle className="w-3.5 h-3.5" />
        <span>如果拖拽文件无反应，请点击此区域打开文件对话框</span>
      </div>
    </div>
  );
}
