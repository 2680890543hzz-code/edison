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

// 更宽松的URL检测——支持各种常见格式
function isURL(input: string): boolean {
  // 标准网址
  if (/^https?:\/\//.test(input)) return true;
  // 短链接或B站链接
  if (/^b23\.tv\//.test(input)) return true;
  // B站bv号格式
  if (/^BV[A-Za-z0-9]{10}$/.test(input)) return true;
  return false;
}

// 支持的文件扩展名列表
const SUPPORTED_EXTENSIONS = new Set([
  '.pdf', '.docx', '.doc', '.txt', '.md', '.markdown',
  '.mp4', '.avi', '.mkv', '.mov', '.webm', '.flv', '.wmv',
  '.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac',
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.csv', '.json', '.xml', '.html', '.htm',
  '.ppt', '.pptx', '.xls', '.xlsx',
]);

function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

export async function parseFileContent(
  input: string,
  onProgress: ProgressCallback
): Promise<ParseResult> {
  // 第一步：检测是否是URL
  if (isURL(input)) {
    onProgress(10, '正在抓取网页内容...');
    try {
      const { parseUrl } = await import('./url.parser');
      const result = await parseUrl(input);
      onProgress(100, '网页解析完成');
      return result;
    } catch (err: any) {
      throw new Error(`网页解析失败: ${err.message}`);
    }
  }

  // 第二步：处理文件
  const ext = getFileExtension(input);

  if (!fs.existsSync(input)) {
    throw new Error(
      `文件不存在: ${input}\n\n` +
      `请确认文件路径是否正确。如果输入的是网页链接，请确保以 http:// 或 https:// 开头。`
    );
  }

  // 检查是否是支持的文件格式
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw new Error(
      `不支持的文件格式: ${ext}\n\n` +
      `目前支持的格式: PDF、Word(.docx)、TXT、Markdown、\n` +
      `视频(.mp4/.avi/.mkv/.mov)、音频(.mp3/.wav/.m4a)`
    );
  }

  switch (ext) {
    // ---- 文档 ----
    case '.pdf':
      onProgress(10, '正在解析 PDF 文件...');
      try {
        const { parsePDF } = await import('./pdf.parser');
        const result = await parsePDF(input);
        onProgress(100, 'PDF 解析完成');
        return result;
      } catch (err: any) {
        throw new Error(`PDF解析失败: ${err.message}`);
      }

    case '.docx':
    case '.doc':
      onProgress(10, '正在解析 Word 文档...');
      try {
        const { parseWord } = await import('./word.parser');
        const result = await parseWord(input);
        onProgress(100, 'Word 文档解析完成');
        return result;
      } catch (err: any) {
        throw new Error(`Word文档解析失败: ${err.message}`);
      }

    case '.txt':
    case '.md':
    case '.markdown':
    case '.csv':
    case '.json':
    case '.xml':
    case '.html':
    case '.htm':
      onProgress(50, '正在读取文本文件...');
      try {
        const content = fs.readFileSync(input, 'utf-8');
        onProgress(100, '文本文件读取完成');
        return {
          type: 'pdf' as const,
          title: path.basename(input, ext),
          plainText: content,
          metadata: {
            source: input,
            wordCount: content.length,
            fileType: ext.replace('.', ''),
          },
          segments: segmentText(content),
        };
      } catch (err: any) {
        throw new Error(`文本文件读取失败: ${err.message}`);
      }

    // ---- 视频 ----
    case '.mp4':
    case '.avi':
    case '.mkv':
    case '.mov':
    case '.webm':
    case '.flv':
    case '.wmv':
      onProgress(10, '正在处理视频文件...');
      throw new Error(
        '视频解析功能将在后续版本中支持。\n\n' +
        '临时方案：\n' +
        '1. 使用剪映/必剪等工具导出视频字幕为TXT文件\n' +
        '2. 上传该TXT文件即可生成康奈尔笔记'
      );

    // ---- 音频 ----
    case '.mp3':
    case '.wav':
    case '.m4a':
    case '.ogg':
    case '.flac':
    case '.aac':
      onProgress(10, '正在处理音频文件...');
      throw new Error(
        '音频解析功能将在后续版本中支持。\n\n' +
        '临时方案：\n' +
        '1. 使用飞书妙计/通义听悟等工具将音频转为文字\n' +
        '2. 上传转换后的TXT文件即可生成康奈尔笔记'
      );

    // ---- 图片（提示转为OCR）----
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.gif':
    case '.webp':
      throw new Error(
        '图片文件暂不支持直接解析。\n\n' +
        '建议：使用OCR工具提取图片中的文字，保存为TXT文件后上传。'
      );

    // ---- Office ----
    case '.ppt':
    case '.pptx':
    case '.xls':
    case '.xlsx':
      throw new Error(
        `${ext} 文件暂不支持。\n\n` +
        '建议：将内容复制粘贴到TXT文件中上传。'
      );

    default:
      throw new Error(
        `不支持的文件格式: ${ext}\n\n` +
        `支持: PDF, Word(.docx), TXT, Markdown, HTML, CSV, JSON\n` +
        `视频/音频功能正在开发中`
      );
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
