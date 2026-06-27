import { useLayoutEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Run a bespoke GSAP entrance timeline scoped to `scope`, once on mount. Selector
 * strings inside `build` resolve within the scope (via gsap.context), so each
 * screen authors its own choreography against its own elements. Reduced motion
 * jumps straight to the final frame; the context reverts (clears inline styles)
 * on unmount. useLayoutEffect runs before paint, so there is no start-state flash.
 */
export function useTimeline(
  scope: RefObject<HTMLElement | null>,
  build: (tl: gsap.core.Timeline) => void,
): void {
  const buildRef = useRef(build);
  buildRef.current = build;
  useLayoutEffect(() => {
    const el = scope.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        paused: true,
        defaults: { duration: 0.55, ease: 'power3.out' },
      });
      buildRef.current(tl);
      if (reduced) tl.progress(1);
      else tl.play();
    }, el);
    return () => ctx.revert();
  }, [scope]);
}

/**
 * Count numeric text up to each element's `data-count` target as part of a
 * timeline. O(1) onUpdate (seek-safe), integer, locale-grouped. Add the live
 * value to the DOM normally and tag it `data-count={value}`.
 */
export function countUp(
  tl: gsap.core.Timeline,
  els: ArrayLike<Element>,
  position: number | string = 0,
  duration = 1.0,
): void {
  Array.from(els).forEach((el) => {
    const node = el as HTMLElement;
    const to = Number(node.dataset.count ?? node.textContent ?? 0);
    if (!Number.isFinite(to)) return;
    const obj = { v: 0 };
    tl.to(
      obj,
      {
        v: to,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
          node.textContent = Math.round(obj.v).toLocaleString();
        },
      },
      position,
    );
  });
}

/**
 * Draw an SVG path/line by animating its stroke dash, as part of a timeline.
 * Measures length at call time (element must be in the DOM). No-op if missing.
 */
export function drawPath(
  tl: gsap.core.Timeline,
  path: SVGGeometryElement | null,
  position: number | string = 0,
  duration = 1.0,
): void {
  if (!path) return;
  const len = path.getTotalLength();
  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
  tl.to(path, { strokeDashoffset: 0, duration, ease: 'power2.out' }, position);
}
