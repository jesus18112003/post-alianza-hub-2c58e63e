import { Clock } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { PolicyFollowup } from '@/hooks/usePolicyFollowups';

interface FollowupBadgeProps {
  followup: PolicyFollowup;
  compact?: boolean;
}

export function FollowupBadge({ followup, compact = true }: FollowupBadgeProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseISO(followup.due_date);
  const days = differenceInDays(due, today);

  const overdue = days < 0;
  const today_ = days === 0;
  const urgent = days <= 1;

  const colorClass = overdue
    ? 'bg-destructive/15 text-destructive border-destructive/30 animate-pulse'
    : today_
    ? 'bg-destructive/10 text-destructive border-destructive/20'
    : urgent
    ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
    : 'bg-blue-500/10 text-blue-500 border-blue-500/20';

  const dayLabel = overdue
    ? `${Math.abs(days)}d vencido`
    : today_
    ? 'HOY'
    : `${days}d`;

  const reasonText = compact && followup.reason.length > 22
    ? followup.reason.slice(0, 22) + '…'
    : followup.reason;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border shrink-0 ${colorClass}`}
      title={`${followup.reason} · vence ${followup.due_date}`}
    >
      <Clock className="h-3 w-3" />
      <span className="truncate max-w-[10rem]">{reasonText}</span>
      <span className="font-bold">· {dayLabel}</span>
    </span>
  );
}
