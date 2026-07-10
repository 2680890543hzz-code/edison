import { useState, useCallback, DragEvent } from 'react';
import { HiOutlineCloudArrowUp } from 'react-icons/hi2';

interface FileDropZoneProps {
  onFileDrop: (filePath: string) => void;
  disabled?: boolean;
}

const SUPPORTED_FORMATS = [
  { ext: '.pdf', label: 'PDF 文档', icon: '📄' },
  { ext: '.docx', label: 'Word 文档', icon: '📝' },
  { ext: '.txt', label: '文本文件', icon: '📃' },
  { ext: '.mp4,.avi,.mkv,.mov', label: '视频文件', icon: '🎬' },
  { ext: '.mp3,.wav,.m4a', label: '音频文件', icon: '🎵' },
];

export function FileDropZone({ onFileDrop, disabled }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      // 从拖拽获取文件路径（Electron 中通过 dataTransfer）
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        // Electron 中 file.path 可用
        const filePath = (file as any).path || file.name;
        onFileDrop(filePath);
      }
    },
    [disabled, onFileDrop]
  );

  const handleClick = useCallback(async () => {
    if (disabled) return;

    try {
      const filters = [
        { name: '支持的文件', extensions: ['pdf', 'docx', 'doc', 'txt', 'md', 'mp4', 'avi', 'mkv', 'mov', 'webm', 'mp3', 'wav', 'm4a', 'ogg'] },
      ];
      const files = await window.electronAPI.openFileDialog({ filters });
      if (files.length > 0) {
        onFileDrop(files[0]);
      }
    } catch (err) {
      console.error('打开文件对话框失败:', err);
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
        transition-all duration-200
        ${isDragging ? 'border-primary-400 bg-primary-50 scale-[1.02]' : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <HiOutlineCloudArrowUp
        className={`mx-auto mb-4 w-12 h-12 transition-colors ${isDragging ? 'text-primary-500' : 'text-gray-400'}`}
      />
      <p className="text-base font-medium text-gray-700 mb-2">
        拖拽文件到此处，或点击选择文件
      </p>
      <p className="text-sm text-gray-500 mb-4">
        支持 PDF、Word、TXT、视频、音频等多种格式
      </p>
      <div className="flex justify-center gap-3 flex-wrap">
        {SUPPORTED_FORMATS.map((fmt) => (
          <span
            key={fmt.ext}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600"
          >
            <span>{fmt.icon}</span>
            {fmt.label}
          </span>
        ))}
      </div>
    </div>
  );
}
