import { type PointerEvent as ReactPointerEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DragLabelInteraction, DragLabelItem } from '@/content/types';
import { SpeakerDiagram } from '@/components/visuals/SpeakerDiagram';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

interface DragState {
  labelId: string;
  text: string;
  x: number;
  y: number;
}

export function DragLabel({ interaction, onChange, locked, result }: InteractionProps) {
  const dl = interaction as DragLabelInteraction;
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [drag, setDrag] = useState<DragState | null>(null);
  // The exact number button under the pointer (row id + marker id), so only it
  // highlights even though every row renders the same marker numbers.
  const [hover, setHover] = useState<{ rowId: string; markerId: string } | null>(null);

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

  // Hit-test the number button under the pointer (any row is a valid target).
  function targetUnderPointer(clientX: number, clientY: number) {
    const hit = document
      .elementFromPoint(clientX, clientY)
      ?.closest('[data-marker-id]') as HTMLElement | null;
    const markerId = hit?.dataset.markerId;
    const rowId = hit?.dataset.labelId;
    if (!markerId || !rowId) return null;
    return { rowId, markerId };
  }

  function startDrag(e: ReactPointerEvent, label: DragLabelItem) {
    if (locked || !e.isPrimary) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ labelId: label.id, text: label.text, x: e.clientX, y: e.clientY });
    setHover(targetUnderPointer(e.clientX, e.clientY));
  }

  function moveDrag(e: ReactPointerEvent) {
    if (!drag) return;
    setDrag({ ...drag, x: e.clientX, y: e.clientY });
    setHover(targetUnderPointer(e.clientX, e.clientY));
  }

  function endDrag() {
    if (!drag) return;
    if (hover) assign(drag.labelId, hover.markerId);
    setDrag(null);
    setHover(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/5 bg-ink-950/60 p-2">
        <SpeakerDiagram markers={dl.markers.map((m) => ({ ...m, tone: markerTone(m.id) }))} />
      </div>

      <p className="text-sm text-slate-400">
        Drag a component name onto a number, or tap a number as a fallback.
      </p>

      <div className="flex flex-col gap-2">
        {dl.labels.map((label) => {
          const chosen = assignments[label.id];
          const isCorrect = chosen === label.correctMarkerId;
          const lifted = drag?.labelId === label.id;
          return (
            <div
              key={label.id}
              className="flex items-center justify-between gap-3 bg-ink-800 p-3"
            >
              <span
                onPointerDown={(e) => startDrag(e, label)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={cn(
                  'select-none touch-none border border-white/10 bg-ink-700 px-3 py-2 text-sm font-semibold text-slate-100 transition',
                  locked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
                  lifted && 'border-wave-400 text-wave-400 opacity-40',
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
                  const isDropTarget = !!drag && hover?.rowId === label.id && hover?.markerId === marker.id;
                  return (
                    <button
                      key={marker.id}
                      type="button"
                      data-label-id={label.id}
                      data-marker-id={marker.id}
                      disabled={locked}
                      onClick={() => assign(label.id, marker.id)}
                      className={cn(
                        'h-9 w-9 text-sm font-bold transition active:scale-95',
                        tone,
                        isDropTarget && 'scale-110 outline outline-2 outline-wave-400',
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

      {/* Portaled to <body> so the fixed ghost tracks the pointer relative to the
          viewport, immune to any transformed ancestor. */}
      {drag &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 border border-wave-400 bg-ink-700 px-3 py-2 text-sm font-semibold text-wave-400 shadow-lg shadow-black/50"
            style={{ left: drag.x, top: drag.y, transform: 'translate(-50%, -120%) scale(1.05)' }}
          >
            {drag.text}
          </div>,
          document.body,
        )}
    </div>
  );
}
