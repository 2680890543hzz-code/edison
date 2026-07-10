import * as fs from 'fs';
import * as path from 'path';
import { ParseResult } from './index';

// pdf-parse is CommonJS, need dynamic import in Electron
export async function parsePDF(filePath: string): Promise<ParseResult> {
  const pdfParse = (await import('pdf-parse')).default;
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);

  const plainText = data.text.replace(/\s{3,}/g, '\n\n').trim();

  return {
    type: 'pdf',
    title: data.info?.Title || path.basename(filePath, '.pdf'),
    plainText,
    metadata: {
      source: filePath,
      wordCount: plainText.length,
      pageCount: data.numpages,
      author: data.info?.Author || '',
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
