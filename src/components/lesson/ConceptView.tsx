import type { ConceptStep } from '@/content/types';
import { VisualView } from '@/components/visuals/VisualView';
import { cn } from '@/lib/cn';

export function ConceptView({ step }: { step: ConceptStep }) {
  const paragraphs = step.body.split('\n\n');
  const hasVisual = Boolean(step.visual);

  return (
    <div
      className={cn(
        'animate-fade-in',
        hasVisual && 'lg:grid lg:grid-cols-2 lg:items-center lg:gap-10',
      )}
    >
      <div className={cn(!hasVisual && 'mx-auto max-w-2xl')}>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">{step.title}</h2>
        <div className="mt-4 space-y-3">
          {paragraphs.map((paragraph, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-slate-300">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
      {step.visual ? (
        <div className="mt-6 lg:mt-0">
          <VisualView visual={step.visual} />
        </div>
      ) : null}
    </div>
  );
}
