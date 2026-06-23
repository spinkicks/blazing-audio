import type { ReactNode } from 'react';
import type { CompletionSummary } from '@/features/progress/progressStore';
import { Button } from '@/components/ui/Button';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { REVIEW_THRESHOLD } from '@/content/course';

interface LessonCompleteProps {
  lessonTitle: string;
  summary: CompletionSummary;
  nextLabel: string | null;
  onNext: () => void;
  onHome: () => void;
}

export function LessonComplete({
  lessonTitle,
  summary,
  nextLabel,
  onNext,
  onHome,
}: LessonCompleteProps) {
  const masteryPct = Math.round(summary.masteryScore * 100);
  const lowMastery = summary.masteryScore < REVIEW_THRESHOLD;
  const milestone = streakMilestone(summary.streakCurrent);

  return (
    <div className="animate-pop-in flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center bg-emerald-400 text-3xl font-black text-ink-950">
        ✓
      </div>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white">Lesson complete</h1>
      <p className="mt-1 text-slate-400">{lessonTitle}</p>

      {milestone ? (
        <div className="mt-4 border border-amp-500/40 bg-amp-500/10 px-4 py-2 text-sm font-bold text-amp-400">
          {summary.streakCurrent}-day streak - {milestone}
        </div>
      ) : null}

      <div className="mt-7 grid w-full max-w-sm grid-cols-3 gap-3">
        <Stat label="Mastery" value={`${masteryPct}%`} />
        <Stat label="Streak" value={<StreakBadge count={summary.streakCurrent} />} />
        <Stat label="XP" value={summary.xpAwarded > 0 ? `+${summary.xpAwarded}` : '+0'} />
      </div>

      {lowMastery ? (
        <p className="mt-5 max-w-sm text-sm text-amp-400">
          A few of these tripped you up - a quick review later will lock it in.
        </p>
      ) : (
        <p className="mt-5 max-w-sm text-sm text-emerald-300">Nicely done. That idea is yours now.</p>
      )}

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
        {nextLabel ? (
          <Button fullWidth onClick={onNext}>
            {nextLabel}
          </Button>
        ) : null}
        <Button variant={nextLabel ? 'secondary' : 'primary'} fullWidth onClick={onHome}>
          Back to course
        </Button>
      </div>
    </div>
  );
}

function streakMilestone(streak: number): string | null {
  if (streak === 3) return 'the habit is forming';
  if (streak === 7) return 'a full week';
  if (streak >= 14 && streak % 7 === 0) return 'keep it going';
  return null;
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl bg-ink-800 p-3">
      <div className="flex h-7 items-center justify-center text-lg font-bold text-white">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}
