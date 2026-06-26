import { useRef, useState } from 'react';
import { useConceptMemoryStore } from '@/features/memory/conceptMemoryStore';
import { dueConceptIds, findProblemForConcept } from '@/features/memory/dueReview';
import { getConcept } from '@/content/concepts';
import type { ConceptMemory } from '@/features/memory/scheduler';
import { Card } from '@/components/ui/Card';
import { RetrievalCard } from './RetrievalCard';

interface QueueItem {
  conceptId: string;
  conceptName: string;
  found: NonNullable<ReturnType<typeof findProblemForConcept>>;
}

function buildQueue(memory: Record<string, ConceptMemory>): QueueItem[] {
  return dueConceptIds(memory, Date.now())
    .map((conceptId) => {
      const found = findProblemForConcept(conceptId);
      const concept = getConcept(conceptId);
      return found && concept ? { conceptId, conceptName: concept.name, found } : null;
    })
    .filter((x): x is QueueItem => x !== null);
}

export function DueReviewSection() {
  const memory = useConceptMemoryStore((s) => s.memory);
  const loaded = useConceptMemoryStore((s) => s.loaded);

  // Snapshot once, on the first render after the store has loaded: a late
  // Firestore resolve can't leave a permanently-empty queue, and answering
  // (which pushes dueAt out) still can't reshuffle the list mid-session.
  const snapshotRef = useRef<QueueItem[] | null>(null);
  if (loaded && snapshotRef.current === null) {
    snapshotRef.current = buildQueue(memory);
  }
  const queue = snapshotRef.current;

  const [index, setIndex] = useState(0);

  if (!queue || queue.length === 0) return null;

  if (index >= queue.length) {
    return (
      <Card className="border-emerald-400/30 bg-ink-800">
        <h2 className="text-lg font-bold text-white">Review complete</h2>
        <p className="mt-1 text-sm text-slate-400">
          You cleared every concept due for review today. Nice work.
        </p>
      </Card>
    );
  }

  const current = queue[index];
  return (
    <Card className="border-wave-400/30 bg-ink-800">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-wave-400">
          Due today
        </p>
        <span className="text-xs text-slate-500">
          {index + 1} / {queue.length}
        </span>
      </div>
      <p className="mt-1 mb-3 text-sm text-slate-400">
        Quick retrieval practice on concepts it is time to refresh.
      </p>
      <RetrievalCard
        key={current.conceptId}
        conceptId={current.conceptId}
        conceptName={current.conceptName}
        lessonTitle={current.found.lessonTitle}
        step={current.found.step}
        doneLabel={index + 1 === queue.length ? 'Finish' : 'Next'}
        onDone={() => setIndex((i) => i + 1)}
      />
    </Card>
  );
}
