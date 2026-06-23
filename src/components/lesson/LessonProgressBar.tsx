interface LessonProgressBarProps {
  current: number;
  total: number;
}

export function LessonProgressBar({ current, total }: LessonProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-700">
      <div
        className="h-full rounded-full bg-gradient-to-r from-wave-500 to-wave-400 transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
      />
    </div>
  );
}
