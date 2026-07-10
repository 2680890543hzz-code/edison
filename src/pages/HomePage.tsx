import { useNavigate } from 'react-router-dom';
import { InputPanel } from '@components/input/InputPanel';
import { useNoteStore } from '@store/noteStore';
import { HiOutlineClock, HiOutlineArrowRight } from 'react-icons/hi2';

export function HomePage() {
  const navigate = useNavigate();
  const { history } = useNoteStore();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero 区域 */}
      <div className="text-center mb-10 mt-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          AI 康奈尔笔记
        </h1>
        <p className="text-gray-500 text-base">
          粘贴链接或上传文件，AI 自动生成康奈尔笔记，支持挖空学习模式
        </p>
      </div>

      {/* 输入面板 */}
      <InputPanel />

      {/* 历史记录 */}
      {history.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineClock className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-700">历史笔记</h2>
          </div>
          <div className="grid gap-3">
            {history.map((note) => (
              <button
                key={note.id}
                onClick={() => navigate(`/note/${note.id}`)}
                className="flex items-center justify-between p-4 bg-white border border-gray-200
                           rounded-xl text-left hover:border-primary-300 hover:shadow-sm
                           transition-all group"
              >
                <div>
                  <h3 className="font-medium text-gray-800 group-hover:text-primary-700 transition-colors">
                    {note.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {note.cues.length} 条线索 · {note.notes.length} 条笔记
                    {' · '}
                    {new Date(note.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <HiOutlineArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {history.length === 0 && (
        <div className="text-center mt-16 py-12">
          <p className="text-4xl mb-4">📚</p>
          <p className="text-gray-400 text-sm">
            还没有笔记记录，输入链接或上传文件开始创建你的第一个康奈尔笔记吧！
          </p>
        </div>
      )}
    </div>
  );
}
