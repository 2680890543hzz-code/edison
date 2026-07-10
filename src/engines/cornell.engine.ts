import { v4 as uuidv4 } from 'uuid';
import { AIProvider, ChatMessage } from '@services/ai/types';
import { CornellNote, CueItem, NoteItem, ParseResult } from '@/types';
import {
  buildOneShotPrompt,
  buildStreamSystemPrompt,
} from './prompt.templates';

// 估算文本的 token 数（粗略：中文约1.5字/token，英文约4字/token）
function estimateTokens(text: string): number {
  const chineseChars = (text.match(/[一-鿿]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars / 1.5 + otherChars / 4);
}

// 长文本分段
function splitContent(content: string, maxTokens = 6000): string[] {
  if (estimateTokens(content) <= maxTokens) {
    return [content];
  }

  const paragraphs = content.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if (estimateTokens(current + para) > maxTokens && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

// 从 AI 响应中提取 JSON
function extractJSON(response: string): string {
  // 尝试匹配 ```json ... ``` 代码块
  const jsonBlock = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlock) return jsonBlock[1];

  // 尝试匹配 { ... } 或 [ ... ]
  const jsonMatch = response.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) return jsonMatch[1];

  return response;
}

export interface GenerationProgress {
  stage: 'analyzing' | 'formatting' | 'done';
  message: string;
  percent: number;
}

export async function generateCornellNote(
  provider: AIProvider,
  parseResult: ParseResult,
  onProgress?: (progress: GenerationProgress) => void
): Promise<CornellNote> {
  const { title, plainText } = parseResult;
  const tokens = estimateTokens(plainText);

  // 短内容：一步生成
  if (tokens <= 6000) {
    return generateOneShot(provider, plainText, title, onProgress);
  }

  // 长内容：Map-Reduce
  return generateMapReduce(provider, plainText, title, onProgress);
}

// 一步生成（短内容）
async function generateOneShot(
  provider: AIProvider,
  content: string,
  title: string,
  onProgress?: (progress: GenerationProgress) => void
): Promise<CornellNote> {
  onProgress?.({ stage: 'analyzing', message: '正在分析内容并生成笔记...', percent: 20 });

  const systemPrompt = buildStreamSystemPrompt();
  const userPrompt = buildOneShotPrompt(content, title);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  let fullResponse = '';
  for await (const chunk of provider.chatStream(messages, { temperature: 0.3 })) {
    fullResponse += chunk;
  }

  onProgress?.({ stage: 'formatting', message: '正在结构化笔记...', percent: 80 });

  const jsonStr = extractJSON(fullResponse);
  const parsed = JSON.parse(jsonStr);

  const note: CornellNote = {
    id: uuidv4(),
    title,
    cues: parsed.cues as CueItem[],
    notes: parsed.notes as NoteItem[],
    summary: parsed.summary || '',
    source: {
      type: 'url' as const,
      title,
      source: '',
      wordCount: content.length,
    },
    createdAt: new Date().toISOString(),
  };

  onProgress?.({ stage: 'done', message: '笔记生成完成！', percent: 100 });

  return note;
}

// Map-Reduce 生成（长内容）
async function generateMapReduce(
  provider: AIProvider,
  content: string,
  title: string,
  onProgress?: (progress: GenerationProgress) => void
): Promise<CornellNote> {
  const chunks = splitContent(content, 5000);

  onProgress?.({
    stage: 'analyzing',
    message: `正在分段分析（共 ${chunks.length} 段）...`,
    percent: 10,
  });

  // Map 阶段：每段生成知识点
  const allKnowledgePoints: unknown[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const percent = 10 + Math.floor((i / chunks.length) * 50);
    onProgress?.({
      stage: 'analyzing',
      message: `正在分析第 ${i + 1}/${chunks.length} 段...`,
      percent,
    });

    const mapPrompt = buildOneShotPrompt(
      `${chunks[i]}\n\n（注意：这是内容片段 ${i + 1}/${chunks.length}，请为这段内容生成康奈尔笔记）`,
      `${title} - 第${i + 1}段`
    );

    const messages: ChatMessage[] = [
      { role: 'system', content: buildStreamSystemPrompt() },
      { role: 'user', content: mapPrompt },
    ];

    let fullResponse = '';
    for await (const chunk of provider.chatStream(messages, { temperature: 0.3 })) {
      fullResponse += chunk;
    }

    try {
      const jsonStr = extractJSON(fullResponse);
      const result = JSON.parse(jsonStr);
      if (result.notes) {
        allKnowledgePoints.push(...result.notes);
      }
      if (result.cues && allKnowledgePoints.length === result.notes?.length) {
        // 只收集第一段的 cues
        if (i === 0) {
          allKnowledgePoints.push({ _cues: result.cues });
        }
      }
    } catch {
      // 某段解析失败，跳过继续
      console.warn(`第 ${i + 1} 段解析失败，已跳过`);
    }
  }

  // Reduce 阶段：汇总
  onProgress?.({
    stage: 'formatting',
    message: '正在汇总整理笔记...',
    percent: 70,
  });

  // 找出第一段的 cues
  const cuesData = allKnowledgePoints.find(
    (item: any) => item._cues
  ) as any;
  const cues: CueItem[] = cuesData?._cues || [];
  const notes: NoteItem[] = allKnowledgePoints
    .filter(
      (item: any) =>
        !item._cues && item.id && item.text && typeof item.importance === 'number'
    )
    .sort((a: any, b: any) => b.importance - a.importance)
    .slice(0, 20)
    .map((item: any, index: number) => ({
      ...item,
      id: `n${index + 1}`,
    }));

  // 生成总结
  onProgress?.({
    stage: 'formatting',
    message: '正在生成总结...',
    percent: 85,
  });

  const summaryPrompts: ChatMessage[] = [
    {
      role: 'system',
      content: '你是一位专业的教育笔记专家。请为以下知识点列表生成100-200字的精炼总结。',
    },
    {
      role: 'user',
      content: `请为以下 ${notes.length} 个知识点生成总结：\n${notes.map((n: any) => n.text).join('\n')}`,
    },
  ];

  let summary = '';
  for await (const chunk of provider.chatStream(summaryPrompts, { temperature: 0.3, maxTokens: 400 })) {
    summary += chunk;
  }
  summary = summary.trim();

  const note: CornellNote = {
    id: uuidv4(),
    title,
    cues,
    notes,
    summary,
    source: {
      type: 'url' as const,
      title,
      source: '',
      wordCount: content.length,
    },
    createdAt: new Date().toISOString(),
  };

  onProgress?.({ stage: 'done', message: '笔记生成完成！', percent: 100 });

  return note;
}
