// ===== 笔记核心类型 =====

export interface CueItem {
  id: string;
  text: string;
  linkedNoteIds: string[];
}

export interface NoteItem {
  id: string;
  text: string;
  importance: number;
  keywords: string[];
  isFillable: boolean;
}

export interface CornellNote {
  id: string;
  title: string;
  cues: CueItem[];
  notes: NoteItem[];
  summary: string;
  source: NoteSource;
  createdAt: string;
}

export interface NoteSource {
  type: 'url' | 'pdf' | 'word' | 'video' | 'audio';
  title: string;
  source: string;
  wordCount: number;
  [key: string]: unknown;
}

// ===== 挖空类型 =====

export type ClozeLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ClozeSegment {
  type: 'text' | 'blank';
  content?: string;
  answer?: string;
  hint?: string;
  noteId?: string;
}

export interface ClozeResult {
  noteId: string;
  segments: ClozeSegment[];
}

// ===== 解析类型 =====

export interface ParseSegment {
  index: number;
  text: string;
}

export interface ParseResult {
  type: 'url' | 'pdf' | 'word' | 'video' | 'audio';
  title: string;
  plainText: string;
  metadata: Record<string, unknown>;
  segments: ParseSegment[];
}

// ===== AI 服务类型 =====

export type AIProviderType = 'claude' | 'openai' | 'ollama';

export interface ProviderConfig {
  type: AIProviderType;
  apiKey: string;
  baseURL?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AIProvider {
  readonly name: string;
  readonly models: string[];
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;
  chatStream(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncIterable<string>;
}

// ===== 导出类型 =====

export type ExportFormat = 'pdf' | 'word';
export type NoteViewMode = 'original' | 'cloze';

export interface ExportOptions {
  format: ExportFormat;
  mode: NoteViewMode;
  clozeLevel?: ClozeLevel;
  includeAnswerKey: boolean;
}
