import { useEffect, useState } from 'react';
import type { DragLabelInteraction } from '@/content/types';
import { SpeakerDiagram } from '@/components/visuals/SpeakerDiagram';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

export function DragLabel({ interaction, onChange, locked, result }: InteractionProps) {
  const dl = interaction as DragLabelInteraction;
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [draggingLabelId, setDraggingLabelId] = useState<string | null>(null);

  useEffect(() => {
    onChange(assignments);
  }, [assignments, onChange]);

  const revealed = result !== null;
  const allCorrect = result?.correct ?? false;
  const sortedMarkers = [...dl.markers].sort((a, b) => a.n - b.n);

  // Only confirm the layout once every label is right; a wrong submission never
  // reveals which marker is which.
  const markerTone = (markerId: string): 'default' | 'correct' | 'wrong' => {
    if (!allCorrect) return 'default';
    const label = dl.labels.find((l) => l.correctMarkerId === markerId);
    return label ? 'correct' : 'default';
  };

  function assign(labelId: string, markerId: string) {
    if (locked) return;
    setAssignments((prev) => ({ ...prev, [labelId]: markerId }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-white/5 bg-ink-950/60 p-2">
        <SpeakerDiagram markers={dl.markers.map((m) => ({ ...m, tone: markerTone(m.id) }))} />
      </div>

      <p className="text-sm text-slate-400">
        Drag a component name onto a number, or tap a number as a fallback.
      </p>

      <div className="flex flex-col gap-2">
        {dl.labels.map((label) => {
          const chosen = assignments[label.id];
          const isCorrect = chosen === label.correctMarkerId;
          return (
            <div
              key={label.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-ink-800 p-3"
            >
              <span
                draggable={!locked}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', label.id);
                  setDraggingLabelId(label.id);
                }}
                onDragEnd={() => setDraggingLabelId(null)}
                className={cn(
                  'cursor-grab border border-white/10 bg-ink-700 px-3 py-2 text-sm font-semibold text-slate-100 active:cursor-grabbing',
                  draggingLabelId === label.id && 'border-wave-400 text-wave-400',
                )}
              >
                {label.text}
              </span>
              <div className="flex gap-1.5">
                {sortedMarkers.map((marker) => {
                  const selected = chosen === marker.id;
                  let tone = 'bg-ink-700 text-slate-300';
                  if (allCorrect && selected && isCorrect) tone = 'bg-emerald-400 text-ink-950';
                  else if (revealed && selected && !isCorrect) tone = 'bg-clip-500 text-white';
                  else if (selected) tone = 'bg-wave-400 text-ink-950';
                  return (
                    <button
                      key={marker.id}
                      type="button"
                      disabled={locked}
                      onClick={() => assign(label.id, marker.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const droppedLabelId = e.dataTransfer.getData('text/plain');
                        if (droppedLabelId) assign(droppedLabelId, marker.id);
                        setDraggingLabelId(null);
                      }}
                      className={cn(
                        'h-9 w-9 rounded-full text-sm font-bold transition active:scale-95',
                        tone,
                      )}
                      aria-label={`Assign ${label.text} to marker ${marker.n}`}
                    >
                      {marker.n}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
