import { create } from 'zustand';
import { CornellNote, ClozeLevel, NoteViewMode } from '@/types';

interface NoteState {
  // 当前笔记（原文版本）
  originalNote: CornellNote | null;
  // 查看模式
  viewMode: NoteViewMode;
  // 当前挖空级别
  clozeLevel: ClozeLevel;
  // 生成状态
  isGenerating: boolean;
  generationProgress: string;
  // 历史笔记
  history: CornellNote[];

  // Actions
  setOriginalNote: (note: CornellNote) => void;
  setViewMode: (mode: NoteViewMode) => void;
  setClozeLevel: (level: ClozeLevel) => void;
  setIsGenerating: (v: boolean) => void;
  setGenerationProgress: (msg: string) => void;
  addToHistory: (note: CornellNote) => void;
  clearCurrentNote: () => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  originalNote: null,
  viewMode: 'original',
  clozeLevel: 'beginner',
  isGenerating: false,
  generationProgress: '',
  history: [],

  setOriginalNote: (note) =>
    set({ originalNote: note, viewMode: 'original', clozeLevel: 'beginner' }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setClozeLevel: (level) => set({ clozeLevel: level }),

  setIsGenerating: (v) => set({ isGenerating: v }),

  setGenerationProgress: (msg) => set({ generationProgress: msg }),

  addToHistory: (note) => {
    const { history } = get();
    // 避免重复
    const exists = history.find((n) => n.id === note.id);
    if (!exists) {
      set({ history: [note, ...history].slice(0, 50) }); // 最多保存50条
    }
  },

  clearCurrentNote: () => set({ originalNote: null, viewMode: 'original' }),
}));
