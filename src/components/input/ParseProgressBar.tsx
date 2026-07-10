import { useParseStore } from '@store/parseStore';
import { useNoteStore } from '@store/noteStore';

export function ParseProgressBar() {
  const { status, progress, progressMessage } = useParseStore();
  const { isGenerating, generationProgress } = useNoteStore();

  const message = generationProgress || progressMessage;
  const percent = isGenerating ? undefined : progress;
  const isActive = status === 'parsing' || isGenerating;

  if (!isActive) return null;

  return (
    <div className="mt-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* 旋转加载图标 */}
          <svg
            className="animate-spin h-4 w-4 text-primary-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700">{message}</span>
        </div>
        {percent !== undefined && (
          <span className="text-sm text-gray-500">{percent}%</span>
        )}
      </div>
      {/* 进度条 */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            percent !== undefined
              ? 'bg-primary-500'
              : 'bg-primary-400 animate-pulse'
          }`}
          style={{
            width: percent !== undefined ? `${percent}%` : '100%',
          }}
        />
      </div>
    </div>
  );
}
