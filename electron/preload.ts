import { contextBridge, ipcRenderer } from 'electron';

export interface ParseResultData {
  type: string;
  title: string;
  plainText: string;
  metadata: Record<string, unknown>;
  segments: { index: number; text: string }[];
}

export interface ElectronAPI {
  openFileDialog: (options: {
    filters: { name: string; extensions: string[] }[];
  }) => Promise<string[]>;
  saveFileDialog: (options: {
    defaultPath?: string;
    filters: { name: string; extensions: string[] }[];
  }) => Promise<string | null>;

  parseFile: (filePath: string) => Promise<ParseResultData>;
  parseUrl: (url: string) => Promise<ParseResultData>;

  onParseProgress: (callback: (progress: number, message: string) => void) => void;
  removeParseProgressListener: () => void;

  exportPDF: (data: {
    note: unknown;
    mode: string;
    clozeLevel?: string;
    includeAnswerKey: boolean;
    filePath: string;
  }) => Promise<void>;
  exportWord: (data: {
    note: unknown;
    mode: string;
    clozeLevel?: string;
    includeAnswerKey: boolean;
    filePath: string;
  }) => Promise<void>;
}

const electronAPI: ElectronAPI = {
  openFileDialog: (options) =>
    ipcRenderer.invoke('file:openDialog', options),
  saveFileDialog: (options) =>
    ipcRenderer.invoke('file:saveDialog', options),
  parseFile: (filePath) =>
    ipcRenderer.invoke('parse:file', filePath),
  parseUrl: (url) =>
    ipcRenderer.invoke('parse:url', url),
  onParseProgress: (callback) => {
    ipcRenderer.on('parse:progress', (_event, progress, message) => {
      callback(progress, message);
    });
  },
  removeParseProgressListener: () => {
    ipcRenderer.removeAllListeners('parse:progress');
  },
  exportPDF: (data) =>
    ipcRenderer.invoke('export:pdf', data),
  exportWord: (data) =>
    ipcRenderer.invoke('export:word', data),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
