import type { TagCount } from '@/core/analysis';
import { Card } from '@/components/ui';

export interface TagFrequencyProps {
  tags: TagCount[];
}

/** Barras proporcionais: só frequência no período, sem inferência de significado. */
export function TagFrequency({ tags }: TagFrequencyProps) {
  if (tags.length === 0) return null;
  const max = tags[0]?.count ?? 1;

  return (
    <Card>
      <h2 className="text-lg font-semibold">Tags mais presentes</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Frequência no período — quanto aparece, não o que significa.
      </p>
      <ul className="mt-4 space-y-2">
        {tags.map((tag) => (
          <li key={tag.label} className="flex items-center gap-3 text-sm">
            <span className="min-w-32 truncate" title={tag.label}>
              {tag.label}
            </span>
            <span className="relative h-3 flex-1 overflow-hidden rounded-full bg-panel-2">
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 rounded-full bg-brand"
                style={{ width: `${Math.round((tag.count / max) * 100)}%` }}
              />
            </span>
            <span className="w-8 text-right tabular-nums text-ink-muted">{tag.count}×</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
