import { useEffect, useRef, useState } from 'react';
import type { Lesson } from '@/content/types';
import { conceptsForLesson, getConcept, prerequisitesOf } from '@/content/concepts';
import { useConceptMemoryStore } from '@/features/memory/conceptMemoryStore';
import { isDue, type ConceptMemory } from '@/features/memory/scheduler';
import { findProblemForConcept } from '@/features/memory/dueReview';
import { RetrievalCard } from '@/components/review/RetrievalCard';
import { FullScreenSpinner } from '@/components/ui/Spinner';

const MAX_WARMUPS = 2;

interface WarmupItem {
  conceptId: string;
  conceptName: string;
  found: NonNullable<ReturnType<typeof findProblemForConcept>>;
}

function buildWarmupQueue(lesson: Lesson, memory: Record<string, ConceptMemory>): WarmupItem[] {
  const now = Date.now();
  const prereqIds = new Set<string>();
  for (const concept of conceptsForLesson(lesson.id)) {
    for (const pre of prerequisitesOf(concept.id)) prereqIds.add(pre);
  }
  return [...prereqIds]
    .filter((id) => {
      const m = memory[id];
      return Boolean(m && isDue(m, now)); // only encountered + decayed prerequisites
    })
    // Most-overdue first, so the cap below keeps the prerequisites that matter most.
    .sort((a, b) => (memory[a]?.dueAt ?? 0) - (memory[b]?.dueAt ?? 0))
    .map((id) => {
      const found = findProblemForConcept(id);
      const concept = getConcept(id);
      return found && concept ? { conceptId: id, conceptName: concept.name, found } : null;
    })
    .filter((x): x is WarmupItem => x !== null)
    .slice(0, MAX_WARMUPS);
}

interface PrereqWarmupProps {
  lesson: Lesson;
  onDone: () => void;
}

/** Renders due prerequisite retrieval cards, then calls onDone to enter the lesson. */
export function PrereqWarmup({ lesson, onDone }: PrereqWarmupProps) {
  const memory = useConceptMemoryStore((s) => s.memory);
  const loaded = useConceptMemoryStore((s) => s.loaded);

  // Snapshot once after the store has loaded, so a late resolve can't make us
  // skip a warranted warm-up, and answering can't reshuffle mid-session.
  const queueRef = useRef<WarmupItem[] | null>(null);
  if (loaded && queueRef.current === null) {
    queueRef.current = buildWarmupQueue(lesson, memory);
  }
  const queue = queueRef.current;

  const [index, setIndex] = useState(0);

  // Enter the lesson once the store is loaded and there's nothing left to warm up.
  const finished = queue !== null && index >= queue.length;
  useEffect(() => {
    if (finished) onDone();
  }, [finished, onDone]);

  // queue === null means concept memory hasn't loaded yet: show a spinner rather
  // than a blank screen. Empty/finished queues render null while the effect above
  // advances into the lesson.
  if (queue === null) return <FullScreenSpinner />;
  if (queue.length === 0 || index >= queue.length) return null;

  const current = queue[index];
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-amp-400">Quick warm-up</p>
      <h1 className="mt-1 text-2xl font-extrabold text-white">Refresh before you start</h1>
      <p className="mt-1 mb-5 text-sm text-slate-400">
        A couple of questions on ideas this lesson builds on. ({index + 1} / {queue.length})
      </p>
      <RetrievalCard
        key={current.conceptId}
        conceptId={current.conceptId}
        conceptName={current.conceptName}
        lessonTitle={current.found.lessonTitle}
        step={current.found.step}
        doneLabel={index + 1 === queue.length ? 'Start lesson' : 'Next'}
        onDone={() => setIndex((i) => i + 1)}
      />
      <button
        type="button"
        onClick={onDone}
        className="mt-4 text-sm text-slate-400 underline-offset-4 hover:underline"
      >
        Skip warm-up
      </button>
    </div>
  );
}
