import { AIProvider, ChatMessage } from '@services/ai/types';

// ===== 系统 Prompt =====

export const SYSTEM_PROMPT = `你是一位专业的教育笔记专家，精通康奈尔笔记法（Cornell Note-Taking System）。
你的任务是将用户提供的学习内容转化为高质量的康奈尔笔记。

康奈尔笔记法包含三大模块：
1. 线索栏（Cues）：关键词、核心问题、记忆提示，放在左侧
2. 笔记栏（Notes）：详细的知识点记录，放在右侧主体
3. 总结栏（Summary）：对整篇内容的精炼总结，放在底部

请始终保持专业、准确、结构化的输出风格。`;

// ===== 步骤1：内容分析 Prompt =====

export function buildAnalysisPrompt(
  content: string,
  minPoints = 5,
  maxPoints = 20
): string {
  return `请仔细分析以下内容，提取 ${minPoints}-${maxPoints} 个核心知识点。

要求：
1. 按重要性从高到低排列每个知识点
2. 为每个知识点给出重要性评分（0到1之间的小数，1表示最重要）
3. 为每个知识点提取3-5个关键词
4. 标注每个知识点是否适合制作填空（isFillable）

请严格按照以下JSON格式返回，不要包含其他文字：
\`\`\`json
[
  {
    "id": "k1",
    "point": "知识点的详细描述",
    "importance": 0.95,
    "keywords": ["关键词1", "关键词2", "关键词3"],
    "isFillable": true
  }
]
\`\`\`

以下是需要分析的内容：
---
${content}
---`;
}

// ===== 步骤2：康奈尔格式化 Prompt =====

export function buildCornellPrompt(
  knowledgePoints: unknown[],
  title: string
): string {
  return `请基于以下知识点，生成完整的康奈尔笔记，标题为「${title}」。

三大模块要求：

【线索栏 Cues】
- 为每个知识点生成对应的关键词/问题/记忆提示
- 每条线索简短有力（不超过20字）
- 建立线索与笔记条目的关联

【笔记栏 Notes】
- 将知识点展开为清晰、有条理的笔记
- 每个笔记条目是一段完整的话
- 确保笔记内容准确且易于理解
- 笔记条目需包含对应的关键词

【总结栏 Summary】
- 用100-200字对整体内容进行精炼总结
- 包括核心观点和关键结论

请严格按照以下JSON格式返回，不要包含其他文字：
\`\`\`json
{
  "cues": [
    {
      "id": "c1",
      "text": "线索关键词或问题",
      "linkedNoteIds": ["n1", "n2"]
    }
  ],
  "notes": [
    {
      "id": "n1",
      "text": "详细的笔记内容，是一个完整的句子或段落",
      "importance": 0.95,
      "keywords": ["关键词1"],
      "isFillable": true
    }
  ],
  "summary": "这是总结内容，100-200字的精炼概括..."
}
\`\`\`

以下是知识点列表：
---
${JSON.stringify(knowledgePoints, null, 2)}
---`;
}

// ===== 步骤2替代：合并一步生成 =====

export function buildOneShotPrompt(content: string, title: string): string {
  return `请仔细分析以下内容，直接生成完整的康奈尔笔记，标题为「${title}」。

请按以下要求处理：

【线索栏 Cues】
- 为核心概念生成关键词/问题/记忆提示
- 每条线索简短有力（不超过20字）

【笔记栏 Notes】
- 将核心知识点展开为清晰、有条理的笔记
- 每个笔记条目是一段完整的话
- 为每个条目标注importance（0-1的重要性评分）
- 为每个条目提供关键词数组
- 标注每个条目是否适合制作填空（isFillable）

【总结栏 Summary】
- 用100-200字对整体内容进行精炼总结

请严格按照以下JSON格式返回，不要包含其他文字：
\`\`\`json
{
  "cues": [
    {
      "id": "c1",
      "text": "线索关键词或问题",
      "linkedNoteIds": ["n1"]
    }
  ],
  "notes": [
    {
      "id": "n1",
      "text": "详细的笔记内容",
      "importance": 0.95,
      "keywords": ["关键词"],
      "isFillable": true
    }
  ],
  "summary": "整体总结..."
}
\`\`\`

以下是需要分析的内容：
---
${content}
---`;
}

// ===== 流式输出时的进度消息 =====

export function buildStreamSystemPrompt(): string {
  return `${SYSTEM_PROMPT}

请始终以有效的 JSON 格式输出。你的回复会被直接解析，所以请确保 JSON 格式完全正确。`;
}
