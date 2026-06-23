import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgressStore } from '@/features/progress/progressStore';
import { buildCoursePath, recommendNext, type CourseNode } from '@/content/course';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { cn } from '@/lib/cn';

export function HomeScreen() {
  const navigate = useNavigate();
  const profile = useProgressStore((s) => s.profile);
  const progress = useProgressStore((s) => s.progress);

  const nodes = buildCoursePath(progress);
  const recommended = recommendNext(nodes);
  const firstName = profile?.displayName?.split(' ')[0] ?? 'there';

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting + streak */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Welcome back,</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">{firstName}</h1>
        </div>
        <StreakBadge count={profile?.streak.current ?? 0} />
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Lessons" value={profile?.stats.lessonsCompleted ?? 0} />
        <MiniStat label="Solved" value={profile?.stats.problemsSolved ?? 0} />
        <MiniStat label="XP" value={profile?.stats.xp ?? 0} />
      </div>

      {/* Continue CTA */}
      {recommended ? (
        <Card className="border-amp-500/30 bg-ink-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-amp-400">
            {recommended.needsReview
              ? 'Recommended review'
              : recommended.status === 'inProgress'
                ? 'Pick up where you left off'
                : 'Up next'}
          </p>
          <h2 className="mt-1 text-lg font-bold text-white">{recommended.summary.title}</h2>
          <p className="mt-1 text-sm text-slate-400">{recommended.summary.subtitle}</p>
          <Button className="mt-4" onClick={() => navigate(`/lesson/${recommended.summary.id}`)}>
            {recommended.status === 'inProgress' ? 'Resume' : 'Start lesson'}
          </Button>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-slate-300">
            You have finished every lesson available. More are on the way.
          </p>
        </Card>
      )}

      {/* Course path */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Your course
        </h3>
        <ol className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {nodes.map((node) => (
            <LessonRow
              key={node.summary.id}
              node={node}
              onClick={() => !node.locked && navigate(`/lesson/${node.summary.id}`)}
            />
          ))}
        </ol>
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-ink-800 p-3 text-center">
      <div className="text-xl font-extrabold text-white">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function LessonRow({ node, onClick }: { node: CourseNode; onClick: () => void }) {
  const { summary, locked, status, needsReview } = node;
  return (
    <li>
      <button
        type="button"
        disabled={locked}
        onClick={onClick}
        className={cn(
          'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition',
          locked
            ? 'cursor-not-allowed border-white/5 bg-ink-800/50 opacity-60'
            : 'border-white/5 bg-ink-800 hover:border-wave-400/40 active:scale-[0.99]',
        )}
      >
        <StatusBadge status={status} locked={locked} order={summary.order} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">{summary.title}</p>
          <p className="truncate text-sm text-slate-400">
            {summary.estimatedMinutes} min · {summary.stepCount} steps
          </p>
        </div>
        {needsReview ? (
          <span className="rounded-full bg-amp-500/15 px-2 py-1 text-[11px] font-bold text-amp-400">
            Review
          </span>
        ) : null}
      </button>
    </li>
  );
}

function StatusBadge({
  status,
  locked,
  order,
}: {
  status: CourseNode['status'];
  locked: boolean;
  order: number;
}) {
  let content: ReactNode = order === 0 ? '\u2605' : order;
  let tone = 'bg-ink-700 text-slate-300';
  if (locked) {
    content = <LockIcon className="h-4 w-4" />;
    tone = 'bg-ink-700 text-slate-500';
  } else if (status === 'completed') {
    content = '✓';
    tone = 'bg-emerald-400 text-ink-950';
  } else if (status === 'inProgress') {
    tone = 'bg-wave-400 text-ink-950';
  }
  return (
    <span
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
        tone,
      )}
    >
      {content}
    </span>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="5" y="11" width="14" height="9" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
