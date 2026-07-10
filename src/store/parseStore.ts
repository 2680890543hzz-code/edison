import { create } from 'zustand';
import { ParseResult } from '@/types';

interface ParseState {
  status: 'idle' | 'parsing' | 'done' | 'error';
  progress: number;
  progressMessage: string;
  result: ParseResult | null;
  error: string | null;

  setParsing: (progress: number, message: string) => void;
  setDone: (result: ParseResult) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useParseStore = create<ParseState>((set) => ({
  status: 'idle',
  progress: 0,
  progressMessage: '',
  result: null,
  error: null,

  setParsing: (progress, message) =>
    set({ status: 'parsing', progress, progressMessage: message, error: null }),

  setDone: (result) =>
    set({ status: 'done', progress: 100, result, error: null }),

  setError: (error) =>
    set({ status: 'error', error }),

  reset: () =>
    set({
      status: 'idle',
      progress: 0,
      progressMessage: '',
      result: null,
      error: null,
    }),
}));
