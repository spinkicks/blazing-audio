import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgressStore } from '@/features/progress/progressStore';
import { buildCoursePath, recommendNext, isCourseComplete, type CourseNode } from '@/content/course';
import { collectReviewTopics } from '@/content/review';
import { useConceptMemoryStore } from '@/features/memory/conceptMemoryStore';
import { dueConceptIds } from '@/features/memory/dueReview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { cn } from '@/lib/cn';

export function HomeScreen() {
  const navigate = useNavigate();
  const profile = useProgressStore((s) => s.profile);
  const progress = useProgressStore((s) => s.progress);

  const nodes = buildCoursePath(progress);
  const courseComplete = isCourseComplete(progress);
  const completedLessons = nodes.filter((n) => n.status === 'completed').length;
  const recommended = recommendNext(nodes);
  const reviewTopics = collectReviewTopics(progress);
  const conceptMemory = useConceptMemoryStore((s) => s.memory);
  const dueCount = dueConceptIds(conceptMemory, Date.now()).length;
  const firstName = profile?.displayName?.split(' ')[0] ?? 'there';

  return (
    <div className="flex flex-col gap-6">
      {courseComplete ? (
        <Card className="border-amp-500/40 bg-ink-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-amp-400">Final project</p>
          <h2 className="mt-1 text-lg font-bold text-white">Your course is complete - build your system</h2>
          <p className="mt-1 text-sm text-slate-400">
            Plan a real audio system and get an objective compatibility check.
          </p>
          <Button className="mt-4" onClick={() => navigate('/capstone')}>
            Start your final project
          </Button>
        </Card>
      ) : (
        <Card className="border-white/10 bg-ink-800/60">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Final project - locked
            </p>
            <LockIcon className="h-4 w-4 text-slate-500" />
          </div>
          <h2 className="mt-1 text-lg font-bold text-slate-300">Plan your real audio system</h2>
          <p className="mt-1 text-sm text-slate-500">
            Unlock by completing every lesson. {completedLessons}/{nodes.length} done.
          </p>
        </Card>
      )}

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

      {reviewTopics.length > 0 ? (
        <Card className="border-wave-400/30 bg-ink-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-wave-400">
            Focused practice
          </p>
          <h2 className="mt-1 text-lg font-bold text-white">Review difficult topics</h2>
          <p className="mt-1 text-sm text-slate-400">
            {reviewTopics.length} question{reviewTopics.length === 1 ? '' : 's'} to revisit from
            your wrong answers.
          </p>
          <Button className="mt-4" variant="secondary" onClick={() => navigate('/review')}>
            Review all difficult topics
          </Button>
        </Card>
      ) : null}

      {dueCount > 0 ? (
        <Card className="border-amp-500/30 bg-ink-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-amp-400">
            Daily goal
          </p>
          <h2 className="mt-1 text-lg font-bold text-white">
            {dueCount} concept{dueCount === 1 ? '' : 's'} due for review
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            A quick refresh keeps what you have learned from fading.
          </p>
          <Button className="mt-4" onClick={() => navigate('/review')}>
            Start today&apos;s review
          </Button>
        </Card>
      ) : null}

      {/* Course path */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Your course
        </h3>
        <CoursePathRail nodes={nodes} />
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

function CoursePathRail({ nodes }: { nodes: CourseNode[] }) {
  const width = Math.max(320, nodes.length * 92);
  const points = nodes.map((_, i) => {
    const x = 38 + i * 92;
    const y = i % 2 === 0 ? 36 : 74;
    return { x, y };
  });
  const path = points
    .map((point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      const prev = points[i - 1];
      const c1x = prev.x + 38;
      const c2x = point.x - 38;
      return `C ${c1x} ${prev.y}, ${c2x} ${point.y}, ${point.x} ${point.y}`;
    })
    .join(' ');

  return (
    <div className="no-scrollbar mb-4 overflow-x-auto border border-white/5 bg-ink-950/40 p-3">
      <svg viewBox={`0 0 ${width} 112`} className="min-w-full" style={{ width }}>
        <path d={path} fill="none" stroke="rgba(56,189,248,0.45)" strokeWidth="3" />
        {points.map((point, i) => {
          const node = nodes[i];
          const active = !node.locked && node.status !== 'notStarted';
          const done = node.status === 'completed';
          return (
            <g key={node.summary.id}>
              <rect
                x={point.x - 16}
                y={point.y - 16}
                width="32"
                height="32"
                fill={done ? '#34d399' : active ? '#38bdf8' : '#16223a'}
                stroke={node.locked ? 'rgba(148,163,184,0.35)' : '#38bdf8'}
                strokeWidth="2"
              />
              <text
                x={point.x}
                y={point.y + 5}
                textAnchor="middle"
                className="fill-ink-950 text-[13px] font-black"
              >
                {done ? '✓' : node.summary.order}
              </text>
              <text
                x={point.x}
                y={point.y + 31}
                textAnchor="middle"
                className="fill-slate-400 text-[9px] font-semibold"
              >
                {node.summary.title.split(' ').slice(0, 2).join(' ')}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-ink-800 p-3 text-center">
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
          'flex w-full items-center gap-4 border p-4 text-left transition',
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
          <span className="bg-amp-500/15 px-2 py-1 text-[11px] font-bold text-amp-400">
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
        'flex h-10 w-10 shrink-0 items-center justify-center text-sm font-bold',
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
