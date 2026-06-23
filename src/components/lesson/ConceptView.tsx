import type { ConceptStep } from '@/content/types';
import { VisualView } from '@/components/visuals/VisualView';

export function ConceptView({ step }: { step: ConceptStep }) {
  const paragraphs = step.body.split('\n\n');
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-extrabold tracking-tight text-white">{step.title}</h2>
      {step.visual ? (
        <div className="mt-4">
          <VisualView visual={step.visual} />
        </div>
      ) : null}
      <div className="mt-4 space-y-3">
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="text-[15px] leading-relaxed text-slate-300">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
