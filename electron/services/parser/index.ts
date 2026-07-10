import * as fs from 'fs';
import * as path from 'path';

export interface ParseProgress {
  progress: number;
  message: string;
}

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

type ProgressCallback = (progress: number, message: string) => void;

function isURL(input: string): boolean {
  return /^https?:\/\//.test(input);
}

function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

export async function parseFileContent(
  input: string,
  onProgress: ProgressCallback
): Promise<ParseResult> {
  // URL 解析 - 懒加载 jsdom 避免启动错误
  if (isURL(input)) {
    onProgress(10, '正在抓取网页内容...');
    const { parseUrl } = await import('./url.parser');
    const result = await parseUrl(input);
    onProgress(100, '网页解析完成');
    return result;
  }

  // 文件解析
  const ext = getFileExtension(input);

  if (!fs.existsSync(input)) {
    throw new Error(`文件不存在: ${input}`);
  }

  switch (ext) {
    case '.pdf':
      onProgress(10, '正在解析 PDF 文件...');
      const { parsePDF } = await import('./pdf.parser');
      const pdfResult = await parsePDF(input);
      onProgress(100, 'PDF 解析完成');
      return pdfResult;

    case '.docx':
    case '.doc':
      onProgress(10, '正在解析 Word 文档...');
      const { parseWord } = await import('./word.parser');
      const wordResult = await parseWord(input);
      onProgress(100, 'Word 文档解析完成');
      return wordResult;

    case '.mp4':
    case '.avi':
    case '.mkv':
    case '.mov':
    case '.webm':
      onProgress(10, '正在处理视频文件...');
      throw new Error('视频解析功能将在后续版本中支持');

    case '.mp3':
    case '.wav':
    case '.m4a':
    case '.ogg':
    case '.flac':
      onProgress(10, '正在处理音频文件...');
      throw new Error('音频解析功能将在后续版本中支持');

    case '.txt':
    case '.md':
      onProgress(50, '正在读取文本文件...');
      const content = fs.readFileSync(input, 'utf-8');
      onProgress(100, '文本文件读取完成');
      return {
        type: 'pdf' as const,
        title: path.basename(input, ext),
        plainText: content,
        metadata: { source: input, wordCount: content.length, fileType: 'txt' },
        segments: segmentText(content),
      };

    default:
      throw new Error(`不支持的文件格式: ${ext}`);
  }
}

function segmentText(text: string, maxSegmentLength = 4000): ParseSegment[] {
  const paragraphs = text.split(/\n\s*\n/);
  const segments: ParseSegment[] = [];
  let currentSegment = '';
  let index = 0;

  for (const para of paragraphs) {
    if (currentSegment.length + para.length > maxSegmentLength && currentSegment.length > 0) {
      segments.push({ index, text: currentSegment.trim() });
      index++;
      currentSegment = para;
    } else {
      currentSegment += (currentSegment ? '\n\n' : '') + para;
    }
  }

  if (currentSegment.trim()) {
    segments.push({ index, text: currentSegment.trim() });
  }

  return segments;
}
