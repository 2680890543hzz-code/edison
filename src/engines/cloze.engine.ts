import { CornellNote, NoteItem, ClozeLevel, ClozeSegment } from '@/types';

// 挖空级别配置
const CLOZE_LEVEL_CONFIG: Record<
  ClozeLevel,
  { threshold: number; targetRatio: number }
> = {
  beginner: { threshold: 0.85, targetRatio: 0.2 },
  intermediate: { threshold: 0.6, targetRatio: 0.4 },
  advanced: { threshold: 0.35, targetRatio: 0.6 },
};

/**
 * 对康奈尔笔记的笔记栏内容进行挖空处理
 * 基于 importance 评分和级别阈值，将关键术语/概念替换为填空
 */
export function generateClozeNote(
  note: CornellNote,
  level: ClozeLevel
): { cues: string[]; clozeNotes: Map<string, ClozeSegment[]>; summary: string } {
  const config = CLOZE_LEVEL_CONFIG[level];
  const clozeNotes = new Map<string, ClozeSegment[]>();

  // 按 importance 降序排列
  const sortedNotes = [...note.notes].sort(
    (a, b) => b.importance - a.importance
  );

  for (const noteItem of sortedNotes) {
    if (
      noteItem.importance >= config.threshold &&
      noteItem.isFillable &&
      noteItem.keywords.length > 0
    ) {
      // 对该 noteItem 的文本进行挖空
      const segments = createClozeSegments(noteItem);
      clozeNotes.set(noteItem.id, segments);
    } else {
      // 不挖空，保持原文
      clozeNotes.set(noteItem.id, [
        { type: 'text', content: noteItem.text, noteId: noteItem.id },
      ]);
    }
  }

  // 线索栏保持不变（但可以提取为纯文本列表）
  const cues = note.cues.map((c) => c.text);

  return {
    cues,
    clozeNotes,
    summary: note.summary,
  };
}

/**
 * 为单个 NoteItem 创建挖空片段
 * 将文本中包含关键词的部分替换为挖空
 */
function createClozeSegments(noteItem: NoteItem): ClozeSegment[] {
  const text = noteItem.text;
  const keywords = noteItem.keywords;
  const segments: ClozeSegment[] = [];

  // 构建关键词匹配正则（按长度降序，避免短关键词优先匹配）
  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
  const escapedKeywords = sortedKeywords.map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );

  // 对每个关键词，在文本中找到并标记挖空位置
  let remainingText = text;
  const matches: { start: number; end: number; keyword: string }[] = [];

  for (const kw of keywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      // 检查是否与已有匹配重叠
      const overlaps = matches.some(
        (m) => match!.index < m.end && match!.index + kw.length > m.start
      );
      if (!overlaps) {
        matches.push({
          start: match.index,
          end: match.index + kw.length,
          keyword: match[0],
        });
      }
    }
  }

  // 按位置排序匹配
  matches.sort((a, b) => a.start - b.start);

  // 生成片段：文本 + 挖空
  let cursor = 0;
  for (const m of matches) {
    // 前置普通文本
    if (cursor < m.start) {
      segments.push({
        type: 'text',
        content: text.slice(cursor, m.start),
        noteId: noteItem.id,
      });
    }
    // 挖空
    segments.push({
      type: 'blank',
      answer: m.keyword,
      hint: `关键词: ${keywords.filter((k) => k !== m.keyword).join(', ')}`,
      noteId: noteItem.id,
    });
    cursor = m.end;
  }

  // 尾部文本
  if (cursor < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(cursor),
      noteId: noteItem.id,
    });
  }

  // 如果没有生成任何挖空，返回纯文本
  if (segments.length === 0) {
    return [{ type: 'text', content: text, noteId: noteItem.id }];
  }

  return segments;
}

/**
 * 统计挖空比例
 */
export function getClozeRatio(
  clozeNotes: Map<string, ClozeSegment[]>
): number {
  let totalSegments = 0;
  let blankSegments = 0;

  for (const segments of clozeNotes.values()) {
    for (const seg of segments) {
      totalSegments++;
      if (seg.type === 'blank') blankSegments++;
    }
  }

  return totalSegments > 0 ? blankSegments / totalSegments : 0;
}

/**
 * 获取某个笔记条目的答案（用于答案揭晓）
 */
export function getAnswer(
  clozeNotes: Map<string, ClozeSegment[]>,
  noteId: string,
  segmentIndex: number
): string | null {
  const segments = clozeNotes.get(noteId);
  if (!segments || segmentIndex >= segments.length) return null;
  const seg = segments[segmentIndex];
  return seg.type === 'blank' ? seg.answer || null : null;
}
