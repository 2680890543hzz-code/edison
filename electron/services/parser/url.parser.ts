import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { ParseResult } from './index';

// 通用浏览器 UA
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

// ===================== 平台识别 =====================

function isBilibili(url: string): boolean {
  return /bilibili\.com\/video\//.test(url) || /b23\.tv\//.test(url);
}

function isYouTube(url: string): boolean {
  return /(youtube\.com\/watch|youtu\.be\/)/.test(url);
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// ===================== B站解析 =====================

async function parseBilibili(url: string): Promise<ParseResult> {
  const bvid = (url.match(/BV[A-Za-z0-9]{10}/) || url.match(/av(\d+)/) || [''])[0];
  if (!bvid) throw new Error('无法从链接中提取 B站视频 ID');

  // 1. 获取视频基本信息
  const viewUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
  const viewResp = await fetch(viewUrl, {
    headers: {
      'User-Agent': BROWSER_UA,
      Referer: 'https://www.bilibili.com/',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
  });
  if (!viewResp.ok) throw new Error(`B站API请求失败 (${viewResp.status})`);

  const viewData: any = await viewResp.json();
  if (viewData.code !== 0) {
    if (viewData.code === -404) throw new Error('B站视频不存在或已被删除');
    if (viewData.code === -403) throw new Error('B站访问被拒绝（-403）');
    throw new Error(`B站API错误: ${viewData.message} (code: ${viewData.code})`);
  }

  const video = viewData.data;
  const cid = video.cid;
  const title = video.title || '未命名B站视频';
  let content = `标题：${title}\n\n`;
  if (video.desc) content += `简介：${video.desc}\n\n`;

  // 2. 获取字幕
  try {
    const subResp = await fetch(`https://api.bilibili.com/x/player/v2?bvid=${bvid}&cid=${cid}`, {
      headers: { 'User-Agent': BROWSER_UA, Referer: 'https://www.bilibili.com/', 'Accept-Language': 'zh-CN,zh;q=0.9' },
    });
    if (subResp.ok) {
      const subData: any = await subResp.json();
      const subList = subData?.data?.subtitle?.subtitles || [];
      if (subList.length > 0) {
        const zhSub = subList.find((s: any) => s.lan_doc?.includes('中文')) || subList[0];
        if (zhSub?.subtitle_url) {
          const subUrl = zhSub.subtitle_url.startsWith('http') ? zhSub.subtitle_url : `https:${zhSub.subtitle_url}`;
          const scResp = await fetch(subUrl, { headers: { 'User-Agent': BROWSER_UA, Referer: 'https://www.bilibili.com/' } });
          if (scResp.ok) {
            const subJson: any = await scResp.json();
            const lines = (subJson?.body || []).map((i: any) => i.content || '').filter(Boolean);
            content += `字幕内容（${zhSub.lan_doc || '未知语言'}）：\n${lines.join('\n')}`;
          }
        }
      } else {
        content += '（该视频无字幕，将以标题和简介作为分析内容）\n';
      }
    }
  } catch {
    content += '（字幕获取失败，将以标题和简介作为分析内容）\n';
  }

  if (content.length < 200) {
    content += '\n注意：该视频无明显文字内容，AI 笔记将主要基于标题和简介。';
  }

  return {
    type: 'url',
    title: `${title} - B站视频`,
    plainText: content,
    metadata: { source: url, bvid, cid, wordCount: content.length, siteName: '哔哩哔哩', hasSubtitle: content.includes('字幕') },
    segments: segmentText(content),
  };
}

// ===================== YouTube 解析 =====================

async function parseYouTube(url: string): Promise<ParseResult> {
  // YouTube 网页抓取 + yt-dlp 兜底
  const resp = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.5',
    },
  });
  const html = await resp.text();

  // 从页面提取 ytInitialPlayerResponse
  const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
  let title = 'YouTube视频';
  let captionsText = '';

  if (playerMatch) {
    try {
      const playerData = JSON.parse(playerMatch[1]);
      title = playerData?.videoDetails?.title || title;

      // 提取字幕轨道
      const captionsTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      if (captionsTracks.length > 0) {
        const zhTrack = captionsTracks.find((t: any) =>
          t.languageCode === 'zh' || t.languageCode === 'zh-Hans' || t.languageCode === 'zh-Hant'
        ) || captionsTracks[0];

        if (zhTrack?.baseUrl) {
          const capResp = await fetch(zhTrack.baseUrl, {
            headers: { 'User-Agent': BROWSER_UA },
          });
          if (capResp.ok) {
            const xmlText = await capResp.text();
            captionsText = xmlText
              .replace(/<[^>]+>/g, '')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .trim();
          }
        }
      }
    } catch { /* 解析失败继续 */ }
  }

  let content = `标题：${title}\n\n`;
  if (captionsText) {
    content += `字幕内容：\n${captionsText}`;
  } else {
    // 无字幕时尝试用 Readability 提取页面可见文字
    const dom = new JSDOM(html, { url });
    const bodyText = dom.window.document.body?.textContent || '';
    const description = bodyText.replace(/\s{3,}/g, '\n').trim().slice(0, 3000);
    content += `页面描述：\n${description}\n\n（注：该视频可能无字幕或字幕不可获取，建议使用带字幕的视频以获得更好的笔记效果）`;
  }

  return {
    type: 'url',
    title: `${title} - YouTube视频`,
    plainText: content,
    metadata: { source: url, wordCount: content.length, siteName: 'YouTube', hasSubtitle: !!captionsText },
    segments: segmentText(content),
  };
}

// ===================== 通用网页解析 =====================

async function parseGeneral(url: string): Promise<ParseResult> {
  let html = '';
  let lastError: Error | null = null;
  let domain = getDomain(url);

  const strategies = [
    { ua: BROWSER_UA, label: '桌面端' },
    { ua: MOBILE_UA, label: '移动端' },
  ];

  for (const s of strategies) {
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': s.ua,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.5',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      if (resp.ok) { html = await resp.text(); break; }
      if (resp.status === 403 || resp.status === 451) {
        lastError = new Error(`网站返回 ${resp.status}（访问被拒绝），该网站可能有反爬虫保护或地区限制。建议：1.手动复制内容粘贴到txt文件上传 2.检查是否需要登录`);
        continue;
      }
      lastError = new Error(`网站返回状态码 ${resp.status}`);
    } catch (err: any) { lastError = err; }
  }

  if (!html && lastError) throw lastError;
  if (!html) throw new Error('无法获取网页内容');

  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article?.textContent || article.textContent.trim().length < 50) {
    // 降级：直接提取 body 文本
    const bodyText = dom.window.document.body?.textContent || '';
    const cleaned = bodyText.replace(/\s{3,}/g, '\n').trim().slice(0, 8000);
    if (cleaned.length < 50) {
      throw new Error('无法提取网页正文。可能原因：1.页面是纯JS渲染的SPA 2.有严格反爬虫。建议手动复制内容粘贴到txt文件上传');
    }
    return {
      type: 'url', title: dom.window.document.title || '未命名网页', plainText: cleaned,
      metadata: { source: url, wordCount: cleaned.length, siteName: domain, fallbackMode: true },
      segments: segmentText(cleaned),
    };
  }

  const plainText = article.textContent.replace(/\s{3,}/g, '\n\n').trim();
  return {
    type: 'url', title: article.title || '未命名网页', plainText,
    metadata: { source: url, wordCount: plainText.length, siteName: domain },
    segments: segmentText(plainText),
  };
}

// ===================== 主入口 =====================

export async function parseUrl(url: string): Promise<ParseResult> {
  if (isBilibili(url)) return parseBilibili(url);
  if (isYouTube(url)) return parseYouTube(url);
  return parseGeneral(url);
}

// ===================== 工具 =====================

function segmentText(text: string, maxLen = 4000): { index: number; text: string }[] {
  const segs: { index: number; text: string }[] = [];
  let cur = '', idx = 0;
  for (const p of text.split(/\n\s*\n/)) {
    if (cur.length + p.length > maxLen && cur.length > 0) {
      segs.push({ index: idx++, text: cur.trim() }); cur = p;
    } else { cur += (cur ? '\n\n' : '') + p; }
  }
  if (cur.trim()) segs.push({ index: idx, text: cur.trim() });
  return segs;
}
