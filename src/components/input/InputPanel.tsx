import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UrlInput } from './UrlInput';
import { FileDropZone } from './FileDropZone';
import { ParseProgressBar } from './ParseProgressBar';
import { useParseStore } from '@store/parseStore';
import { useNoteStore } from '@store/noteStore';
import { useSettingStore } from '@store/settingStore';
import { createProvider } from '@services/ai/provider.factory';
import { generateCornellNote } from '@engine/cornell.engine';
import { HiOutlineLink, HiOutlineDocument } from 'react-icons/hi2';

import { ParseResult } from '@/types';

type InputMode = 'url' | 'file';

export function InputPanel() {
  const navigate = useNavigate();
  const [inputMode, setInputMode] = useState<InputMode>('url');
  const { status, progressMessage, setParsing, setDone, setError, reset } =
    useParseStore();
  const { setOriginalNote, setIsGenerating, setGenerationProgress, addToHistory } =
    useNoteStore();
  const { aiProvider } = useSettingStore();

  const handleUrlSubmit = useCallback(
    async (url: string) => {
      if (!aiProvider.apiKey) {
        alert('请先在设置页面配置 AI 服务的 API Key');
        return;
      }

      reset();
      setParsing(0, '正在解析链接...');

      try {
        const result = await window.electronAPI.parseUrl(url);
        const parseResult: ParseResult = {
          type: result.type as ParseResult['type'],
          title: result.title,
          plainText: result.plainText,
          metadata: result.metadata,
          segments: result.segments,
        };
        setDone(parseResult);

        // 开始生成笔记
        setIsGenerating(true);
        setGenerationProgress('正在生成康奈尔笔记...');

        const provider = createProvider(aiProvider);
        const note = await generateCornellNote(provider, parseResult, (progress) => {
          setGenerationProgress(progress.message);
        });

        setOriginalNote(note);
        addToHistory(note);
        setIsGenerating(false);

        navigate(`/note/${note.id}`);
      } catch (err: any) {
        setError(err.message || '解析失败');
        setIsGenerating(false);
      }
    },
    [aiProvider, navigate, reset, setParsing, setDone, setError, setOriginalNote, setIsGenerating, setGenerationProgress, addToHistory]
  );

  const handleFileDrop = useCallback(
    async (filePath: string) => {
      if (!aiProvider.apiKey) {
        alert('请先在设置页面配置 AI 服务的 API Key');
        return;
      }

      reset();
      setParsing(0, '正在解析文件...');

      try {
        const result = await window.electronAPI.parseFile(filePath);
        const parseResult: ParseResult = {
          type: result.type as ParseResult['type'],
          title: result.title,
          plainText: result.plainText,
          metadata: result.metadata,
          segments: result.segments,
        };
        setDone(parseResult);

        setIsGenerating(true);
        setGenerationProgress('正在生成康奈尔笔记...');

        const provider = createProvider(aiProvider);
        const note = await generateCornellNote(provider, parseResult, (progress) => {
          setGenerationProgress(progress.message);
        });

        setOriginalNote(note);
        addToHistory(note);
        setIsGenerating(false);

        navigate(`/note/${note.id}`);
      } catch (err: any) {
        setError(err.message || '解析失败');
        setIsGenerating(false);
      }
    },
    [aiProvider, navigate, reset, setParsing, setDone, setError, setOriginalNote, setIsGenerating, setGenerationProgress, addToHistory]
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* 输入模式切换 */}
      <div className="flex justify-center gap-2 mb-6">
        <button
          onClick={() => setInputMode('url')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            inputMode === 'url'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <HiOutlineLink className="w-4 h-4" />
          链接输入
        </button>
        <button
          onClick={() => setInputMode('file')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            inputMode === 'file'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <HiOutlineDocument className="w-4 h-4" />
          文件上传
        </button>
      </div>

      {/* 输入区域 */}
      {inputMode === 'url' ? (
        <UrlInput onSubmit={handleUrlSubmit} disabled={status === 'parsing'} />
      ) : (
        <FileDropZone onFileDrop={handleFileDrop} disabled={status === 'parsing'} />
      )}

      {/* 进度条 */}
      {(status === 'parsing' || progressMessage) && (
        <ParseProgressBar />
      )}

      {/* 错误提示 */}
      {status === 'error' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {useParseStore.getState().error}
        </div>
      )}
    </div>
  );
}
