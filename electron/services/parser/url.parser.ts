import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { ParseResult } from './index';

/**
 * B站视频信息接口返回结构
 */
interface BilibiliVideoInfo {
  code: number;
  message: string;
  data?: {
    bvid: string;
    aid: number;
    cid: number;
    title: string;
    desc: string;
    subtitle?: {
      list?: Array<{
        subtitle_url: string;
        lan_doc: string;
      }>;
    };
    owner?: {
      name: string;
    };
    pages?: Array<{
      cid: number;
      part: string;
      duration: number;
    }>;
  };
}

// 通用浏览器 UA
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// 移动端 UA（有时能绕过限制）
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

/**
 * 判断是否是 B站/Bilibili 链接
 */
function isBilibiliUrl(url: string): boolean {
  return /bilibili\.com\/video\//.test(url) || /b23\.tv\//.test(url);
}

/**
 * 从 B站 URL 中提取 BV 号
 */
function extractBvid(url: string): string | null {
  // BV1Fsi6Y1EHU 格式
  const bvMatch = url.match(/BV[A-Za-z0-9]{10}/);
  if (bvMatch) return bvMatch[0];

  // av123456 格式
  const avMatch = url.match(/av(\d+)/);
  if (avMatch) return avMatch[0];

  return null;
}

/**
 * 通过 B站官方 API 获取视频信息（含字幕）
 * 这个方法不用抓HTML页面，直接调API，反爬虫要求低
 */
async function parseBilibili(url: string): Promise<ParseResult> {
  const bvid = extractBvid(url);
  if (!bvid) {
    throw new Error('无法从链接中提取 B站视频 ID，请检查链接格式');
  }

  // 1. 获取视频基本信息（含 cid、标题、简介）
  const viewUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
  const viewResp = await fetch(viewUrl, {
    headers: {
      'User-Agent': BROWSER_UA,
      Referer: 'https://www.bilibili.com/',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
  });

  if (!viewResp.ok) {
    throw new Error(`B站API请求失败 (${viewResp.status})，请检查视频是否存在或是否需要登录`);
  }

  const viewData: BilibiliVideoInfo = await viewResp.json();

  if (viewData.code !== 0) {
    // 常见的错误码处理
    if (viewData.code === -404) {
      throw new Error('B站视频不存在或已被删除');
    }
    if (viewData.code === -403) {
      throw new Error('B站访问被拒绝（-403），该视频可能有访问限制');
    }
    throw new Error(`B站API返回错误: ${viewData.message || '未知错误'} (code: ${viewData.code})`);
  }

  const video = viewData.data!;
  const cid = video.cid;
  const title = video.title || '未命名B站视频';
  let content = `标题：${title}\n\n`;
  if (video.desc) {
    content += `简介：${video.desc}\n\n`;
  }

  // 2. 尝试获取字幕
  try {
    const subtitleUrl = `https://api.bilibili.com/x/player/v2?bvid=${bvid}&cid=${cid}`;
    const subResp = await fetch(subtitleUrl, {
      headers: {
        'User-Agent': BROWSER_UA,
        Referer: 'https://www.bilibili.com/',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    });

    if (subResp.ok) {
      const subData = await subResp.json();
      const subtitleList = subData?.data?.subtitle?.subtitles || [];

      if (subtitleList.length > 0) {
        // 优先中文，否则取第一个
        const zhSub = subtitleList.find((s: any) => s.lan_doc?.includes('中文')) || subtitleList[0];
        if (zhSub?.subtitle_url) {
          const subContentUrl = zhSub.subtitle_url.startsWith('http')
            ? zhSub.subtitle_url
            : `https:${zhSub.subtitle_url}`;

          const subContentResp = await fetch(subContentUrl, {
            headers: { 'User-Agent': BROWSER_UA, Referer: 'https://www.bilibili.com/' },
          });

          if (subContentResp.ok) {
            const subJson = await subContentResp.json();
            const subtitles = subJson?.body || [];
            const textLines = subtitles.map((item: any) => item.content || '').filter(Boolean);
            content += `字幕内容（${zhSub.lan_doc || '未知语言'}）：\n${textLines.join('\n')}`;
          }
        }
      } else {
        // 无字幕时，用视频简介作为主要内容
        content += `（该视频无字幕，将以视频标题和简介作为分析内容）\n`;
      }
    }
  } catch {
    // 字幕获取失败不是致命错误，继续用简介
    content += `（字幕获取失败，将以视频标题和简介作为分析内容）\n`;
  }

  // 3. 如果内容太少，补充说明
  if (content.length < 200) {
    content += `\n注意：该视频无明显文字内容（可能为纯画面视频），AI 生成的笔记将主要基于标题和简介。建议手动补充更多描述或使用含字幕的视频。`;
  }

  return {
    type: 'url',
    title: `${title} - B站视频`,
    plainText: content,
    metadata: {
      source: url,
      bvid,
      cid,
      wordCount: content.length,
      siteName: '哔哩哔哩',
      hasSubtitle: content.includes('字幕'),
    },
    segments: segmentText(content),
  };
}

/**
 * 通用网页解析（增强版：带更完整的请求头）
 */
async function parseGeneralUrl(url: string): Promise<ParseResult> {
  // 策略1：标准 Desktop UA
  let html = '';
  let lastError: Error | null = null;

  const strategies = [
    { ua: BROWSER_UA, label: '桌面端' },
    { ua: MOBILE_UA, label: '移动端' },
  ];

  for (const strategy of strategies) {
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': strategy.ua,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (resp.ok) {
        html = await resp.text();
        break;
      }

      // 403/451 等错误
      if (resp.status === 403 || resp.status === 451) {
        lastError = new Error(
          `网站返回 ${resp.status}（访问被拒绝），该网站可能有反爬虫保护或地区限制，建议尝试以下方法：\n` +
            `1. 如果是B站链接，会自动使用API模式解析\n` +
            `2. 手动复制页面文字内容粘贴到文本文件后上传\n` +
            `3. 检查是否需要登录或使用代理访问`
        );
        continue;
      }

      lastError = new Error(`网站返回状态码 ${resp.status}`);
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!html && lastError) {
    throw lastError;
  }

  if (!html) {
    throw new Error('无法获取网页内容，请检查链接是否可访问');
  }

  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.textContent || article.textContent.trim().length < 50) {
    // Readability 解析失败时，尝试从 body 提取纯文本作为兜底
    const bodyText = dom.window.document.body?.textContent || '';
    const cleaned = bodyText.replace(/\s{3,}/g, '\n').trim().slice(0, 8000);

    if (cleaned.length < 50) {
      throw new Error(
        '无法提取网页正文内容。可能原因：\n' +
          '1. 页面是纯 JS 渲染的单页应用（SPA）\n' +
          '2. 页面有严格的反爬虫机制\n\n' +
          '建议：手动复制页面内容粘贴到 .txt 文件后上传'
      );
    }

    return {
      type: 'url',
      title: dom.window.document.title || '未命名网页',
      plainText: cleaned,
      metadata: {
        source: url,
        wordCount: cleaned.length,
        siteName: '',
        fallbackMode: true,
      },
      segments: segmentText(cleaned),
    };
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

/**
 * 主入口：智能选择解析策略
 */
export async function parseUrl(url: string): Promise<ParseResult> {
  // B站专用解析
  if (isBilibiliUrl(url)) {
    return parseBilibili(url);
  }

  // 通用网页解析
  return parseGeneralUrl(url);
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
