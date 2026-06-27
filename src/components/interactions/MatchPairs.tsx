import { type PointerEvent as ReactPointerEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GenOption } from '@/features/review/generatedQuestions';
import { cn } from '@/lib/cn';

interface MatchPairsProps {
  /** Fixed term rows (drop targets). */
  left: GenOption[];
  /** Definitions/examples the learner assigns to a term. */
  right: GenOption[];
  onChange: (pairs: Record<string, string>) => void;
  disabled?: boolean;
  /** Set after checking: drives the reveal styling. */
  verdict?: 'correct' | 'incorrect' | null;
}

interface DragState {
  rightId: string;
  text: string;
  x: number;
  y: number;
}

/**
 * Generic "match the term to its definition" interaction for AI-generated
 * questions. A definition chip is dragged onto a term row, or tapped to select
 * and then tapped onto a row (the same tap fallback the diagram labeler uses).
 * Each definition is used at most once.
 */
export function MatchPairs({ left, right, onChange, disabled, verdict }: MatchPairsProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [drag, setDrag] = useState<DragState | null>(null);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [hoverLeftId, setHoverLeftId] = useState<string | null>(null);

  useEffect(() => {
    onChange(assignments);
  }, [assignments, onChange]);

  const usedRightIds = new Set(Object.values(assignments));
  const pool = right.filter((option) => !usedRightIds.has(option.id));
  const rightById = new Map(right.map((option) => [option.id, option]));
  const allCorrect = verdict === 'correct';

  function assign(leftId: string, rightId: string) {
    if (disabled) return;
    setAssignments((prev) => {
      const next: Record<string, string> = {};
      // Drop the definition from wherever it was, then place it on this row.
      for (const [key, value] of Object.entries(prev)) {
        if (value !== rightId) next[key] = value;
      }
      next[leftId] = rightId;
      return next;
    });
    setSelectedChip(null);
  }

  function clearRow(leftId: string) {
    if (disabled) return;
    setAssignments((prev) => {
      if (!(leftId in prev)) return prev;
      const next = { ...prev };
      delete next[leftId];
      return next;
    });
  }

  function leftIdUnderPointer(clientX: number, clientY: number): string | null {
    const hit = document
      .elementFromPoint(clientX, clientY)
      ?.closest('[data-left-id]') as HTMLElement | null;
    return hit?.dataset.leftId ?? null;
  }

  function startDrag(event: ReactPointerEvent, option: GenOption) {
    if (disabled || !event.isPrimary) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ rightId: option.id, text: option.label, x: event.clientX, y: event.clientY });
    setHoverLeftId(leftIdUnderPointer(event.clientX, event.clientY));
  }

  function moveDrag(event: ReactPointerEvent) {
    if (!drag) return;
    setDrag({ ...drag, x: event.clientX, y: event.clientY });
    setHoverLeftId(leftIdUnderPointer(event.clientX, event.clientY));
  }

  function endDrag() {
    if (!drag) return;
    if (hoverLeftId) assign(hoverLeftId, drag.rightId);
    setDrag(null);
    setHoverLeftId(null);
  }

  function onRowTap(leftId: string) {
    if (disabled) return;
    if (selectedChip) {
      assign(leftId, selectedChip);
      return;
    }
    if (assignments[leftId]) clearRow(leftId);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {left.map((term) => {
          const assignedId = assignments[term.id];
          const assigned = assignedId ? rightById.get(assignedId) : undefined;
          const isDropTarget = !!drag && hoverLeftId === term.id;
          return (
            <div
              key={term.id}
              className="flex items-stretch gap-2"
            >
              <div className="flex w-2/5 items-center bg-ink-800 px-3 py-2 text-sm font-semibold text-slate-100">
                {term.label}
              </div>
              <button
                type="button"
                data-left-id={term.id}
                disabled={disabled}
                onClick={() => onRowTap(term.id)}
                className={cn(
                  'flex flex-1 items-center justify-between gap-2 border border-dashed px-3 py-2 text-left text-sm transition',
                  assigned
                    ? 'border-solid text-slate-100'
                    : 'border-white/20 text-slate-500',
                  allCorrect && assigned
                    ? 'border-emerald-400/70 bg-emerald-400/10'
                    : assigned
                      ? 'border-wave-400/60 bg-wave-400/10'
                      : 'bg-ink-700/40',
                  isDropTarget && 'scale-[1.01] outline outline-2 outline-wave-400',
                  disabled ? 'cursor-default' : 'cursor-pointer',
                )}
              >
                <span>{assigned ? assigned.label : 'Tap a definition, then tap here'}</span>
                {assigned && !disabled ? <span className="text-xs text-slate-400">clear</span> : null}
              </button>
            </div>
          );
        })}
      </div>

      {pool.length > 0 ? (
        <div className="border-t border-white/5 pt-3">
          <p className="mb-2 text-xs text-slate-400">
            Drag a definition onto a term, or tap to select then tap a term.
          </p>
          <div className="flex flex-wrap gap-2">
            {pool.map((option) => {
              const lifted = drag?.rightId === option.id;
              const isSelected = selectedChip === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isSelected}
                  onPointerDown={(event) => startDrag(event, option)}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onClick={() => {
                    if (drag) return;
                    setSelectedChip((current) => (current === option.id ? null : option.id));
                  }}
                  className={cn(
                    'select-none touch-none border px-3 py-2 text-sm font-medium transition',
                    disabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
                    isSelected
                      ? 'border-wave-400 bg-wave-400/10 text-wave-400'
                      : 'border-white/10 bg-ink-700 text-slate-100',
                    lifted && 'opacity-40',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Rendered to <body> so the fixed-position ghost is always relative to the
          viewport, not a transformed ancestor (e.g. a settled entrance animation
          leaves a residual transform that would otherwise offset it). */}
      {drag
        ? createPortal(
            <div
              className="pointer-events-none fixed z-50 border border-wave-400 bg-ink-700 px-3 py-2 text-sm font-medium text-wave-400 shadow-lg shadow-black/50"
              style={{ left: drag.x, top: drag.y, transform: 'translate(-50%, -120%) scale(1.05)' }}
            >
              {drag.text}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
