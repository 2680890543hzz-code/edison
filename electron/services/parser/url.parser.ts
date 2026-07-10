import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { ParseResult } from './index';

export async function parseUrl(url: string): Promise<ParseResult> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) {
    throw new Error('无法提取网页正文内容，请检查链接是否有效');
  }

  const plainText = article.textContent.replace(/\s{3,}/g, '\n\n').trim();

  return {
    type: 'url',
    title: article.title || '未命名网页',
    plainText,
    metadata: {
      source: url,
      wordCount: plainText.length,
      siteName: article.siteName || '',
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
