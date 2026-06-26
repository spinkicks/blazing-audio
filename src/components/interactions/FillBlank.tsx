import { cn } from '@/lib/cn';

interface FillBlankProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Free-text answer box for AI-generated fill-in-the-blank questions. There is no
 * single correct string; the server (OpenAI) judges the meaning of the answer.
 */
export function FillBlank({ value, onChange, disabled, placeholder }: FillBlankProps) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      rows={2}
      placeholder={placeholder ?? 'Type your answer in your own words...'}
      className={cn(
        'w-full resize-none border border-white/10 bg-ink-700/60 p-3 text-base text-slate-100',
        'placeholder:text-slate-500 focus:border-wave-400 focus:outline-none',
        'disabled:cursor-default disabled:opacity-60',
      )}
    />
  );
}
