import * as fs from 'fs';
import * as path from 'path';
import { ParseResult } from './index';

export async function parseWord(filePath: string): Promise<ParseResult> {
  const mammoth = (await import('mammoth')).default;
  const result = await mammoth.extractRawText({ path: filePath });
  const plainText = result.value.replace(/\s{3,}/g, '\n\n').trim();

  if (result.messages.length > 0) {
    console.warn('Mammoth 解析警告:', result.messages);
  }

  return {
    type: 'word',
    title: path.basename(filePath, path.extname(filePath)),
    plainText,
    metadata: {
      source: filePath,
      wordCount: plainText.length,
    },
    segments: segmentText(plainText),
  };
}

function segmentText(text: string, maxLength = 4000): { index: number; text: string }[] {
  const paragraphs = text.split(/\n\s*\n/);
  const segments: { index: number; text: string }[] = [];
  let current = '';
  let index = 0;

  for (const para of paragraphs) {
    if (current.length + para.length > maxLength && current.length > 0) {
      segments.push({ index, text: current.trim() });
      index++;
      current = para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }

  if (current.trim()) {
    segments.push({ index, text: current.trim() });
  }

  return segments;
}
