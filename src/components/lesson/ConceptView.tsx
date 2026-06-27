import { useEffect, useMemo, useState } from 'react';
import type { ConceptStep } from '@/content/types';
import { VisualView } from '@/components/visuals/VisualView';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export function ConceptView({ step }: { step: ConceptStep }) {
  const [speaking, setSpeaking] = useState(false);
  const paragraphs = step.body.split('\n\n');
  const hasVisual = Boolean(step.visual);
  const speechText = useMemo(() => `${step.title}. ${step.body.replace(/\n+/g, ' ')}`, [step]);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [step.id]);

  function toggleSpeech() {
    if (!canSpeak) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div
      className={cn(
        'animate-fade-in',
        hasVisual && 'lg:grid lg:grid-cols-2 lg:items-center lg:gap-14',
      )}
    >
      <div className={cn(!hasVisual && 'mx-auto max-w-3xl')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white lg:text-4xl">
            {step.title}
          </h2>
          {canSpeak ? (
            <Button variant="secondary" size="md" onClick={toggleSpeech} className="shrink-0">
              {speaking ? 'Stop audio' : 'Read aloud'}
            </Button>
          ) : null}
        </div>
        <div className="mt-4 space-y-3 lg:space-y-5">
          {paragraphs.map((paragraph, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-slate-300 lg:text-lg">
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
