import { MENTION_MAP, extractMentions } from '@/hooks/useInternalTasks';

export { MENTION_MAP, extractMentions };

interface AssigneeBadgesProps {
  codes: string[];
  size?: 'sm' | 'md';
}

const SIZES = {
  sm: 'h-5 w-5 text-[10px]',
  md: 'h-6 w-6 text-xs',
};

export function AssigneeBadges({ codes, size = 'sm' }: AssigneeBadgesProps) {
  if (!codes || codes.length === 0) return null;
  const cls = SIZES[size];
  return (
    <div className="inline-flex items-center -space-x-1.5 shrink-0">
      {codes.map((c) => {
        const info = MENTION_MAP[c];
        if (!info) return null;
        return (
          <span
            key={c}
            title={`Encargado: ${info.name}`}
            className={`inline-flex items-center justify-center rounded-full border-2 border-card font-bold ${cls} ${info.color}`}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
}
