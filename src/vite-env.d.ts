export {};

declare global {
  interface Window {
    electronAPI: {
      openFileDialog: (options: {
        filters: { name: string; extensions: string[] }[];
      }) => Promise<string[]>;
      saveFileDialog: (options: {
        defaultPath?: string;
        filters: { name: string; extensions: string[] }[];
      }) => Promise<string | null>;
      parseFile: (filePath: string) => Promise<{
        type: string;
        title: string;
        plainText: string;
        metadata: Record<string, unknown>;
        segments: { index: number; text: string }[];
      }>;
      parseUrl: (url: string) => Promise<{
        type: string;
        title: string;
        plainText: string;
        metadata: Record<string, unknown>;
        segments: { index: number; text: string }[];
      }>;
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
    };
  }
}
