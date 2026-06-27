import { useLayoutEffect, type RefObject } from 'react';
import gsap from 'gsap';

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * A restrained "power-on" entrance for a screen. On mount it staggers in every
 * element marked `data-entrance` inside `scope` (transform + opacity only, for
 * GPU-cheap motion), using a single smooth deceleration ease. Honors reduced
 * motion by snapping straight to the resting state. A GSAP context scopes the
 * tweens so they're reverted cleanly when the screen unmounts.
 *
 * Usage:
 *   const root = useRef<HTMLDivElement>(null);
 *   useEntrance(root);
 *   return <div ref={root}>...<Card data-entrance/>...</div>;
 */
export function useEntrance(scope: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const el = scope.current;
    if (!el) return;
    const targets = el.querySelectorAll<HTMLElement>('[data-entrance]');
    if (targets.length === 0) return;

    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: 'power3.out',
          stagger: 0.07,
          clearProps: 'transform',
        },
      );
    }, el);

    return () => ctx.revert();
  }, [scope]);
}
