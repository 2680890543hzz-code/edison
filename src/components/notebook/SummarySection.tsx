interface SummarySectionProps {
  summary: string;
}

export function SummarySection({ summary }: SummarySectionProps) {
  return (
    <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
      {summary || '暂无总结内容'}
    </p>
  );
}
