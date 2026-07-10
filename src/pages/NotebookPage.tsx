import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '@store/noteStore';
import { CornellNote } from '@components/notebook/CornellNote';
import { HiOutlineArrowLeft } from 'react-icons/hi2';

export function NotebookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { originalNote, history } = useNoteStore();

  // 从历史中查找或使用当前笔记
  const note = originalNote?.id === id ? originalNote : history.find((n) => n.id === id);

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-6xl mb-4">😕</p>
        <p className="text-gray-500 mb-4">找不到该笔记</p>
        <button
          onClick={() => navigate('/')}
          className="text-primary-500 hover:text-primary-600 font-medium"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-full">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700
                   transition-colors mb-4 w-fit"
      >
        <HiOutlineArrowLeft className="w-4 h-4" />
        <span className="text-sm">返回首页</span>
      </button>

      {/* 康奈尔笔记 */}
      <CornellNote note={note} />
    </div>
  );
}
